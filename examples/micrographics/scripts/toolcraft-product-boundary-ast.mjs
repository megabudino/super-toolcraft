import path from "node:path";

import ts from "typescript";

import {
  builtInControlExportNames,
  runtimeSurfaceComponentNames,
} from "./toolcraft-integrity-policy.mjs";
import { inspectToolcraftProductStyleNode } from "./toolcraft-product-style-boundary.mjs";
import { createToolcraftStaticStringResolver } from "./toolcraft-static-string.mjs";
import {
  createSourceFile,
  getNodeLocation,
} from "./toolcraft-product-boundary-ast-utils.mjs";

export { inspectToolcraftProductCss } from "./toolcraft-product-style-boundary.mjs";

const runtimeSurfaceNames = new Set(runtimeSurfaceComponentNames);
const builtInControlNames = new Set(builtInControlExportNames);
const runtimeModelPresentationInternalNames = new Set([
  "ToolcraftModelCanvasLayer",
  "ToolcraftModelCanvasLayers",
  "ToolcraftModelRenderProvider",
  "useOptionalToolcraftModelRenderHost",
  "useToolcraftModelRenderHost",
]);

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

export function collectToolcraftModuleSpecifiers({ absolutePath, rawSource }) {
  const sourceFile = createSourceFile(absolutePath, rawSource);
  const resolveStaticString = createToolcraftStaticStringResolver(sourceFile);
  const moduleSpecifiers = [];

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      moduleSpecifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression &&
      ts.isStringLiteralLike(node.moduleReference.expression)
    ) {
      moduleSpecifiers.push(node.moduleReference.expression.text);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require")) &&
      node.arguments.length > 0
    ) {
      const moduleSpecifier = resolveStaticString(node.arguments[0]);
      if (moduleSpecifier !== undefined) moduleSpecifiers.push(moduleSpecifier);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return moduleSpecifiers;
}

function resolveSpecifierPath(sourceFilePath, moduleSpecifier, rootDir) {
  if (moduleSpecifier.startsWith("@/") || moduleSpecifier.startsWith("#/")) {
    return toPosixPath(path.resolve(rootDir, "src", moduleSpecifier.slice(2)));
  }
  if (moduleSpecifier.startsWith("/")) {
    return toPosixPath(path.resolve(rootDir, moduleSpecifier.slice(1)));
  }
  if (moduleSpecifier.startsWith(".")) {
    return toPosixPath(path.resolve(path.dirname(sourceFilePath), moduleSpecifier));
  }
  return null;
}

function getSensitiveModuleKind(sourceFilePath, moduleSpecifier, rootDir) {
  const normalizedSpecifier = moduleSpecifier.replaceAll("\\", "/");
  const resolvedSpecifier = resolveSpecifierPath(
    sourceFilePath,
    normalizedSpecifier,
    rootDir,
  );

  if (
    /^@repo\/toolcraft-runtime\/react\/model-rendering(?:\/|$)/u.test(
      normalizedSpecifier,
    ) ||
    /^[#@]\/toolcraft\/runtime\/react\/model-rendering(?:\/|$)/u.test(
      normalizedSpecifier,
    ) ||
    resolvedSpecifier?.includes("/src/toolcraft/runtime/react/model-rendering")
  ) {
    return "runtime-model-presentation";
  }

  if (
    /^three\/(?:addons|examples\/jsm)\/loaders(?:\/|$)/u.test(
      normalizedSpecifier,
    ) ||
    /^@gltf-transform(?:\/|$)/u.test(normalizedSpecifier) ||
    /^@repo\/toolcraft-runtime\/model-import(?:\/|$)/u.test(
      normalizedSpecifier,
    ) ||
    /^[#@]\/toolcraft\/runtime\/model-import(?:\/|$)/u.test(
      normalizedSpecifier,
    ) ||
    resolvedSpecifier?.includes("/src/toolcraft/runtime/model-import")
  ) {
    return "runtime-model-import";
  }

  if (
    /^@repo\/toolcraft-runtime\/react(?:\/|$)/u.test(normalizedSpecifier) ||
    /^[#@]\/toolcraft\/runtime\/react(?:\/|$)/u.test(normalizedSpecifier) ||
    resolvedSpecifier?.includes("/src/toolcraft/runtime/react")
  ) {
    return "runtime-react";
  }

  if (
    /^@repo\/ui(?:\/controls(?:\/|$)|$)/u.test(normalizedSpecifier) ||
    /^[#@]\/toolcraft\/ui(?:\/components\/controls(?:\/|$)|\/controls(?:\/|$)|$)/u.test(
      normalizedSpecifier,
    ) ||
    resolvedSpecifier?.includes("/src/toolcraft/ui/components/controls") ||
    /\/src\/toolcraft\/ui$/u.test(resolvedSpecifier ?? "")
  ) {
    return "ui-controls";
  }

  return null;
}

function isForbiddenNamedExport(moduleKind, importedName) {
  if (
    moduleKind === "runtime-model-import" ||
    moduleKind === "runtime-model-presentation"
  ) return true;
  return moduleKind === "runtime-react"
    ? runtimeSurfaceNames.has(importedName) ||
        runtimeModelPresentationInternalNames.has(importedName)
    : builtInControlNames.has(importedName) ||
        (importedName.endsWith("Control") &&
          importedName !== "createControlHistoryGroupId");
}

function createViolation({
  importedName,
  kind,
  moduleSpecifier,
  node,
  repoPath,
  sourceFile,
}) {
  const subject = importedName ? ` ${importedName}` : "";
  const message =
    kind === "runtime-surface"
      ? `Product source must not import or re-export host-owned runtime surface${subject} from ${moduleSpecifier}. Use ToolcraftAppComposition, schema, canvasContent, controlRenderers, onPanelAction, and runtime commands.`
      : kind === "runtime-model-presentation-ownership"
        ? `Product source must not import raw model render hosts or standard model canvas internals${subject} from ${moduleSpecifier}. Declare modelPresentation and use useToolcraftModelPresentationConsumer for visible custom model output.`
      : kind === "runtime-model-import-ownership"
        ? `Product source must not import or re-export model loaders, topology/repair infrastructure, or runtime model-import internals${subject} from ${moduleSpecifier}. Declare a model fileDrop in schema and use the runtime-owned import, analysis, repair, persistence, preview, and export pipeline.`
        : `Product source must not import or re-export built-in control${subject} from ${moduleSpecifier}. Declare it through schema or justify a true custom controlRenderer.`;
  return {
    ...getNodeLocation(sourceFile, node),
    kind,
    message,
    repoPath,
  };
}

export function inspectToolcraftProductSource({
  absolutePath,
  rawSource,
  repoPath,
  rootDir,
}) {
  const sourceFile = createSourceFile(absolutePath, rawSource);
  const resolveStaticString = createToolcraftStaticStringResolver(sourceFile);
  const violations = [];

  function report(node, moduleSpecifier, moduleKind, importedName) {
    if (importedName && !isForbiddenNamedExport(moduleKind, importedName)) {
      return;
    }
    violations.push(
      createViolation({
        importedName,
        kind:
          moduleKind === "runtime-model-presentation"
            ? "runtime-model-presentation-ownership"
            : moduleKind === "runtime-react"
            ? runtimeModelPresentationInternalNames.has(importedName)
              ? "runtime-model-presentation-ownership"
              : "runtime-surface"
            : moduleKind === "runtime-model-import"
              ? "runtime-model-import-ownership"
              : "built-in-control",
        moduleSpecifier,
        node,
        repoPath,
        sourceFile,
      }),
    );
  }

  function getModuleKind(moduleSpecifier) {
    return getSensitiveModuleKind(absolutePath, moduleSpecifier, rootDir);
  }

  function visit(node) {
    violations.push(
      ...inspectToolcraftProductStyleNode({
        node,
        repoPath,
        resolveStaticString,
        sourceFile,
      }),
    );

    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      const moduleSpecifier = node.moduleSpecifier.text;
      const moduleKind = getModuleKind(moduleSpecifier);
      const importClause = node.importClause;

      if (moduleKind && importClause && !importClause.isTypeOnly) {
        if (importClause.name) report(importClause.name, moduleSpecifier, moduleKind);
        const bindings = importClause.namedBindings;
        if (bindings && ts.isNamespaceImport(bindings)) {
          report(bindings, moduleSpecifier, moduleKind);
        } else if (bindings && ts.isNamedImports(bindings)) {
          for (const element of bindings.elements) {
            if (!element.isTypeOnly) {
              report(
                element,
                moduleSpecifier,
                moduleKind,
                element.propertyName?.text ?? element.name.text,
              );
            }
          }
        }
      }
    }

    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      const moduleSpecifier = node.moduleSpecifier.text;
      const moduleKind = getModuleKind(moduleSpecifier);

      if (moduleKind && !node.isTypeOnly) {
        if (!node.exportClause || ts.isNamespaceExport(node.exportClause)) {
          report(node, moduleSpecifier, moduleKind);
        } else if (ts.isNamedExports(node.exportClause)) {
          for (const element of node.exportClause.elements) {
            if (!element.isTypeOnly) {
              report(
                element,
                moduleSpecifier,
                moduleKind,
                element.propertyName?.text ?? element.name.text,
              );
            }
          }
        }
      }
    }

    if (
      ts.isImportEqualsDeclaration(node) &&
      !node.isTypeOnly &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression &&
      ts.isStringLiteralLike(node.moduleReference.expression)
    ) {
      const moduleSpecifier = node.moduleReference.expression.text;
      const moduleKind = getModuleKind(moduleSpecifier);
      if (moduleKind) report(node, moduleSpecifier, moduleKind);
    }

    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require")) &&
      node.arguments.length > 0
    ) {
      const moduleSpecifier = resolveStaticString(node.arguments[0]);
      if (moduleSpecifier === undefined) {
        violations.push({
          ...getNodeLocation(sourceFile, node.arguments[0]),
          kind: "non-static-module-specifier",
          message:
            "Product import() and require() calls must use a statically resolvable string so the Toolcraft source boundary can verify the loaded module.",
          repoPath,
        });
        ts.forEachChild(node, visit);
        return;
      }
      const moduleKind = getModuleKind(moduleSpecifier);
      if (moduleKind) report(node, moduleSpecifier, moduleKind);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}
