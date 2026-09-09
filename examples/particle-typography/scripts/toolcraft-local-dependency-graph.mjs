import fs from "node:fs/promises";
import path from "node:path";

import { createToolcraftCssSourceRecord } from "./toolcraft-css-source-evidence.mjs";
import {
  isToolcraftLocalDependencySpecifier,
  resolveToolcraftLocalDependency,
  toolcraftModuleExtensions,
} from "./toolcraft-product-dependency-resolution.mjs";
import { createCanonicalGraphEntries } from "./toolcraft-source-inventory.mjs";
import { createToolcraftTypeScriptSourceRecord } from "./toolcraft-typescript-source-evidence.mjs";
function compareCodeUnits(left, right) { return left < right ? -1 : left > right ? 1 : 0; }

function toPosixPath(value) { return value.split(path.sep).join("/"); }

class ToolcraftReadonlyMap {
  #values;

  constructor(values) {
    this.#values = new Map(values);
    Object.freeze(this);
  }

  get size() { return this.#values.size; }
  entries() { return this.#values.entries(); }
  get(repoPath) { return this.#values.get(repoPath); }
  has(repoPath) { return this.#values.has(repoPath); }
  keys() { return this.#values.keys(); }
  values() { return this.#values.values(); }
  [Symbol.iterator]() { return this.#values[Symbol.iterator](); }
}
function freezeAdjacency(adjacency) {
  return new ToolcraftReadonlyMap(
    [...adjacency].map(([repoPath, dependencies]) => [
      repoPath,
      Object.freeze([...dependencies]),
    ]),
  );
}

function reverseAdjacency(forward) {
  const reverse = new Map([...forward.keys()].map((repoPath) => [repoPath, []]));
  for (const [importer, dependencies] of forward) {
    for (const dependency of dependencies) {
      reverse.get(dependency).push(importer);
    }
  }
  for (const importers of reverse.values()) importers.sort(compareCodeUnits);
  return reverse;
}

async function createEntrySourceRecord(entry, rootDir) {
  const extension = path.extname(entry.repoPath);
  const isModule = toolcraftModuleExtensions.includes(extension);
  const isCss = /\.css$/u.test(entry.repoPath);
  if (!isModule && !isCss) return undefined;
  const rawSource = await fs.readFile(entry.absolutePath, "utf8");
  return isModule
    ? createToolcraftTypeScriptSourceRecord({
        absolutePath: entry.absolutePath, rawSource,
        repoPath: entry.repoPath, rootDir,
      })
    : createToolcraftCssSourceRecord({
        rawSource,
        repoPath: entry.repoPath,
      });
}

function getEntryImports(entry, sourceRecord) {
  if (!sourceRecord.cssEvidence) return sourceRecord.imports;
  if (!/\.module\.css$/iu.test(entry.repoPath)) return [];
  return sourceRecord.cssEvidence.urlFacts
    .filter(({ local, quoted }) => local && quoted)
    .map(({ column, line, value }) => Object.freeze({
      category: "css-url",
      column,
      line,
      specifier:
        [".", "/", "@/"].some((prefix) => value.startsWith(prefix))
          ? value
          : `./${value}`,
      typeOnly: false,
    }));
}

async function createForwardEdges({ aliases, canonicalEntries, rootDir }) {
  const entryByAbsolutePath = new Map(
    canonicalEntries.map((entry) => [path.resolve(entry.absolutePath), entry]),
  );
  const forward = new Map();
  const moduleImports = [];
  const sourceRecords = new Map();
  const unresolvedImports = [];

  for (const entry of canonicalEntries) {
    const dependencies = new Set();
    const sourceRecord = await createEntrySourceRecord(entry, rootDir);
    if (sourceRecord) sourceRecords.set(entry.repoPath, sourceRecord);
    const imports = sourceRecord ? getEntryImports(entry, sourceRecord) : [];
    for (const imported of imports) {
      const resolved = imported.specifier && resolveToolcraftLocalDependency({
        aliases,
        allowUnscanned: true,
        entryByAbsolutePath,
        importer: entry,
        rootDir,
        specifier: imported.specifier,
        unscannedExtensions: [...toolcraftModuleExtensions, ".css"],
      });
      const dependency = resolved && entryByAbsolutePath.get(resolved);
      let resolution = imported.specifier ? "external" : "non-static";
      let resolvedRepoPath;
      if (dependency) {
        resolution = "resolved";
        resolvedRepoPath = dependency.repoPath;
      } else if (resolved) {
        resolution = "outside-inventory";
        resolvedRepoPath = toPosixPath(path.relative(rootDir, resolved));
      } else if (
        imported.specifier &&
        isToolcraftLocalDependencySpecifier({
          aliases,
          importer: entry,
          specifier: imported.specifier,
        })
      ) {
        resolution = "unresolved-local";
      }
      moduleImports.push(Object.freeze({
        ...imported, importerRepoPath: entry.repoPath, resolution,
        ...(resolvedRepoPath ? { resolvedRepoPath } : {}),
      }));
      if (dependency && !imported.typeOnly) {
        dependencies.add(dependency.repoPath);
      } else if (
        resolution === "outside-inventory" ||
        resolution === "unresolved-local"
      ) {
        unresolvedImports.push(Object.freeze({
          importerRepoPath: entry.repoPath, reason: resolution,
          ...(resolvedRepoPath ? { resolvedRepoPath } : {}),
          specifier: imported.specifier,
        }));
      }
    }
    forward.set(entry.repoPath, [...dependencies].sort(compareCodeUnits));
  }
  return { forward, moduleImports, sourceRecords, unresolvedImports };
}

export async function createToolcraftLocalDependencyGraph({
  aliases = [],
  entries,
  explicitResourcePaths = [],
  rootDir,
}) {
  const canonicalEntries = createCanonicalGraphEntries({
    entries,
    explicitResourcePaths,
    rootDir,
  }).map((entry) => Object.freeze({ ...entry }));
  const graph = await createForwardEdges({ aliases, canonicalEntries, rootDir });
  return Object.freeze({
    entries: Object.freeze(canonicalEntries),
    forward: freezeAdjacency(graph.forward),
    moduleImports: Object.freeze(graph.moduleImports),
    reverse: freezeAdjacency(reverseAdjacency(graph.forward)),
    sourceRecords: new ToolcraftReadonlyMap(graph.sourceRecords),
    unresolvedImports: Object.freeze(graph.unresolvedImports),
  });
}

function canonicalizeCycle(cycle) {
  const nodes = cycle.slice(0, -1);
  const rotations = nodes.map((_, index) => {
    const rotated = [...nodes.slice(index), ...nodes.slice(0, index)];
    return [...rotated, rotated[0]];
  });
  return rotations.sort(
    (left, right) => compareCodeUnits(left.join("\0"), right.join("\0")),
  )[0];
}

function findStronglyConnectedComponents(adjacency) {
  const components = [];
  const indexByNode = new Map();
  const lowLinkByNode = new Map();
  const stack = [];
  const stacked = new Set();
  let nextIndex = 0;

  function visit(node) {
    indexByNode.set(node, nextIndex);
    lowLinkByNode.set(node, nextIndex);
    nextIndex += 1;
    stack.push(node);
    stacked.add(node);

    for (const dependency of adjacency.get(node) ?? []) {
      if (!indexByNode.has(dependency)) {
        visit(dependency);
        lowLinkByNode.set(
          node,
          Math.min(lowLinkByNode.get(node), lowLinkByNode.get(dependency)),
        );
      } else if (stacked.has(dependency)) {
        lowLinkByNode.set(
          node,
          Math.min(lowLinkByNode.get(node), indexByNode.get(dependency)),
        );
      }
    }

    if (lowLinkByNode.get(node) !== indexByNode.get(node)) return;
    const component = [];
    let member;
    do {
      member = stack.pop();
      stacked.delete(member);
      component.push(member);
    } while (member !== node);
    components.push(component.sort(compareCodeUnits));
  }

  for (const node of [...adjacency.keys()].sort(compareCodeUnits)) {
    if (!indexByNode.has(node)) visit(node);
  }
  return components;
}

function reconstructCycle(predecessor, current, start) {
  const reversed = [current];
  while (reversed.at(-1) !== start) {
    reversed.push(predecessor.get(reversed.at(-1)));
  }
  return canonicalizeCycle([...reversed.reverse(), start]);
}

function findShortestCycleInComponent(adjacency, component) {
  const members = new Set(component);
  let shortest;
  for (const start of component) {
    const queue = [start];
    const predecessor = new Map([[start, null]]);
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const current = queue[cursor];
      for (const dependency of adjacency.get(current) ?? []) {
        if (!members.has(dependency)) continue;
        if (dependency === start) {
          const candidate = reconstructCycle(predecessor, current, start);
          if (
            !shortest ||
            candidate.length < shortest.length ||
            (candidate.length === shortest.length &&
              compareCodeUnits(candidate.join("\0"), shortest.join("\0")) < 0)
          ) {
            shortest = candidate;
          }
        } else if (!predecessor.has(dependency)) {
          predecessor.set(dependency, current);
          queue.push(dependency);
        }
      }
    }
  }
  return shortest;
}

function findShortestCycles(adjacency) {
  return findStronglyConnectedComponents(adjacency)
    .filter(
      (component) =>
        component.length > 1 ||
        (adjacency.get(component[0]) ?? []).includes(component[0]),
    )
    .map((component) => findShortestCycleInComponent(adjacency, component))
    .filter(Boolean)
    .sort((left, right) => compareCodeUnits(left.join("\0"), right.join("\0")));
}

export function getToolcraftProductionCycleViolations(
  graph,
  { ignoredFilePatterns = [], includedFilePatterns = [] } = {},
) {
  const productionPaths = new Set(
    graph.entries
      .filter(
        (entry) =>
          entry.owner === "product" &&
          entry.role === "production" &&
          toolcraftModuleExtensions.includes(path.extname(entry.repoPath)) &&
          (includedFilePatterns.length === 0 ||
            includedFilePatterns.some((pattern) => pattern.test(entry.repoPath))) &&
          !ignoredFilePatterns.some((pattern) => pattern.test(entry.repoPath)),
      )
      .map((entry) => entry.repoPath),
  );
  const adjacency = new Map(
    [...productionPaths].map((repoPath) => [
      repoPath,
      (graph.forward.get(repoPath) ?? []).filter((dependency) =>
        productionPaths.has(dependency),
      ),
    ]),
  );
  return findShortestCycles(adjacency).map((cycle) => ({
    cycle: cycle.map(toPosixPath),
    reason: "Product production modules must form an acyclic dependency graph.",
    repoPath: cycle[0],
  }));
}

function getReverseReachablePaths(graph, changedPaths) {
  const queue = changedPaths.map((repoPath) =>
    toPosixPath(repoPath).replace(/^\.\//u, ""),
  );
  const reachable = new Set(queue);
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    for (const importer of graph.reverse.get(queue[cursor]) ?? []) {
      if (reachable.has(importer)) continue;
      reachable.add(importer);
      queue.push(importer);
    }
  }
  return reachable;
}

export function getToolcraftAffectedTestFiles(graph, changedPaths) {
  const reachable = getReverseReachablePaths(graph, changedPaths);
  return graph.entries
    .filter((entry) => entry.role === "test" && reachable.has(entry.repoPath))
    .map((entry) => entry.repoPath)
    .sort(compareCodeUnits);
}

export function getToolcraftStrongestImporters(graph, changedPath) {
  const normalizedChangedPath = toPosixPath(changedPath).replace(/^\.\//u, "");
  const reachable = getReverseReachablePaths(graph, [normalizedChangedPath]);
  return graph.entries
    .filter(
      (entry) =>
        entry.repoPath !== normalizedChangedPath &&
        entry.owner === "product" &&
        entry.role === "production" &&
        toolcraftModuleExtensions.includes(path.extname(entry.repoPath)) &&
        reachable.has(entry.repoPath),
    )
    .map((entry) => entry.repoPath)
    .sort(compareCodeUnits);
}
