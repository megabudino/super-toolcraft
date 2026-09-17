import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { parseDefaultResourcePath, pruneEmptyDefaultResourceDirectories, requireDefaultResourceDirectory, verifyDefaultResourceFile } from "./toolcraft-default-resource-files.mjs";

function resources(snapshot) {
  if (snapshot === null || snapshot?.version === 1) return [];
  if (snapshot?.version !== 2 || !Array.isArray(snapshot.resources)) throw new Error("Cannot read the previous default resource manifest.");
  return snapshot.resources;
}

function entry(resource) {
  const { digest } = parseDefaultResourcePath(resource?.path);
  if (digest !== resource.sha256 || !Number.isSafeInteger(resource.byteLength) || resource.byteLength < 0) throw new Error("Invalid retired resource metadata.");
  return { path: resource.path, sha256: digest, byteLength: resource.byteLength };
}

/** Host-private recovery record. A pending path never overrides current reachability. */
export function createDefaultResourceCleanup(appRoot) {
  const file = path.join(appRoot, ".toolcraft/default-resource-cleanup.json");
  async function read() {
    try {
      await requireDefaultResourceDirectory(appRoot, [".toolcraft"]);
      const stat = await fs.lstat(file);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("Default resource cleanup record must be a regular project file.");
      const value = JSON.parse(await fs.readFile(file, "utf8"));
      if (value.version !== 1 || !Array.isArray(value.resources)) throw new Error("Invalid default resource cleanup record.");
      return value.resources.map(entry);
    } catch (error) { if (error.code === "ENOENT") return []; throw error; }
  }
  async function write(pending) {
    await requireDefaultResourceDirectory(appRoot, [".toolcraft"], true);
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, JSON.stringify({ version: 1, resources: pending }, null, 2) + "\n", { flag: "wx" });
      await fs.rename(temporary, file);
    } finally { await fs.rm(temporary, { force: true }); }
  }
  return {
    async prepare(previous, next) {
      const active = new Set(resources(next).map(resource => resource.path));
      const pending = new Map((await read()).map(resource => [resource.path, resource]));
      for (const resource of resources(previous)) {
        if (!active.has(resource.path)) pending.set(resource.path, entry(resource));
      }
      for (const resourcePath of active) pending.delete(resourcePath);
      if (pending.size) await write([...pending.values()]);
    },
    async finish(readCurrent) {
      const pending = await read();
      if (!pending.length) return;
      const remaining = [];
      const failures = [];
      for (const resource of pending) {
        try {
          const active = new Set(resources(await readCurrent()).map(item => item.path));
          if (active.has(resource.path)) continue;
          const target = await verifyDefaultResourceFile(appRoot, resource);
          // Recheck after file I/O, in case the source was edited outside this server.
          if (resources(await readCurrent()).some(item => item.path === resource.path)) continue;
          await fs.unlink(target);
          await pruneEmptyDefaultResourceDirectories(appRoot, resource.path);
        } catch (error) {
          if (error.code === "ENOENT") continue;
          remaining.push(resource);
          failures.push(error);
        }
      }
      await write(remaining);
      if (failures.length) throw new Error(`Defaults were saved, but ${failures.length} retired file(s) could not be removed. Retry Save as Defaults after resolving: ${failures[0].message}`);
    },
  };
}
