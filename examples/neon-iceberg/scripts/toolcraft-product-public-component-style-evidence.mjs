import {
  getToolcraftOwnedComponentChromeDomains,
  getToolcraftOwnedCssDeclarationDomains,
  getToolcraftOwnedPublicComponent,
} from "./toolcraft-public-component-style-policy.mjs";
import { createToolcraftProductClassValueEvidence } from
  "./toolcraft-product-class-value-evidence.mjs";

const CLASS_NAME_PROPERTY = Object.freeze({ canonical: "classname", typed: "className" });
const STYLE_PROPERTY = Object.freeze({ canonical: "style", typed: "style" });

function propertyName(node, resolveStaticString, ts) {
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node) ||
    ts.isNumericLiteral(node)) return node.text.toLowerCase();
  return ts.isComputedPropertyName(node)
    ? resolveStaticString(node.expression)?.toLowerCase()
    : undefined;
}

export function createToolcraftProductPublicComponentStyleEvidence({
  checker,
  flowValues,
  hostConstruction,
  repoPath,
  resolveCssModuleClass,
  resolveStaticString,
  ts,
}) {
  const { unwrap } = flowValues;

  const classEvidence = createToolcraftProductClassValueEvidence({
    checker,
    flowValues,
    resolveStaticString,
    ts,
  });

  function finalProperty(attributes, expected) {
    let evidence = { kind: "absent" };
    for (const attribute of attributes.properties) {
      if (ts.isJsxSpreadAttribute(attribute)) {
        const spread = flowValues.propertyAt(
          attribute.expression, expected.typed, attribute,
        );
        if (spread.kind === "exact") {
          evidence = spread.values.length === 1
            ? { kind: "value", value: spread.values[0] }
            : { kind: "unknown" };
        } else if (spread.kind === "unknown") evidence = spread;
        continue;
      }
      if (propertyName(attribute.name, resolveStaticString, ts) !==
        expected.canonical) {
        continue;
      }
      if (!attribute.initializer) return { kind: "unknown" };
      if (ts.isStringLiteralLike(attribute.initializer)) {
        evidence = { kind: "value", value: attribute.initializer };
        continue;
      }
      const expression = ts.isJsxExpression(attribute.initializer)
        ? attribute.initializer.expression : undefined;
      evidence = expression
        ? { kind: "value", value: expression }
        : { kind: "unknown" };
    }
    return evidence;
  }

  function styleProperties(expression, useNode = expression) {
    const object = flowValues.objectAt(expression, useNode);
    if (object.kind !== "object") {
      return new Map([["*", "unresolved-style"]]);
    }
    const properties = new Map();
    for (const variant of object.variants) {
      if (["string", "symbol"].some((domain) =>
        variant.propertyRemainder?.[domain]?.alternatives?.some(
          ({ kind }) => kind !== "absent"
        ))) properties.set("*", "unresolved-style");
      for (const [name] of variant.properties) {
        const domains = getToolcraftOwnedCssDeclarationDomains(name);
        if (domains.length === 0) continue;
        const fact = flowValues.propertyAt(expression, name, useNode);
        if (fact.kind !== "exact") {
          properties.set("*", "unresolved-style");
          continue;
        }
        const active = fact.values.some((value) => {
          const item = unwrap(value);
          return item.kind !== ts.SyntaxKind.NullKeyword &&
            !(ts.isIdentifier(item) && item.text === "undefined");
        });
        if (active) properties.set(name, domains.join("/"));
      }
    }
    return properties;
  }

  return function inspectPublicComponentStyle(node) {
    if (!ts.isJsxOpeningElement(node) && !ts.isJsxSelfClosingElement(node)) {
      return undefined;
    }
    const origins = hostConstruction.originOf(node.tagName);
    const owner = origins.map(getToolcraftOwnedPublicComponent).find(Boolean);
    if (!owner) return undefined;
    const className = finalProperty(node.attributes, CLASS_NAME_PROPERTY);
    const style = finalProperty(node.attributes, STYLE_PROPERTY);
    const domains = [];
    if (className.kind === "unknown") domains.push("unresolved-class");
    if (className.kind === "value") {
      const evidence = classEvidence(className.value);
      if (evidence.kind === "unknown") domains.push("unresolved-class");
      else {
        domains.push(...evidence.tokens.flatMap(
          getToolcraftOwnedComponentChromeDomains,
        ));
        for (const cssClass of evidence.cssClasses ?? []) {
          const fact = resolveCssModuleClass?.({
            ...cssClass,
            importerRepoPath: repoPath,
            tag: owner.exportName === "Anchor" ? "a" : "button",
          });
          if (!fact) domains.push("unresolved-class");
          else domains.push(...fact.domains);
        }
      }
    }
    if (style.kind === "unknown") domains.push("unresolved-style");
    if (style.kind === "value") {
      domains.push(...styleProperties(style.value).values());
    }
    const uniqueDomains = [...new Set(domains)];
    return uniqueDomains.length > 0
      ? { component: owner.exportName, domains: uniqueDomains, node }
      : undefined;
  };
}
