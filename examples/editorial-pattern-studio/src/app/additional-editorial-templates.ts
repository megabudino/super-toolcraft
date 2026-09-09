import type {
  EditorialTemplate,
  EditorialTemplateAnnotation,
} from "./editorial-templates";

type AnnotationLayout =
  | "bottom-register"
  | "cascade"
  | "matrix"
  | "side-rails"
  | "split-register"
  | "top-strip";

function createAnnotations(
  prefix: string,
  count: number,
  layout: AnnotationLayout,
): EditorialTemplateAnnotation[] {
  return Array.from({ length: count }, (_, index) => {
    const item = index + 1;
    const content = `${prefix} / ${String(item).padStart(2, "0")}`;
    const common = {
      content,
      fontSize: 0.0095,
      fontWeight: index % 3 === 0 ? 600 : 500,
      id: `${prefix.toLowerCase().replace(/\s+/g, "-")}-${item}`,
      letterSpacingEm: 0.035,
      lineHeight: 1.08,
      maxCharacters: 32,
      maxWidth: 0.2,
      opacity: 0.84,
    } as const;

    if (layout === "top-strip") {
      const columns = Math.min(5, Math.max(1, count));
      const column = index % columns;
      const row = Math.floor(index / columns);
      return {
        ...common,
        align: column === columns - 1 ? "right" : "left",
        x: columns === 1 ? 0.055 : 0.055 + (column / (columns - 1)) * 0.89,
        y: 0.15 + row * 0.037,
      };
    }

    if (layout === "bottom-register") {
      const columns = 4;
      const column = index % columns;
      const row = Math.floor(index / columns);
      return {
        ...common,
        align: column === columns - 1 ? "right" : "left",
        x: 0.055 + column * 0.2965,
        y: 0.63 + row * 0.043,
      };
    }

    if (layout === "side-rails") {
      const right = index % 2 === 1;
      return {
        ...common,
        align: right ? "right" : "left",
        maxWidth: 0.24,
        rotation: right ? 90 : -90,
        x: right ? 0.955 : 0.045,
        y: 0.22 + Math.floor(index / 2) * 0.09,
      };
    }

    if (layout === "split-register") {
      const right = index % 2 === 1;
      return {
        ...common,
        x: right ? 0.73 : 0.52,
        y: 0.18 + Math.floor(index / 2) * 0.052,
      };
    }

    if (layout === "cascade") {
      const column = index % 4;
      const row = Math.floor(index / 4);
      return {
        ...common,
        align: column === 3 ? "right" : "left",
        x: 0.055 + column * 0.2965,
        y: 0.28 + row * 0.055 + column * 0.008,
      };
    }

    const columns = 4;
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      ...common,
      align: column === columns - 1 ? "right" : "left",
      x: 0.055 + column * 0.2965,
      y: 0.31 + row * 0.052,
    };
  });
}

export const additionalEditorialTemplates = [
  {
    annotations: createAnnotations("BORDER LEDGER", 0, "side-rails"),
    copy: {
      body: "A border is not decoration. It is an agreement about where reading starts, where evidence accumulates, and where the page releases attention.",
      eyebrow: "BOUNDARY STUDY / 11",
      footer: "PERIMETER / ENTRY / RELEASE",
      headline: "THE PAGE\nHAS EDGES",
      marker: "11",
    },
    grid: { columns: 8, marginX: 0.055, marginY: 0.05, opacity: 0.08, rows: 20, showColumns: false, showRows: false },
    id: "border-ledger",
    label: "Border Ledger",
    pattern: { centerX: 0.66, centerY: 0.95, radius: 0.36 },
    rules: [
      { opacity: 0.55, weight: 1.25, x1: 0.055, x2: 0.945, y1: 0.1, y2: 0.1 },
      { opacity: 0.55, weight: 1.25, x1: 0.055, x2: 0.055, y1: 0.1, y2: 0.9 },
      { opacity: 0.55, weight: 1.25, x1: 0.945, x2: 0.945, y1: 0.1, y2: 0.9 },
      { opacity: 0.55, weight: 1.25, x1: 0.055, x2: 0.945, y1: 0.54, y2: 0.54 },
      { opacity: 0.55, weight: 1.25, x1: 0.055, x2: 0.945, y1: 0.72, y2: 0.72 },
    ],
    text: [
      { fontSize: 0.055, fontWeight: 560, letterSpacingEm: -0.04, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.15, source: "marker", x: 0.075, y: 0.17 },
      { align: "right", fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.05, lineHeight: 1.1, maxCharacters: 28, maxWidth: 0.28, source: "eyebrow", x: 0.925, y: 0.135 },
      { fontSize: 0.094, fontWeight: 540, letterSpacingEm: -0.06, lineHeight: 0.82, maxCharacters: 10, maxWidth: 0.54, source: "headline", x: 0.075, y: 0.25 },
      { fontSize: 0.014, fontWeight: 400, lineHeight: 1.24, maxCharacters: 28, maxWidth: 0.31, source: "body", x: 0.59, y: 0.25 },
      { fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 36, maxWidth: 0.36, source: "footer", x: 0.075, y: 0.63 },
      { align: "right", fontSize: 0.0115, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.4, source: "equation", x: 0.925, y: 0.61 },
    ],
  },
  {
    annotations: createAnnotations("SPLIT COLOPHON", 1, "split-register"),
    copy: {
      body: "Colophons reveal the invisible labor of a publication: sequence, correction, tools, contributors, and the conditions under which a page became public.",
      eyebrow: "PRODUCTION NOTE / 12",
      footer: "SET / PROOFED / RELEASED",
      headline: "SMALL TYPE\nCARRIES\nMEMORY",
      marker: "12",
    },
    grid: { columns: 6, marginX: 0.06, marginY: 0.05, opacity: 0.07, rows: 18, showColumns: false, showRows: false },
    id: "split-colophon",
    label: "Split Colophon",
    pattern: { centerX: 0.46, centerY: 1.01, radius: 0.44 },
    rules: [
      { opacity: 0.3, x1: 0.5, x2: 0.5, y1: 0.05, y2: 0.9 },
      { opacity: 0.42, x1: 0.055, x2: 0.945, y1: 0.44, y2: 0.44 },
      { opacity: 0.42, x1: 0.5, x2: 0.945, y1: 0.61, y2: 0.61 },
    ],
    text: [
      { fontSize: 0.041, fontWeight: 560, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.14, source: "marker", x: 0.06, y: 0.095 },
      { fontSize: 0.011, fontWeight: 600, letterSpacingEm: 0.045, lineHeight: 1.1, maxCharacters: 28, maxWidth: 0.28, source: "eyebrow", x: 0.56, y: 0.075 },
      { fontSize: 0.069, fontWeight: 550, letterSpacingEm: -0.05, lineHeight: 0.86, maxCharacters: 12, maxWidth: 0.37, source: "headline", x: 0.56, y: 0.2 },
      { fontSize: 0.0125, fontWeight: 400, lineHeight: 1.25, maxCharacters: 24, maxWidth: 0.28, source: "body", x: 0.66, y: 0.35 },
      { fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 32, maxWidth: 0.33, source: "footer", x: 0.56, y: 0.66 },
      { fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.37, source: "equation", x: 0.56, y: 0.52 },
    ],
  },
  {
    annotations: createAnnotations("RUNNING HEADER", 2, "top-strip"),
    copy: {
      body: "A running header is a quiet navigation system. Repeated language makes position legible while the larger composition is free to change below it.",
      eyebrow: "READING POSITION / 13",
      footer: "SECTION / SEQUENCE / RETURN",
      headline: "READING\nBEGINS\nABOVE",
      marker: "13",
    },
    grid: { columns: 16, marginX: 0.045, marginY: 0.04, opacity: 0.07, rows: 24, showColumns: false, showRows: false },
    id: "running-header",
    label: "Running Header",
    pattern: { centerX: 0.7, centerY: 0.9, radius: 0.32 },
    rules: [
      { opacity: 0.48, x1: 0.045, x2: 0.955, y1: 0.085, y2: 0.085 },
      { opacity: 0.48, x1: 0.045, x2: 0.955, y1: 0.46, y2: 0.46 },
      { opacity: 0.48, x1: 0.045, x2: 0.955, y1: 0.64, y2: 0.64 },
    ],
    text: [
      { align: "right", fontSize: 0.04, fontWeight: 550, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.12, source: "marker", x: 0.955, y: 0.065 },
      { fontSize: 0.0105, fontWeight: 600, letterSpacingEm: 0.06, lineHeight: 1.1, maxCharacters: 32, maxWidth: 0.4, source: "eyebrow", x: 0.045, y: 0.05 },
      { fontSize: 0.104, fontWeight: 540, letterSpacingEm: -0.065, lineHeight: 0.78, maxCharacters: 10, maxWidth: 0.66, source: "headline", x: 0.17, y: 0.21 },
      { fontSize: 0.013, fontWeight: 400, lineHeight: 1.23, maxCharacters: 27, maxWidth: 0.31, source: "body", x: 0.045, y: 0.53 },
      { align: "right", fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 34, maxWidth: 0.34, source: "footer", x: 0.955, y: 0.615 },
      { fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.4, source: "equation", x: 0.54, y: 0.53 },
    ],
  },
  {
    annotations: createAnnotations("CENTER CASCADE", 3, "cascade"),
    copy: {
      body: "Centered type can be dynamic when each line changes width. The eye follows a cascade of masses instead of a single symmetrical block.",
      eyebrow: "OPTICAL MASS / 14",
      footer: "WIDTH / WEIGHT / DESCENT",
      headline: "WORDS FIND\nTHEIR\nGRAVITY",
      marker: "14",
    },
    grid: { columns: 10, marginX: 0.055, marginY: 0.05, opacity: 0.08, rows: 20, showColumns: false, showRows: false },
    id: "center-cascade",
    label: "Center Cascade",
    pattern: { centerX: 0.5, centerY: 0.88, radius: 0.35 },
    rules: [
      { opacity: 0.4, x1: 0.055, x2: 0.945, y1: 0.1, y2: 0.1 },
      { opacity: 0.4, x1: 0.17, x2: 0.83, y1: 0.5, y2: 0.5 },
      { opacity: 0.4, x1: 0.055, x2: 0.945, y1: 0.72, y2: 0.72 },
    ],
    text: [
      { fontSize: 0.038, fontWeight: 560, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.13, source: "marker", x: 0.055, y: 0.08 },
      { align: "right", fontSize: 0.011, fontWeight: 600, letterSpacingEm: 0.045, lineHeight: 1.1, maxCharacters: 28, maxWidth: 0.26, source: "eyebrow", x: 0.945, y: 0.08 },
      { align: "center", fontSize: 0.093, fontWeight: 535, letterSpacingEm: -0.06, lineHeight: 0.8, maxCharacters: 12, maxWidth: 0.72, source: "headline", x: 0.5, y: 0.2 },
      { fontSize: 0.0135, fontWeight: 400, lineHeight: 1.23, maxCharacters: 25, maxWidth: 0.29, source: "body", x: 0.36, y: 0.42 },
      { fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 32, maxWidth: 0.33, source: "footer", x: 0.055, y: 0.66 },
      { align: "right", fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.4, source: "equation", x: 0.945, y: 0.6 },
    ],
  },
  {
    annotations: createAnnotations("LOWER BAND", 4, "bottom-register"),
    copy: {
      body: "A lower band creates a second horizon. Dates, names, and supporting facts can gather there while the upper field remains open and atmospheric.",
      eyebrow: "EVENT STRUCTURE / 15",
      footer: "GROUND / DATE / ASSEMBLY",
      headline: "THE BOTTOM\nHOLDS\nTHE EVENT",
      marker: "15",
    },
    grid: { columns: 8, marginX: 0.055, marginY: 0.05, opacity: 0.09, rows: 16, showColumns: false, showRows: false },
    id: "lower-band",
    label: "Lower Band",
    pattern: { centerX: 0.73, centerY: 0.96, radius: 0.34 },
    rules: [
      { opacity: 0.42, x1: 0.055, x2: 0.945, y1: 0.1, y2: 0.1 },
      { opacity: 0.55, weight: 1.4, x1: 0.055, x2: 0.945, y1: 0.43, y2: 0.43 },
      { opacity: 0.55, weight: 1.4, x1: 0.055, x2: 0.945, y1: 0.57, y2: 0.57 },
      { opacity: 0.42, x1: 0.055, x2: 0.945, y1: 0.79, y2: 0.79 },
    ],
    text: [
      { fontSize: 0.045, fontWeight: 560, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.14, source: "marker", x: 0.055, y: 0.08 },
      { fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.05, lineHeight: 1.1, maxCharacters: 28, maxWidth: 0.28, source: "eyebrow", x: 0.055, y: 0.14 },
      { fontSize: 0.079, fontWeight: 560, letterSpacingEm: -0.055, lineHeight: 0.83, maxCharacters: 11, maxWidth: 0.55, source: "headline", x: 0.055, y: 0.66 },
      { fontSize: 0.0135, fontWeight: 400, lineHeight: 1.23, maxCharacters: 26, maxWidth: 0.31, source: "body", x: 0.62, y: 0.16 },
      { align: "right", fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 34, maxWidth: 0.34, source: "footer", x: 0.945, y: 0.765 },
      { fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.41, source: "equation", x: 0.055, y: 0.5 },
    ],
  },
  {
    annotations: createAnnotations("TWIN RAILS", 5, "side-rails"),
    copy: {
      body: "Parallel rails let marginal facts and central arguments coexist. Their tension makes the page feel continuous beyond its visible top and bottom.",
      eyebrow: "MARGINAL SYSTEM / 16",
      footer: "LEFT RAIL / RIGHT RAIL / FIELD",
      headline: "TWO EDGES\nONE\nARGUMENT",
      marker: "16",
    },
    grid: { columns: 6, marginX: 0.08, marginY: 0.05, opacity: 0.07, rows: 22, showColumns: false, showRows: false },
    id: "twin-rails",
    label: "Twin Rails",
    pattern: { centerX: 0.5, centerY: 1.0, radius: 0.45 },
    rules: [
      { opacity: 0.52, weight: 1.2, x1: 0.08, x2: 0.08, y1: 0.05, y2: 0.94 },
      { opacity: 0.52, weight: 1.2, x1: 0.92, x2: 0.92, y1: 0.05, y2: 0.94 },
      { opacity: 0.42, x1: 0.08, x2: 0.92, y1: 0.12, y2: 0.12 },
      { opacity: 0.42, x1: 0.08, x2: 0.92, y1: 0.54, y2: 0.54 },
    ],
    text: [
      { align: "center", fontSize: 0.04, fontWeight: 550, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.12, source: "marker", x: 0.5, y: 0.09 },
      { fontSize: 0.011, fontWeight: 600, letterSpacingEm: 0.05, lineHeight: 1.1, maxCharacters: 28, maxWidth: 0.28, rotation: -90, source: "eyebrow", x: 0.045, y: 0.44 },
      { align: "center", fontSize: 0.092, fontWeight: 535, letterSpacingEm: -0.06, lineHeight: 0.81, maxCharacters: 11, maxWidth: 0.68, source: "headline", x: 0.5, y: 0.22 },
      { fontSize: 0.0135, fontWeight: 400, lineHeight: 1.23, maxCharacters: 26, maxWidth: 0.29, source: "body", x: 0.16, y: 0.37 },
      { align: "right", fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 36, maxWidth: 0.36, rotation: 90, source: "footer", x: 0.955, y: 0.46 },
      { fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.4, source: "equation", x: 0.48, y: 0.6 },
    ],
  },
  {
    annotations: createAnnotations("MICRO INDEX", 6, "matrix"),
    copy: {
      body: "Microtype offers a second reading distance. It rewards proximity with definitions, coordinates, and precise clues that support the dominant message.",
      eyebrow: "SECOND SCALE / 17",
      footer: "INDEX / KEY / DEFINITION",
      headline: "DETAIL IS\nA SECOND\nSCALE",
      marker: "17",
    },
    grid: { columns: 16, marginX: 0.05, marginY: 0.05, opacity: 0.14, rows: 28, showColumns: true, showRows: true },
    id: "micro-index",
    label: "Micro Index",
    pattern: { centerX: 0.72, centerY: 0.9, radius: 0.31 },
    rules: [
      { opacity: 0.48, x1: 0.05, x2: 0.95, y1: 0.09, y2: 0.09 },
      { opacity: 0.48, x1: 0.05, x2: 0.95, y1: 0.43, y2: 0.43 },
      { opacity: 0.48, x1: 0.05, x2: 0.95, y1: 0.62, y2: 0.62 },
    ],
    text: [
      { fontSize: 0.042, fontWeight: 560, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.14, source: "marker", x: 0.05, y: 0.075 },
      { align: "right", fontSize: 0.0105, fontWeight: 600, letterSpacingEm: 0.055, lineHeight: 1.1, maxCharacters: 28, maxWidth: 0.3, source: "eyebrow", x: 0.95, y: 0.075 },
      { fontSize: 0.071, fontWeight: 560, letterSpacingEm: -0.05, lineHeight: 0.84, maxCharacters: 12, maxWidth: 0.42, source: "headline", x: 0.05, y: 0.17 },
      { fontSize: 0.0125, fontWeight: 400, lineHeight: 1.24, maxCharacters: 23, maxWidth: 0.26, source: "body", x: 0.05, y: 0.31 },
      { fontSize: 0.011, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 30, maxWidth: 0.31, source: "footer", x: 0.05, y: 0.59 },
      { align: "right", fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.39, source: "equation", x: 0.95, y: 0.52 },
    ],
  },
  {
    annotations: createAnnotations("GRAND FOLIO", 7, "bottom-register"),
    copy: {
      body: "A folio can be more than location. Enlarged, it becomes architecture: a landmark that divides the page, carries rhythm, and announces sequence.",
      eyebrow: "NUMBER AS FORM / 18",
      footer: "FOLIO / LANDMARK / SEQUENCE",
      headline: "WAYS TO\nENTER",
      marker: "18",
    },
    grid: { columns: 8, marginX: 0.055, marginY: 0.05, opacity: 0.09, rows: 20, showColumns: true, showRows: false },
    id: "grand-folio",
    label: "Grand Folio",
    pattern: { centerX: 0.4, centerY: 0.95, radius: 0.38 },
    rules: [
      { opacity: 0.45, x1: 0.055, x2: 0.945, y1: 0.1, y2: 0.1 },
      { opacity: 0.45, x1: 0.055, x2: 0.945, y1: 0.49, y2: 0.49 },
      { opacity: 0.45, x1: 0.055, x2: 0.945, y1: 0.66, y2: 0.66 },
    ],
    text: [
      { fontSize: 0.245, fontWeight: 520, letterSpacingEm: -0.08, lineHeight: 0.74, maxCharacters: 4, maxWidth: 0.48, source: "marker", x: 0.03, y: 0.39 },
      { fontSize: 0.011, fontWeight: 600, letterSpacingEm: 0.05, lineHeight: 1.1, maxCharacters: 30, maxWidth: 0.3, source: "eyebrow", x: 0.56, y: 0.08 },
      { fontSize: 0.084, fontWeight: 550, letterSpacingEm: -0.055, lineHeight: 0.84, maxCharacters: 11, maxWidth: 0.38, source: "headline", x: 0.56, y: 0.19 },
      { fontSize: 0.0135, fontWeight: 400, lineHeight: 1.23, maxCharacters: 25, maxWidth: 0.3, source: "body", x: 0.62, y: 0.32 },
      { align: "right", fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 36, maxWidth: 0.36, source: "footer", x: 0.945, y: 0.635 },
      { fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.4, source: "equation", x: 0.055, y: 0.58 },
    ],
  },
  {
    annotations: createAnnotations("BRACKET FIELD", 8, "cascade"),
    copy: {
      body: "Partial frames imply structure without sealing it. Open corners invite the eye to extend alignments and imagine content continuing beyond the crop.",
      eyebrow: "OPEN FRAME / 19",
      footer: "BRACKET / EXTENSION / CROP",
      headline: "A FRAME\nCAN STAY\nOPEN",
      marker: "19",
    },
    grid: { columns: 10, marginX: 0.06, marginY: 0.05, opacity: 0.08, rows: 18, showColumns: false, showRows: false },
    id: "bracket-field",
    label: "Bracket Field",
    pattern: { centerX: 0.63, centerY: 0.86, radius: 0.33 },
    rules: [
      { opacity: 0.58, weight: 1.4, x1: 0.06, x2: 0.36, y1: 0.14, y2: 0.14 },
      { opacity: 0.58, weight: 1.4, x1: 0.06, x2: 0.06, y1: 0.14, y2: 0.42 },
      { opacity: 0.58, weight: 1.4, x1: 0.64, x2: 0.94, y1: 0.48, y2: 0.48 },
      { opacity: 0.58, weight: 1.4, x1: 0.94, x2: 0.94, y1: 0.48, y2: 0.84 },
      { opacity: 0.42, x1: 0.06, x2: 0.94, y1: 0.67, y2: 0.67 },
    ],
    text: [
      { align: "right", fontSize: 0.043, fontWeight: 560, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.14, source: "marker", x: 0.94, y: 0.11 },
      { fontSize: 0.011, fontWeight: 600, letterSpacingEm: 0.05, lineHeight: 1.1, maxCharacters: 26, maxWidth: 0.27, source: "eyebrow", x: 0.09, y: 0.18 },
      { fontSize: 0.082, fontWeight: 555, letterSpacingEm: -0.055, lineHeight: 0.84, maxCharacters: 11, maxWidth: 0.46, source: "headline", x: 0.12, y: 0.25 },
      { fontSize: 0.0135, fontWeight: 400, lineHeight: 1.23, maxCharacters: 24, maxWidth: 0.28, source: "body", x: 0.65, y: 0.19 },
      { fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 34, maxWidth: 0.34, source: "footer", x: 0.06, y: 0.645 },
      { align: "right", fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.38, source: "equation", x: 0.9, y: 0.57 },
    ],
  },
  {
    annotations: createAnnotations("CROSS AXIS", 9, "matrix"),
    copy: {
      body: "The strongest alignment may be a crossing rather than an edge. Horizontal and vertical measures let separate voices meet without sharing size or tone.",
      eyebrow: "AXIS STUDY / 20",
      footer: "CROSSING / MEASURE / RELATION",
      headline: "ALIGNMENT\nIS A\nCONVERSATION",
      marker: "20",
    },
    grid: { columns: 12, marginX: 0.055, marginY: 0.05, opacity: 0.08, rows: 24, showColumns: false, showRows: false },
    id: "cross-axis",
    label: "Cross Axis",
    pattern: { centerX: 0.35, centerY: 0.92, radius: 0.36 },
    rules: [
      { opacity: 0.45, x1: 0.5, x2: 0.5, y1: 0.05, y2: 0.86 },
      { opacity: 0.45, x1: 0.055, x2: 0.945, y1: 0.5, y2: 0.5 },
      { opacity: 0.45, x1: 0.055, x2: 0.945, y1: 0.69, y2: 0.69 },
    ],
    text: [
      { fontSize: 0.043, fontWeight: 550, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.14, source: "marker", x: 0.055, y: 0.085 },
      { fontSize: 0.011, fontWeight: 600, letterSpacingEm: 0.05, lineHeight: 1.1, maxCharacters: 26, maxWidth: 0.26, source: "eyebrow", x: 0.55, y: 0.08 },
      { fontSize: 0.068, fontWeight: 560, letterSpacingEm: -0.048, lineHeight: 0.86, maxCharacters: 13, maxWidth: 0.4, source: "headline", x: 0.055, y: 0.18 },
      { fontSize: 0.013, fontWeight: 400, lineHeight: 1.23, maxCharacters: 25, maxWidth: 0.29, source: "body", x: 0.58, y: 0.22 },
      { align: "right", fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 36, maxWidth: 0.36, source: "footer", x: 0.945, y: 0.665 },
      { fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.4, source: "equation", x: 0.055, y: 0.58 },
    ],
  },
  {
    annotations: createAnnotations("STACKED INQUIRY", 10, "top-strip"),
    copy: {
      body: "A question can organize a page before it is answered. Repetition, compression, and line breaks turn inquiry into a visible sequence of decisions.",
      eyebrow: "CRITICAL READING / 21",
      footer: "ASK / FRAME / REVISE",
      headline: "WHO SETS\nTHE READING\nORDER?",
      marker: "21",
    },
    grid: { columns: 8, marginX: 0.045, marginY: 0.04, opacity: 0.07, rows: 18, showColumns: false, showRows: false },
    id: "stacked-inquiry",
    label: "Stacked Inquiry",
    pattern: { centerX: 0.72, centerY: 0.94, radius: 0.34 },
    rules: [
      { opacity: 0.44, x1: 0.045, x2: 0.955, y1: 0.1, y2: 0.1 },
      { opacity: 0.44, x1: 0.045, x2: 0.955, y1: 0.52, y2: 0.52 },
      { opacity: 0.44, x1: 0.045, x2: 0.955, y1: 0.7, y2: 0.7 },
    ],
    text: [
      { align: "right", fontSize: 0.04, fontWeight: 560, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.13, source: "marker", x: 0.955, y: 0.08 },
      { fontSize: 0.0105, fontWeight: 600, letterSpacingEm: 0.055, lineHeight: 1.1, maxCharacters: 30, maxWidth: 0.3, source: "eyebrow", x: 0.045, y: 0.075 },
      { fontSize: 0.087, fontWeight: 550, letterSpacingEm: -0.06, lineHeight: 0.8, maxCharacters: 12, maxWidth: 0.82, source: "headline", x: 0.045, y: 0.22 },
      { fontSize: 0.013, fontWeight: 400, lineHeight: 1.24, maxCharacters: 24, maxWidth: 0.27, source: "body", x: 0.68, y: 0.4 },
      { fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 30, maxWidth: 0.3, source: "footer", x: 0.045, y: 0.675 },
      { fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.41, source: "equation", x: 0.045, y: 0.61 },
    ],
  },
  {
    annotations: createAnnotations("PERIPHERAL NOTES", 11, "side-rails"),
    copy: {
      body: "Notes at the edge do not merely explain the center. They interrupt it, contradict it, and create alternate routes through the same material.",
      eyebrow: "MARGIN VOICES / 22",
      footer: "CENTER / EDGE / RESPONSE",
      headline: "THE CENTER\nIS NOT\nALONE",
      marker: "22",
    },
    grid: { columns: 10, marginX: 0.07, marginY: 0.05, opacity: 0.08, rows: 20, showColumns: false, showRows: false },
    id: "peripheral-notes",
    label: "Peripheral Notes",
    pattern: { centerX: 0.45, centerY: 0.9, radius: 0.37 },
    rules: [
      { opacity: 0.5, weight: 1.2, x1: 0.12, x2: 0.12, y1: 0.08, y2: 0.9 },
      { opacity: 0.5, weight: 1.2, x1: 0.88, x2: 0.88, y1: 0.08, y2: 0.9 },
      { opacity: 0.4, x1: 0.12, x2: 0.88, y1: 0.12, y2: 0.12 },
      { opacity: 0.4, x1: 0.12, x2: 0.88, y1: 0.51, y2: 0.51 },
      { opacity: 0.4, x1: 0.12, x2: 0.88, y1: 0.69, y2: 0.69 },
    ],
    text: [
      { align: "center", fontSize: 0.04, fontWeight: 550, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.12, source: "marker", x: 0.5, y: 0.1 },
      { fontSize: 0.0105, fontWeight: 600, letterSpacingEm: 0.055, lineHeight: 1.1, maxCharacters: 28, maxWidth: 0.28, rotation: -90, source: "eyebrow", x: 0.055, y: 0.44 },
      { fontSize: 0.082, fontWeight: 555, letterSpacingEm: -0.055, lineHeight: 0.83, maxCharacters: 11, maxWidth: 0.53, source: "headline", x: 0.19, y: 0.22 },
      { align: "right", fontSize: 0.013, fontWeight: 400, lineHeight: 1.24, maxCharacters: 23, maxWidth: 0.25, source: "body", x: 0.82, y: 0.36 },
      { align: "right", fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 34, maxWidth: 0.34, rotation: 90, source: "footer", x: 0.945, y: 0.46 },
      { fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.4, source: "equation", x: 0.23, y: 0.6 },
    ],
  },
  {
    annotations: createAnnotations("CITATION GRID", 12, "matrix"),
    copy: {
      body: "Citation is a spatial practice. Sources, voices, and dates become visible coordinates, allowing a reader to trace how an argument was assembled.",
      eyebrow: "SOURCE MAP / 23",
      footer: "AUTHOR / CONTEXT / RETURN",
      headline: "EVERY FORM\nHAS A\nSOURCE",
      marker: "23",
    },
    grid: { columns: 12, marginX: 0.055, marginY: 0.05, opacity: 0.14, rows: 24, showColumns: true, showRows: true },
    id: "citation-grid",
    label: "Citation Grid",
    pattern: { centerX: 0.68, centerY: 0.93, radius: 0.34 },
    rules: [
      { opacity: 0.48, x1: 0.055, x2: 0.945, y1: 0.09, y2: 0.09 },
      { opacity: 0.48, x1: 0.055, x2: 0.945, y1: 0.45, y2: 0.45 },
      { opacity: 0.48, x1: 0.055, x2: 0.945, y1: 0.64, y2: 0.64 },
    ],
    text: [
      { fontSize: 0.04, fontWeight: 560, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.13, source: "marker", x: 0.055, y: 0.075 },
      { align: "right", fontSize: 0.0105, fontWeight: 600, letterSpacingEm: 0.055, lineHeight: 1.1, maxCharacters: 27, maxWidth: 0.28, source: "eyebrow", x: 0.945, y: 0.075 },
      { fontSize: 0.076, fontWeight: 560, letterSpacingEm: -0.052, lineHeight: 0.84, maxCharacters: 11, maxWidth: 0.44, source: "headline", x: 0.055, y: 0.19 },
      { fontSize: 0.013, fontWeight: 400, lineHeight: 1.24, maxCharacters: 25, maxWidth: 0.3, source: "body", x: 0.55, y: 0.19 },
      { align: "right", fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 34, maxWidth: 0.34, source: "footer", x: 0.945, y: 0.615 },
      { fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.4, source: "equation", x: 0.055, y: 0.54 },
    ],
  },
  {
    annotations: createAnnotations("FESTIVAL BAND", 13, "bottom-register"),
    copy: {
      body: "Event typography has to work at a glance and at close range. Bands establish urgency while smaller fields carry the practical details of gathering.",
      eyebrow: "PUBLIC PROGRAM / 24",
      footer: "DATE / VENUE / PARTICIPATION",
      headline: "TYPE CAN\nANNOUNCE\nA PLACE",
      marker: "24",
    },
    grid: { columns: 8, marginX: 0.045, marginY: 0.04, opacity: 0.08, rows: 16, showColumns: false, showRows: false },
    id: "festival-band",
    label: "Festival Band",
    pattern: { centerX: 0.71, centerY: 0.97, radius: 0.35 },
    rules: [
      { opacity: 0.45, x1: 0.045, x2: 0.955, y1: 0.1, y2: 0.1 },
      { opacity: 0.58, weight: 1.5, x1: 0.045, x2: 0.955, y1: 0.46, y2: 0.46 },
      { opacity: 0.58, weight: 1.5, x1: 0.045, x2: 0.955, y1: 0.68, y2: 0.68 },
    ],
    text: [
      { fontSize: 0.043, fontWeight: 560, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.14, source: "marker", x: 0.045, y: 0.08 },
      { align: "right", fontSize: 0.011, fontWeight: 600, letterSpacingEm: 0.05, lineHeight: 1.1, maxCharacters: 30, maxWidth: 0.3, source: "eyebrow", x: 0.955, y: 0.08 },
      { align: "center", fontSize: 0.089, fontWeight: 550, letterSpacingEm: -0.06, lineHeight: 0.8, maxCharacters: 11, maxWidth: 0.74, source: "headline", x: 0.5, y: 0.21 },
      { fontSize: 0.013, fontWeight: 400, lineHeight: 1.24, maxCharacters: 23, maxWidth: 0.27, source: "body", x: 0.055, y: 0.58 },
      { align: "right", fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 34, maxWidth: 0.34, source: "footer", x: 0.955, y: 0.655 },
      { align: "right", fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.4, source: "equation", x: 0.955, y: 0.57 },
    ],
  },
  {
    annotations: createAnnotations("TALL REGISTER", 14, "split-register"),
    copy: {
      body: "Registers transform repetition into evidence. When entries share a measure, differences in length, sequence, and emphasis become immediately readable.",
      eyebrow: "SEQUENTIAL DATA / 25",
      footer: "ENTRY / INTERVAL / RECORD",
      headline: "LISTS MAKE\nTIME\nVISIBLE",
      marker: "25",
    },
    grid: { columns: 10, marginX: 0.055, marginY: 0.04, opacity: 0.12, rows: 28, showColumns: true, showRows: true },
    id: "tall-register",
    label: "Tall Register",
    pattern: { centerX: 0.4, centerY: 0.91, radius: 0.36 },
    rules: [
      { opacity: 0.45, x1: 0.055, x2: 0.945, y1: 0.08, y2: 0.08 },
      { opacity: 0.45, x1: 0.055, x2: 0.945, y1: 0.45, y2: 0.45 },
      { opacity: 0.45, x1: 0.055, x2: 0.945, y1: 0.64, y2: 0.64 },
    ],
    text: [
      { align: "right", fontSize: 0.041, fontWeight: 560, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.13, source: "marker", x: 0.945, y: 0.065 },
      { fontSize: 0.0105, fontWeight: 600, letterSpacingEm: 0.055, lineHeight: 1.1, maxCharacters: 30, maxWidth: 0.3, source: "eyebrow", x: 0.055, y: 0.065 },
      { fontSize: 0.073, fontWeight: 560, letterSpacingEm: -0.05, lineHeight: 0.84, maxCharacters: 11, maxWidth: 0.29, source: "headline", x: 0.055, y: 0.17 },
      { fontSize: 0.0125, fontWeight: 400, lineHeight: 1.24, maxCharacters: 22, maxWidth: 0.23, source: "body", x: 0.37, y: 0.17 },
      { fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 32, maxWidth: 0.32, source: "footer", x: 0.055, y: 0.615 },
      { align: "right", fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.32, source: "equation", x: 0.945, y: 0.54 },
    ],
  },
  {
    annotations: createAnnotations("SIDECAR ESSAY", 15, "split-register"),
    copy: {
      body: "A side essay changes the pace of the main text. Narrow measure and smaller scale create a parallel voice that can annotate, doubt, or expand the argument.",
      eyebrow: "PARALLEL TEXT / 26",
      footer: "MAIN VOICE / SIDE VOICE / LINK",
      headline: "THE NOTE\nCHANGES\nTHE TEXT",
      marker: "26",
    },
    grid: { columns: 6, marginX: 0.055, marginY: 0.05, opacity: 0.08, rows: 20, showColumns: false, showRows: false },
    id: "sidecar-essay",
    label: "Sidecar Essay",
    pattern: { centerX: 0.68, centerY: 0.9, radius: 0.33 },
    rules: [
      { opacity: 0.45, x1: 0.055, x2: 0.945, y1: 0.12, y2: 0.12 },
      { opacity: 0.36, x1: 0.58, x2: 0.58, y1: 0.12, y2: 0.78 },
      { opacity: 0.45, x1: 0.055, x2: 0.945, y1: 0.48, y2: 0.48 },
      { opacity: 0.45, x1: 0.055, x2: 0.945, y1: 0.67, y2: 0.67 },
    ],
    text: [
      { fontSize: 0.043, fontWeight: 560, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.14, source: "marker", x: 0.055, y: 0.095 },
      { align: "right", fontSize: 0.0105, fontWeight: 600, letterSpacingEm: 0.055, lineHeight: 1.1, maxCharacters: 30, maxWidth: 0.3, source: "eyebrow", x: 0.945, y: 0.095 },
      { fontSize: 0.079, fontWeight: 555, letterSpacingEm: -0.055, lineHeight: 0.83, maxCharacters: 11, maxWidth: 0.46, source: "headline", x: 0.055, y: 0.22 },
      { fontSize: 0.0125, fontWeight: 400, lineHeight: 1.25, maxCharacters: 21, maxWidth: 0.22, source: "body", x: 0.64, y: 0.2 },
      { align: "right", fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 36, maxWidth: 0.36, source: "footer", x: 0.945, y: 0.645 },
      { fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.4, source: "equation", x: 0.055, y: 0.57 },
    ],
  },
  {
    annotations: createAnnotations("MODULAR PROOF", 16, "matrix"),
    copy: {
      body: "Proof sheets expose a system under pressure. Repeated modules show whether hierarchy, spacing, and voice continue to work across changing content.",
      eyebrow: "SYSTEM TEST / 27",
      footer: "MODULE / VARIANT / CHECK",
      headline: "TEST THE\nSYSTEM AT\nEVERY SCALE",
      marker: "27",
    },
    grid: { columns: 16, marginX: 0.05, marginY: 0.04, opacity: 0.15, rows: 28, showColumns: true, showRows: true },
    id: "modular-proof",
    label: "Modular Proof",
    pattern: { centerX: 0.72, centerY: 0.87, radius: 0.31 },
    rules: [
      { opacity: 0.5, x1: 0.05, x2: 0.95, y1: 0.09, y2: 0.09 },
      { opacity: 0.5, x1: 0.05, x2: 0.95, y1: 0.46, y2: 0.46 },
      { opacity: 0.5, x1: 0.05, x2: 0.95, y1: 0.65, y2: 0.65 },
    ],
    text: [
      { fontSize: 0.04, fontWeight: 560, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.13, source: "marker", x: 0.05, y: 0.075 },
      { align: "right", fontSize: 0.0105, fontWeight: 600, letterSpacingEm: 0.055, lineHeight: 1.1, maxCharacters: 28, maxWidth: 0.29, source: "eyebrow", x: 0.95, y: 0.075 },
      { fontSize: 0.068, fontWeight: 560, letterSpacingEm: -0.05, lineHeight: 0.84, maxCharacters: 12, maxWidth: 0.43, source: "headline", x: 0.05, y: 0.17 },
      { fontSize: 0.0125, fontWeight: 400, lineHeight: 1.24, maxCharacters: 24, maxWidth: 0.28, source: "body", x: 0.55, y: 0.2 },
      { align: "right", fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 32, maxWidth: 0.33, source: "footer", x: 0.95, y: 0.625 },
      { fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.4, source: "equation", x: 0.05, y: 0.55 },
    ],
  },
  {
    annotations: createAnnotations("EMPTY CENTER", 17, "side-rails"),
    copy: {
      body: "An empty center can hold anticipation. By moving information to the perimeter, the layout turns absence into the page's most active element.",
      eyebrow: "VACANT FIELD / 28",
      footer: "PERIMETER / PAUSE / EXPECTATION",
      headline: "LEAVE ROOM\nFOR THE\nUNKNOWN",
      marker: "28",
    },
    grid: { columns: 8, marginX: 0.055, marginY: 0.05, opacity: 0.07, rows: 18, showColumns: false, showRows: false },
    id: "empty-center",
    label: "Empty Center",
    pattern: { centerX: 0.5, centerY: 1.02, radius: 0.47 },
    rules: [
      { opacity: 0.45, x1: 0.055, x2: 0.945, y1: 0.08, y2: 0.08 },
      { opacity: 0.45, x1: 0.055, x2: 0.945, y1: 0.51, y2: 0.51 },
      { opacity: 0.45, x1: 0.055, x2: 0.945, y1: 0.72, y2: 0.72 },
    ],
    text: [
      { align: "right", fontSize: 0.04, fontWeight: 550, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.13, source: "marker", x: 0.945, y: 0.065 },
      { fontSize: 0.0105, fontWeight: 600, letterSpacingEm: 0.055, lineHeight: 1.1, maxCharacters: 28, maxWidth: 0.28, source: "eyebrow", x: 0.055, y: 0.065 },
      { fontSize: 0.083, fontWeight: 550, letterSpacingEm: -0.055, lineHeight: 0.83, maxCharacters: 11, maxWidth: 0.58, source: "headline", x: 0.055, y: 0.16 },
      { align: "right", fontSize: 0.0125, fontWeight: 400, lineHeight: 1.24, maxCharacters: 21, maxWidth: 0.23, source: "body", x: 0.945, y: 0.28 },
      { align: "right", fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 36, maxWidth: 0.36, source: "footer", x: 0.945, y: 0.695 },
      { fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.4, source: "equation", x: 0.055, y: 0.62 },
    ],
  },
  {
    annotations: createAnnotations("CAPTION MATRIX", 18, "matrix"),
    copy: {
      body: "Captions turn fragments into a world. Their repeated scale links images, data, and remarks while keeping each piece available for independent reading.",
      eyebrow: "FRAGMENT SYSTEM / 29",
      footer: "CAPTION / LINK / CONTEXT",
      headline: "CAPTIONS\nBUILD THE\nWORLD",
      marker: "29",
    },
    grid: { columns: 12, marginX: 0.05, marginY: 0.04, opacity: 0.15, rows: 24, showColumns: true, showRows: true },
    id: "caption-matrix",
    label: "Caption Matrix",
    pattern: { centerX: 0.7, centerY: 0.89, radius: 0.32 },
    rules: [
      { opacity: 0.48, x1: 0.05, x2: 0.95, y1: 0.09, y2: 0.09 },
      { opacity: 0.48, x1: 0.05, x2: 0.95, y1: 0.46, y2: 0.46 },
      { opacity: 0.48, x1: 0.05, x2: 0.95, y1: 0.65, y2: 0.65 },
    ],
    text: [
      { fontSize: 0.04, fontWeight: 560, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.13, source: "marker", x: 0.05, y: 0.075 },
      { align: "right", fontSize: 0.0105, fontWeight: 600, letterSpacingEm: 0.055, lineHeight: 1.1, maxCharacters: 30, maxWidth: 0.3, source: "eyebrow", x: 0.95, y: 0.075 },
      { fontSize: 0.072, fontWeight: 555, letterSpacingEm: -0.052, lineHeight: 0.84, maxCharacters: 11, maxWidth: 0.42, source: "headline", x: 0.05, y: 0.17 },
      { align: "right", fontSize: 0.0125, fontWeight: 400, lineHeight: 1.24, maxCharacters: 22, maxWidth: 0.24, source: "body", x: 0.95, y: 0.2 },
      { align: "right", fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 34, maxWidth: 0.34, source: "footer", x: 0.95, y: 0.625 },
      { fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.4, source: "equation", x: 0.05, y: 0.55 },
    ],
  },
  {
    annotations: createAnnotations("ARCHIVE SPINE", 19, "cascade"),
    copy: {
      body: "An archive stays useful when its structure invites new relations. A spine locates material; a flexible field lets histories be rearranged and read again.",
      eyebrow: "LIVING RECORD / 30",
      footer: "LOCATE / CONNECT / REOPEN",
      headline: "AN ARCHIVE\nIS A LIVING\nGRID",
      marker: "30",
    },
    grid: { columns: 16, marginX: 0.045, marginY: 0.04, opacity: 0.15, rows: 28, showColumns: true, showRows: true },
    id: "archive-spine",
    label: "Archive Spine",
    pattern: { centerX: 0.66, centerY: 0.86, radius: 0.31 },
    rules: [
      { opacity: 0.55, weight: 1.4, x1: 0.12, x2: 0.12, y1: 0.04, y2: 0.92 },
      { opacity: 0.48, x1: 0.045, x2: 0.955, y1: 0.1, y2: 0.1 },
      { opacity: 0.48, x1: 0.12, x2: 0.955, y1: 0.46, y2: 0.46 },
      { opacity: 0.48, x1: 0.12, x2: 0.955, y1: 0.65, y2: 0.65 },
    ],
    text: [
      { align: "center", fontSize: 0.04, fontWeight: 560, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.13, rotation: -90, source: "marker", x: 0.07, y: 0.16 },
      { fontSize: 0.0105, fontWeight: 600, letterSpacingEm: 0.055, lineHeight: 1.1, maxCharacters: 30, maxWidth: 0.3, source: "eyebrow", x: 0.18, y: 0.075 },
      { fontSize: 0.069, fontWeight: 560, letterSpacingEm: -0.05, lineHeight: 0.84, maxCharacters: 12, maxWidth: 0.44, source: "headline", x: 0.18, y: 0.18 },
      { align: "right", fontSize: 0.0125, fontWeight: 400, lineHeight: 1.24, maxCharacters: 22, maxWidth: 0.24, source: "body", x: 0.95, y: 0.2 },
      { align: "right", fontSize: 0.0115, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 34, maxWidth: 0.34, source: "footer", x: 0.95, y: 0.625 },
      { fontSize: 0.011, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.4, source: "equation", x: 0.18, y: 0.55 },
    ],
  },
] as const satisfies readonly EditorialTemplate[];
