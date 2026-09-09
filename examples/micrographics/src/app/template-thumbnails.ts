import { generateTemplateContent } from "./poster-model";
import type { PosterPrimitive } from "./poster-types";
import {
  micrographTemplates,
  templateAspect,
  type MicrographTemplateId,
} from "./template-catalog";
import {
  buildTemplatePrimitives,
  parseTemplateContent,
} from "./template-renderers";

const THUMBNAIL_INK = "#F4F2EC";
const THUMBNAIL_PAPER = "#141414";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function thumbnailRng(seed: number): () => number {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function primitiveMarkup(primitive: PosterPrimitive, stroke: number): string {
  const ink = THUMBNAIL_INK;
  const paper = THUMBNAIL_PAPER;

  switch (primitive.kind) {
    case "line":
      return `<line x1="${primitive.x1}" y1="${primitive.y1}" x2="${primitive.x2}" y2="${primitive.y2}" stroke="${ink}" stroke-width="${stroke * (primitive.width ?? 1)}"/>`;
    case "rect": {
      const fill =
        primitive.fill && primitive.fill !== "none"
          ? primitive.fill === "paper"
            ? paper
            : ink
          : "none";
      return `<rect x="${primitive.x}" y="${primitive.y}" width="${primitive.width}" height="${primitive.height}" fill="${fill}" stroke="${primitive.stroke ? ink : "none"}" stroke-width="${stroke}"/>`;
    }
    case "circle": {
      const fill =
        primitive.fill && primitive.fill !== "none"
          ? primitive.fill === "paper"
            ? paper
            : ink
          : "none";
      return `<circle cx="${primitive.x}" cy="${primitive.y}" r="${primitive.radius}" fill="${fill}" stroke="${primitive.stroke ? ink : "none"}" stroke-width="${stroke}"/>`;
    }
    case "polyline": {
      const fill =
        primitive.fill && primitive.fill !== "none"
          ? primitive.fill === "paper"
            ? paper
            : ink
          : "none";
      if ((primitive.holes?.length ?? 0) > 0) {
        const ring = (points: readonly (readonly [number, number])[]): string =>
          points.length > 0
            ? `M${points.map(([x, y]) => `${x} ${y}`).join("L")}Z`
            : "";
        const d = [primitive.points, ...(primitive.holes ?? [])].map(ring).join("");
        return `<path d="${d}" fill="${fill}" fill-rule="evenodd" stroke="${fill === "none" ? ink : "none"}" stroke-width="${stroke * (primitive.width ?? 1)}"/>`;
      }
      const points = primitive.points.map(([x, y]) => `${x},${y}`).join(" ");
      const tag = primitive.closed || (primitive.fill && primitive.fill !== "none")
        ? "polygon"
        : "polyline";
      return `<${tag} points="${points}" fill="${fill}" stroke="${fill === "none" ? ink : "none"}" stroke-width="${stroke * (primitive.width ?? 1)}"/>`;
    }
    case "text": {
      const anchor =
        primitive.align === "center"
          ? "middle"
          : primitive.align === "right"
            ? "end"
            : "start";
      const family =
        primitive.family === "sans"
          ? "Inter Variable, Helvetica Neue, Arial, sans-serif"
          : "IBM Plex Mono, ui-monospace, monospace";
      return `<text x="${primitive.x}" y="${primitive.y}" font-size="${primitive.size}" font-family="${escapeXml(family)}" font-weight="${primitive.weight ?? 500}" text-anchor="${anchor}" letter-spacing="${primitive.letterSpacing ?? 0}" fill="${primitive.fill === "paper" ? paper : ink}">${escapeXml(primitive.text)}</text>`;
    }
  }
}

function templateThumbnail(template: MicrographTemplateId): string {
  const aspect = templateAspect(template);
  const width = 240;
  const height = Math.round(width / aspect);
  const pad = 20;
  const primitives = buildTemplatePrimitives(template, {
    height: height - pad * 2,
    lines: parseTemplateContent(generateTemplateContent(template, 137)),
    rng: thumbnailRng(9241),
    stroke: 1.6,
    typeScale: 1,
    width: width - pad * 2,
  });
  const body = primitives
    .map((primitive) => primitiveMarkup(primitive, 1.6))
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${THUMBNAIL_PAPER}"/><g transform="translate(${pad} ${pad})">${body}</g></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const micrographTemplateItems = micrographTemplates.map((template) => ({
  alt: `${template.label} template`,
  src: templateThumbnail(template.id),
  value: template.id,
}));
