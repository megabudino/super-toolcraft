import { additionalEditorialTemplates } from "./additional-editorial-templates";

export type EditorialTemplateId =
  | "modular-index"
  | "edge-catalogue"
  | "service-grid"
  | "baseline-field"
  | "type-scale"
  | "negative-space"
  | "column-rhythm"
  | "optical-balance"
  | "margin-system"
  | "variable-order"
  | "border-ledger"
  | "split-colophon"
  | "running-header"
  | "center-cascade"
  | "lower-band"
  | "twin-rails"
  | "micro-index"
  | "grand-folio"
  | "bracket-field"
  | "cross-axis"
  | "stacked-inquiry"
  | "peripheral-notes"
  | "citation-grid"
  | "festival-band"
  | "tall-register"
  | "sidecar-essay"
  | "modular-proof"
  | "empty-center"
  | "caption-matrix"
  | "archive-spine";

export type EditorialCopy = {
  body: string;
  eyebrow: string;
  footer: string;
  headline: string;
  marker: string;
};

export type CustomEditorialCopy = Omit<EditorialCopy, "marker">;

export type EditorialTextSource = keyof EditorialCopy | "equation";

export type EditorialTemplateText = {
  align?: "center" | "left" | "right";
  fontSize: number;
  fontWeight: number;
  letterSpacingEm?: number;
  lineHeight: number;
  maxCharacters: number;
  maxWidth: number;
  rotation?: number;
  source: EditorialTextSource;
  x: number;
  y: number;
};

export type EditorialTemplateAnnotation = Omit<
  EditorialTemplateText,
  "source"
> & {
  content: string;
  id: string;
  opacity?: number;
};

export type EditorialTemplateRule = {
  opacity: number;
  weight?: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
};

export type EditorialTemplate = {
  annotations: readonly EditorialTemplateAnnotation[];
  copy: EditorialCopy;
  grid: {
    columns: 6 | 8 | 10 | 12 | 16;
    marginX: number;
    marginY: number;
    opacity: number;
    rows: number;
    showColumns: boolean;
    showRows: boolean;
  };
  id: EditorialTemplateId;
  label: string;
  pattern: {
    centerX: number;
    centerY: number;
    radius: number;
  };
  rules: readonly EditorialTemplateRule[];
  text: readonly EditorialTemplateText[];
};

const coreEditorialTemplates = [
  {
    copy: {
      body:
        "A modular grid turns many decisions into one repeatable logic. Columns hold alignment; intervals create rhythm; variation arrives without losing the whole.",
      eyebrow: "SYSTEMS JOURNAL / 01",
      footer: "NOTES ON STRUCTURE — EDITION 01",
      headline: "ORDER\nCREATES\nFREEDOM",
      marker: "01",
    },
    grid: {
      columns: 12,
      marginX: 0.055,
      marginY: 0.05,
      opacity: 0.08,
      rows: 20,
      showColumns: false,
      showRows: false,
    },
    annotations: [
      { content: "12 COL / 20 ROW", fontSize: 0.0105, fontWeight: 550, id: "grid-count", letterSpacingEm: 0.05, lineHeight: 1.1, maxCharacters: 24, maxWidth: 0.2, x: 0.055, y: 0.53 },
      { align: "right", content: "RATIO 4:5", fontSize: 0.0105, fontWeight: 550, id: "ratio", letterSpacingEm: 0.05, lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.16, x: 0.945, y: 0.53 },
    ],
    id: "modular-index",
    label: "Modular Index",
    pattern: { centerX: 0.7, centerY: 0.94, radius: 0.36 },
    rules: [
      { opacity: 0.42, x1: 0.055, x2: 0.945, y1: 0.1, y2: 0.1 },
      { opacity: 0.42, x1: 0.055, x2: 0.945, y1: 0.56, y2: 0.56 },
      { opacity: 0.42, x1: 0.055, x2: 0.945, y1: 0.91, y2: 0.91 },
    ],
    text: [
      { fontSize: 0.108, fontWeight: 550, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.22, source: "marker", x: 0.055, y: 0.18 },
      { fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.045, lineHeight: 1.1, maxCharacters: 30, maxWidth: 0.23, source: "eyebrow", x: 0.715, y: 0.055 },
      { fontSize: 0.0145, fontWeight: 400, lineHeight: 1.22, maxCharacters: 28, maxWidth: 0.23, source: "body", x: 0.715, y: 0.075 },
      { fontSize: 0.075, fontWeight: 560, letterSpacingEm: -0.045, lineHeight: 0.84, maxCharacters: 12, maxWidth: 0.6, source: "headline", x: 0.055, y: 0.65 },
      { fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.035, lineHeight: 1.1, maxCharacters: 44, maxWidth: 0.46, source: "footer", x: 0.055, y: 0.89 },
      { fontSize: 0.0115, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.38, source: "equation", x: 0.56, y: 0.835 },
    ],
  },
  {
    copy: {
      body:
        "Typography becomes spatial when words touch, cross and leave the frame. Cropping is not loss; it is a device for scale.",
      eyebrow: "TYPE SPECIMEN / 02",
      footer: "EDGE CONDITIONS / GEIST SANS",
      headline: "FORM\nAT THE\nMARGIN",
      marker: "02",
    },
    grid: {
      columns: 12,
      marginX: 0.055,
      marginY: 0.05,
      opacity: 0.08,
      rows: 18,
      showColumns: false,
      showRows: false,
    },
    annotations: [
      { align: "right", content: "CROP / SCALE / CONTACT", fontSize: 0.0105, fontWeight: 550, id: "edge-method", letterSpacingEm: 0.05, lineHeight: 1.1, maxCharacters: 30, maxWidth: 0.26, x: 0.945, y: 0.56 },
    ],
    id: "edge-catalogue",
    label: "Edge Catalogue",
    pattern: { centerX: 0.5, centerY: 0.96, radius: 0.42 },
    rules: [
      { opacity: 0.4, x1: 0.055, x2: 0.945, y1: 0.12, y2: 0.12 },
      { opacity: 0.4, x1: 0.055, x2: 0.945, y1: 0.58, y2: 0.58 },
      { opacity: 0.4, x1: 0.055, x2: 0.945, y1: 0.92, y2: 0.92 },
    ],
    text: [
      { fontSize: 0.076, fontWeight: 540, letterSpacingEm: -0.045, lineHeight: 0.87, maxCharacters: 4, maxWidth: 0.2, source: "marker", x: 0.055, y: 0.2 },
      { fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 28, maxWidth: 0.24, source: "eyebrow", x: 0.71, y: 0.055 },
      { fontSize: 0.014, fontWeight: 400, lineHeight: 1.22, maxCharacters: 27, maxWidth: 0.24, source: "body", x: 0.71, y: 0.077 },
      { fontSize: 0.088, fontWeight: 540, letterSpacingEm: -0.055, lineHeight: 0.84, maxCharacters: 10, maxWidth: 0.66, source: "headline", x: -0.02, y: 0.69 },
      { align: "right", fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.035, lineHeight: 1.1, maxCharacters: 34, maxWidth: 0.36, source: "footer", x: 0.945, y: 0.9 },
      { fontSize: 0.0115, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.42, source: "equation", x: 0.055, y: 0.845 },
    ],
  },
  {
    copy: {
      body:
        "A page can behave like an interface: named regions, reusable measures and predictable alignment. The system supports content without dictating its voice.",
      eyebrow: "DESIGN SYSTEM / 03",
      footer: "GRID OPERATIONS — TWELVE COLUMNS",
      headline: "PRINT AS\nA SERVICE",
      marker: "03",
    },
    grid: {
      columns: 12,
      marginX: 0.055,
      marginY: 0.05,
      opacity: 0.15,
      rows: 24,
      showColumns: true,
      showRows: true,
    },
    annotations: [
      { content: "MODULE A / TITLE", fontSize: 0.0105, fontWeight: 550, id: "module-a", letterSpacingEm: 0.045, lineHeight: 1.1, maxCharacters: 24, maxWidth: 0.2, x: 0.055, y: 0.49 },
      { content: "MODULE B / BODY", fontSize: 0.0105, fontWeight: 550, id: "module-b", letterSpacingEm: 0.045, lineHeight: 1.1, maxCharacters: 24, maxWidth: 0.2, x: 0.36, y: 0.49 },
      { content: "MODULE C / FIELD", fontSize: 0.0105, fontWeight: 550, id: "module-c", letterSpacingEm: 0.045, lineHeight: 1.1, maxCharacters: 24, maxWidth: 0.2, x: 0.66, y: 0.49 },
      { content: "ALIGNMENT 01", fontSize: 0.0105, fontWeight: 500, id: "alignment-01", lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.16, x: 0.055, y: 0.57 },
      { content: "ALIGNMENT 02", fontSize: 0.0105, fontWeight: 500, id: "alignment-02", lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.16, x: 0.36, y: 0.57 },
      { align: "right", content: "OUTPUT / 480 × 600", fontSize: 0.0105, fontWeight: 500, id: "output-size", lineHeight: 1.1, maxCharacters: 24, maxWidth: 0.2, x: 0.945, y: 0.57 },
    ],
    id: "service-grid",
    label: "Service Grid",
    pattern: { centerX: 0.72, centerY: 0.85, radius: 0.33 },
    rules: [
      { opacity: 0.55, weight: 1.25, x1: 0.055, x2: 0.945, y1: 0.51, y2: 0.51 },
    ],
    text: [
      { align: "right", fontSize: 0.052, fontWeight: 540, letterSpacingEm: -0.04, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.16, source: "marker", x: 0.945, y: 0.13 },
      { fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.045, lineHeight: 1.1, maxCharacters: 28, maxWidth: 0.28, source: "eyebrow", x: 0.055, y: 0.065 },
      { fontSize: 0.066, fontWeight: 570, letterSpacingEm: -0.045, lineHeight: 0.88, maxCharacters: 12, maxWidth: 0.44, source: "headline", x: 0.055, y: 0.16 },
      { fontSize: 0.014, fontWeight: 400, lineHeight: 1.24, maxCharacters: 30, maxWidth: 0.34, source: "body", x: 0.56, y: 0.2 },
      { align: "right", fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.035, lineHeight: 1.1, maxCharacters: 42, maxWidth: 0.44, source: "footer", x: 0.945, y: 0.945 },
      { fontSize: 0.0115, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.43, source: "equation", x: 0.055, y: 0.925 },
    ],
  },
  {
    copy: {
      body:
        "Baseline rhythm gives unrelated elements a shared pulse. Text, rules and images meet on repeated intervals, making density feel calm.",
      eyebrow: "READING RHYTHM / 04",
      footer: "VERTICAL MEASURE / 8 PT STUDY",
      headline: "EVERY LINE\nHAS A PLACE",
      marker: "04",
    },
    grid: {
      columns: 12,
      marginX: 0.055,
      marginY: 0.05,
      opacity: 0.13,
      rows: 24,
      showColumns: false,
      showRows: true,
    },
    annotations: [
      { content: "BASELINE 08", fontSize: 0.0105, fontWeight: 550, id: "baseline", letterSpacingEm: 0.045, lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.18, x: 0.055, y: 0.46 },
      { content: "LEADING 1.24", fontSize: 0.0105, fontWeight: 550, id: "leading", letterSpacingEm: 0.045, lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.18, x: 0.28, y: 0.46 },
      { content: "MEASURE 28", fontSize: 0.0105, fontWeight: 550, id: "measure", letterSpacingEm: 0.045, lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.18, x: 0.51, y: 0.46 },
      { align: "right", content: "RHYTHM / REPEAT", fontSize: 0.0105, fontWeight: 550, id: "rhythm-repeat", letterSpacingEm: 0.045, lineHeight: 1.1, maxCharacters: 24, maxWidth: 0.2, x: 0.945, y: 0.46 },
    ],
    id: "baseline-field",
    label: "Baseline Field",
    pattern: { centerX: 0.35, centerY: 0.91, radius: 0.38 },
    rules: [
      { opacity: 0.5, weight: 1.2, x1: 0.055, x2: 0.945, y1: 0.48, y2: 0.48 },
    ],
    text: [
      { align: "right", fontSize: 0.124, fontWeight: 520, letterSpacingEm: -0.06, lineHeight: 0.84, maxCharacters: 4, maxWidth: 0.25, source: "marker", x: 0.945, y: 0.19 },
      { fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.045, lineHeight: 1.1, maxCharacters: 30, maxWidth: 0.3, source: "eyebrow", x: 0.055, y: 0.065 },
      { fontSize: 0.074, fontWeight: 560, letterSpacingEm: -0.05, lineHeight: 0.87, maxCharacters: 13, maxWidth: 0.54, source: "headline", x: 0.055, y: 0.2 },
      { fontSize: 0.014, fontWeight: 400, lineHeight: 1.23, maxCharacters: 28, maxWidth: 0.32, source: "body", x: 0.61, y: 0.27 },
      { fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.035, lineHeight: 1.1, maxCharacters: 38, maxWidth: 0.4, source: "footer", x: 0.055, y: 0.525 },
      { fontSize: 0.0115, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.43, source: "equation", x: 0.51, y: 0.525 },
    ],
  },
  {
    copy: {
      body:
        "Large type establishes distance and pace before a word is read. Small type rewards attention. Contrast between them gives the page its tempo.",
      eyebrow: "SCALE TEST / 05",
      footer: "DISPLAY / TEXT / MICRO",
      headline: "SIZE IS\nA VOICE",
      marker: "05",
    },
    grid: {
      columns: 12,
      marginX: 0.055,
      marginY: 0.05,
      opacity: 0.09,
      rows: 20,
      showColumns: true,
      showRows: false,
    },
    annotations: [
      { content: "100 / DISPLAY", fontSize: 0.0105, fontWeight: 550, id: "display-size", lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.18, x: 0.055, y: 0.49 },
      { content: "48 / TITLE", fontSize: 0.0105, fontWeight: 550, id: "title-size", lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.18, x: 0.26, y: 0.49 },
      { content: "16 / TEXT", fontSize: 0.0105, fontWeight: 550, id: "text-size", lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.18, x: 0.47, y: 0.49 },
      { content: "11 / MICRO", fontSize: 0.0105, fontWeight: 550, id: "micro-size", lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.18, x: 0.68, y: 0.49 },
      { content: "WEIGHT 510", fontSize: 0.0105, fontWeight: 510, id: "variable-weight", lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.18, x: 0.055, y: 0.54 },
      { content: "TRACKING −0.075", fontSize: 0.0105, fontWeight: 510, id: "tracking", lineHeight: 1.1, maxCharacters: 24, maxWidth: 0.2, x: 0.31, y: 0.54 },
      { content: "LEADING 0.80", fontSize: 0.0105, fontWeight: 510, id: "display-leading", lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.18, x: 0.57, y: 0.54 },
      { align: "right", content: "CONTRAST BUILDS HIERARCHY", fontSize: 0.0105, fontWeight: 550, id: "hierarchy-note", lineHeight: 1.1, maxCharacters: 32, maxWidth: 0.25, x: 0.945, y: 0.54 },
    ],
    id: "type-scale",
    label: "Type Scale",
    pattern: { centerX: 0.73, centerY: 0.92, radius: 0.31 },
    rules: [
      { opacity: 0.48, x1: 0.055, x2: 0.945, y1: 0.56, y2: 0.56 },
    ],
    text: [
      { fontSize: 0.27, fontWeight: 510, letterSpacingEm: -0.075, lineHeight: 0.8, maxCharacters: 4, maxWidth: 0.5, source: "marker", x: 0.03, y: 0.45 },
      { fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.05, lineHeight: 1.1, maxCharacters: 24, maxWidth: 0.24, source: "eyebrow", x: 0.055, y: 0.065 },
      { fontSize: 0.075, fontWeight: 560, letterSpacingEm: -0.05, lineHeight: 0.87, maxCharacters: 11, maxWidth: 0.4, source: "headline", x: 0.56, y: 0.18 },
      { fontSize: 0.014, fontWeight: 400, lineHeight: 1.23, maxCharacters: 27, maxWidth: 0.34, source: "body", x: 0.56, y: 0.34 },
      { fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 32, maxWidth: 0.34, source: "footer", x: 0.56, y: 0.6 },
      { fontSize: 0.0115, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.43, source: "equation", x: 0.055, y: 0.59 },
    ],
  },
  {
    copy: {
      body:
        "Empty areas are working parts of the composition. They separate arguments, amplify hierarchy and let the eye complete the structure.",
      eyebrow: "SPATIAL STUDY / 06",
      footer: "COUNTERFORM / FIELD / PAUSE",
      headline: "SPACE\nIS ACTIVE",
      marker: "06",
    },
    grid: {
      columns: 12,
      marginX: 0.055,
      marginY: 0.05,
      opacity: 0.08,
      rows: 18,
      showColumns: false,
      showRows: false,
    },
    annotations: [],
    id: "negative-space",
    label: "Negative Space",
    pattern: { centerX: 0.5, centerY: 1, radius: 0.46 },
    rules: [
      { opacity: 0.42, x1: 0.055, x2: 0.945, y1: 0.1, y2: 0.1 },
      { opacity: 0.42, x1: 0.055, x2: 0.945, y1: 0.57, y2: 0.57 },
    ],
    text: [
      { fontSize: 0.054, fontWeight: 540, letterSpacingEm: -0.04, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.18, source: "marker", x: 0.055, y: 0.17 },
      { fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.045, lineHeight: 1.1, maxCharacters: 28, maxWidth: 0.27, source: "eyebrow", x: 0.055, y: 0.055 },
      { fontSize: 0.014, fontWeight: 400, lineHeight: 1.24, maxCharacters: 26, maxWidth: 0.27, source: "body", x: 0.055, y: 0.2 },
      { align: "right", fontSize: 0.106, fontWeight: 530, letterSpacingEm: -0.06, lineHeight: 0.84, maxCharacters: 10, maxWidth: 0.6, source: "headline", x: 0.945, y: 0.2 },
      { align: "right", fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 36, maxWidth: 0.38, source: "footer", x: 0.945, y: 0.55 },
      { fontSize: 0.0115, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.43, source: "equation", x: 0.055, y: 0.495 },
    ],
  },
  {
    copy: {
      body:
        "Columns provide a recurring beat. Their width determines the sentence, their gaps determine the pause, and their edges conduct the eye.",
      eyebrow: "COLUMN NOTES / 07",
      footer: "MEASURE 24 / GUTTER 08",
      headline: "RHYTHM\nTHROUGH\nREPETITION",
      marker: "07",
    },
    grid: {
      columns: 12,
      marginX: 0.055,
      marginY: 0.05,
      opacity: 0.13,
      rows: 20,
      showColumns: true,
      showRows: false,
    },
    annotations: [
      { content: "COL 01", fontSize: 0.0105, fontWeight: 550, id: "column-01", lineHeight: 1.1, maxCharacters: 12, maxWidth: 0.1, x: 0.055, y: 0.55 },
      { content: "COL 03", fontSize: 0.0105, fontWeight: 550, id: "column-03", lineHeight: 1.1, maxCharacters: 12, maxWidth: 0.1, x: 0.205, y: 0.55 },
      { content: "COL 05", fontSize: 0.0105, fontWeight: 550, id: "column-05", lineHeight: 1.1, maxCharacters: 12, maxWidth: 0.1, x: 0.355, y: 0.55 },
      { content: "COL 07", fontSize: 0.0105, fontWeight: 550, id: "column-07", lineHeight: 1.1, maxCharacters: 12, maxWidth: 0.1, x: 0.505, y: 0.55 },
      { content: "COL 09", fontSize: 0.0105, fontWeight: 550, id: "column-09", lineHeight: 1.1, maxCharacters: 12, maxWidth: 0.1, x: 0.655, y: 0.55 },
      { content: "COL 11", fontSize: 0.0105, fontWeight: 550, id: "column-11", lineHeight: 1.1, maxCharacters: 12, maxWidth: 0.1, x: 0.805, y: 0.55 },
      { align: "right", content: "GUTTER / ACTIVE", fontSize: 0.0105, fontWeight: 550, id: "gutter-active", letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 24, maxWidth: 0.2, x: 0.945, y: 0.6 },
    ],
    id: "column-rhythm",
    label: "Column Rhythm",
    pattern: { centerX: 0.73, centerY: 0.9, radius: 0.32 },
    rules: [
      { opacity: 0.5, weight: 1.2, x1: 0.055, x2: 0.945, y1: 0.5, y2: 0.5 },
    ],
    text: [
      { fontSize: 0.04, fontWeight: 550, letterSpacingEm: -0.035, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.15, source: "marker", x: 0.055, y: 0.1 },
      { fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.045, lineHeight: 1.1, maxCharacters: 28, maxWidth: 0.25, source: "eyebrow", x: 0.33, y: 0.065 },
      { fontSize: 0.066, fontWeight: 560, letterSpacingEm: -0.048, lineHeight: 0.85, maxCharacters: 12, maxWidth: 0.29, source: "headline", x: 0.055, y: 0.2 },
      { fontSize: 0.014, fontWeight: 400, lineHeight: 1.23, maxCharacters: 27, maxWidth: 0.29, source: "body", x: 0.36, y: 0.2 },
      { align: "right", fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 32, maxWidth: 0.34, source: "footer", x: 0.945, y: 0.48 },
      { fontSize: 0.0115, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.43, source: "equation", x: 0.055, y: 0.425 },
    ],
  },
  {
    copy: {
      body:
        "Mathematical centering is only a beginning. Shape, weight and negative space shift visual gravity, so alignment must be judged as well as measured.",
      eyebrow: "PERCEPTION / 08",
      footer: "OPTICAL CORRECTION — FIELD TEST",
      headline: "CENTERED\nBY EYE",
      marker: "08",
    },
    grid: {
      columns: 12,
      marginX: 0.055,
      marginY: 0.05,
      opacity: 0.08,
      rows: 20,
      showColumns: false,
      showRows: false,
    },
    annotations: [
      { content: "GEOMETRIC CENTER", fontSize: 0.0105, fontWeight: 550, id: "geometric-center", letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 24, maxWidth: 0.2, x: 0.055, y: 0.48 },
      { align: "center", content: "OPTICAL SHIFT +02", fontSize: 0.0105, fontWeight: 550, id: "optical-shift", letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 24, maxWidth: 0.22, x: 0.5, y: 0.48 },
      { align: "right", content: "WEIGHTED FIELD", fontSize: 0.0105, fontWeight: 550, id: "weighted-field", letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 24, maxWidth: 0.2, x: 0.945, y: 0.48 },
    ],
    id: "optical-balance",
    label: "Optical Balance",
    pattern: { centerX: 0.5, centerY: 0.9, radius: 0.37 },
    rules: [
      { opacity: 0.28, x1: 0.5, x2: 0.5, y1: 0.05, y2: 0.54 },
      { opacity: 0.42, x1: 0.055, x2: 0.945, y1: 0.54, y2: 0.54 },
    ],
    text: [
      { fontSize: 0.04, fontWeight: 540, letterSpacingEm: -0.035, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.15, source: "marker", x: 0.055, y: 0.1 },
      { align: "center", fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.05, lineHeight: 1.1, maxCharacters: 26, maxWidth: 0.3, source: "eyebrow", x: 0.5, y: 0.065 },
      { align: "center", fontSize: 0.092, fontWeight: 540, letterSpacingEm: -0.055, lineHeight: 0.84, maxCharacters: 12, maxWidth: 0.68, source: "headline", x: 0.5, y: 0.2 },
      { fontSize: 0.014, fontWeight: 400, lineHeight: 1.23, maxCharacters: 26, maxWidth: 0.25, source: "body", x: 0.7, y: 0.36 },
      { fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 40, maxWidth: 0.42, source: "footer", x: 0.055, y: 0.52 },
      { align: "right", fontSize: 0.0115, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.42, source: "equation", x: 0.945, y: 0.57 },
    ],
  },
  {
    copy: {
      body:
        "Margins carry notes, numbers and orientation while protecting the central argument. The edge becomes a parallel channel rather than leftover space.",
      eyebrow: "OUTER FRAME / 09",
      footer: "ANNOTATION / NAVIGATION / AIR",
      headline: "THE MARGIN\nSPEAKS",
      marker: "09",
    },
    grid: {
      columns: 12,
      marginX: 0.055,
      marginY: 0.05,
      opacity: 0.1,
      rows: 20,
      showColumns: false,
      showRows: true,
    },
    annotations: [
      { content: "INNER FRAME", fontSize: 0.0105, fontWeight: 550, id: "inner-frame", letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.18, rotation: -90, x: 0.12, y: 0.9 },
      { content: "OUTER NOTE", fontSize: 0.0105, fontWeight: 550, id: "outer-note", letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.18, x: 0.2, y: 0.08 },
      { align: "right", content: "FOLIO / RIGHT", fontSize: 0.0105, fontWeight: 550, id: "folio-right", letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.18, x: 0.945, y: 0.18 },
      { content: "SAFE AREA", fontSize: 0.0105, fontWeight: 500, id: "safe-area", lineHeight: 1.1, maxCharacters: 16, maxWidth: 0.15, x: 0.2, y: 0.58 },
      { align: "right", content: "EDGE CHANNEL", fontSize: 0.0105, fontWeight: 500, id: "edge-channel", lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.18, x: 0.945, y: 0.58 },
    ],
    id: "margin-system",
    label: "Margin System",
    pattern: { centerX: 0.42, centerY: 0.94, radius: 0.39 },
    rules: [
      { opacity: 0.5, weight: 1.2, x1: 0.16, x2: 0.16, y1: 0.05, y2: 0.94 },
      { opacity: 0.5, weight: 1.2, x1: 0.055, x2: 0.945, y1: 0.55, y2: 0.55 },
    ],
    text: [
      { align: "right", fontSize: 0.083, fontWeight: 530, letterSpacingEm: -0.05, lineHeight: 0.86, maxCharacters: 4, maxWidth: 0.2, source: "marker", x: 0.945, y: 0.14 },
      { fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.05, lineHeight: 1.1, maxCharacters: 28, maxWidth: 0.28, rotation: -90, source: "eyebrow", x: 0.04, y: 0.72 },
      { fontSize: 0.082, fontWeight: 550, letterSpacingEm: -0.052, lineHeight: 0.86, maxCharacters: 12, maxWidth: 0.46, source: "headline", x: 0.2, y: 0.18 },
      { fontSize: 0.014, fontWeight: 400, lineHeight: 1.23, maxCharacters: 27, maxWidth: 0.3, source: "body", x: 0.64, y: 0.2 },
      { fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 38, maxWidth: 0.39, source: "footer", x: 0.2, y: 0.53 },
      { align: "right", fontSize: 0.0115, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.42, source: "equation", x: 0.945, y: 0.475 },
    ],
  },
  {
    copy: {
      body:
        "A strong grid survives change. Content, scale and emphasis can shift while the underlying relations remain recognizable and useful.",
      eyebrow: "VARIABLE EDITION / 10",
      footer: "SYSTEM + VARIATION = IDENTITY",
      headline: "ONE SYSTEM\nMANY PAGES",
      marker: "10",
    },
    grid: {
      columns: 12,
      marginX: 0.055,
      marginY: 0.05,
      opacity: 0.1,
      rows: 18,
      showColumns: true,
      showRows: false,
    },
    annotations: [
      { content: "CONTENT / VARIABLE 01", fontSize: 0.0105, fontWeight: 550, id: "variable-content", letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 28, maxWidth: 0.23, x: 0.055, y: 0.18 },
      { content: "SCALE / VARIABLE 02", fontSize: 0.0105, fontWeight: 550, id: "variable-scale", letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 28, maxWidth: 0.23, x: 0.29, y: 0.18 },
      { content: "EMPHASIS / VARIABLE 03", fontSize: 0.0105, fontWeight: 550, id: "variable-emphasis", letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 30, maxWidth: 0.25, x: 0.53, y: 0.18 },
      { align: "right", content: "RHYTHM / VARIABLE 04", fontSize: 0.0105, fontWeight: 550, id: "variable-rhythm", letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 28, maxWidth: 0.23, x: 0.945, y: 0.18 },
      { content: "ORDER / FIELD", fontSize: 0.0105, fontWeight: 500, id: "order-field", lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.18, x: 0.055, y: 0.28 },
      { content: "VOICE / SCALE", fontSize: 0.0105, fontWeight: 500, id: "voice-scale", lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.18, x: 0.29, y: 0.28 },
      { content: "SYSTEM / USE", fontSize: 0.0105, fontWeight: 500, id: "system-use", lineHeight: 1.1, maxCharacters: 20, maxWidth: 0.18, x: 0.53, y: 0.28 },
      { align: "right", content: "IDENTITY / MEMORY", fontSize: 0.0105, fontWeight: 500, id: "identity-memory", lineHeight: 1.1, maxCharacters: 24, maxWidth: 0.2, x: 0.945, y: 0.28 },
      { align: "center", content: "ONE GRID — TEN OUTCOMES", fontSize: 0.011, fontWeight: 600, id: "ten-outcomes", letterSpacingEm: 0.045, lineHeight: 1.1, maxCharacters: 32, maxWidth: 0.3, x: 0.5, y: 0.36 },
    ],
    id: "variable-order",
    label: "Variable Order",
    pattern: { centerX: 0.5, centerY: 1.01, radius: 0.46 },
    rules: [
      { opacity: 0.48, weight: 1.2, x1: 0.055, x2: 0.945, y1: 0.13, y2: 0.13 },
      { opacity: 0.48, weight: 1.2, x1: 0.055, x2: 0.945, y1: 0.76, y2: 0.76 },
    ],
    text: [
      { fontSize: 0.046, fontWeight: 540, letterSpacingEm: -0.04, lineHeight: 0.9, maxCharacters: 4, maxWidth: 0.16, source: "marker", x: 0.055, y: 0.09 },
      { fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.045, lineHeight: 1.1, maxCharacters: 30, maxWidth: 0.3, source: "eyebrow", x: 0.2, y: 0.065 },
      { fontSize: 0.014, fontWeight: 400, lineHeight: 1.23, maxCharacters: 29, maxWidth: 0.29, source: "body", x: 0.66, y: 0.065 },
      { fontSize: 0.086, fontWeight: 550, letterSpacingEm: -0.052, lineHeight: 0.85, maxCharacters: 16, maxWidth: 0.82, source: "headline", x: 0.055, y: 0.57 },
      { fontSize: 0.012, fontWeight: 600, letterSpacingEm: 0.04, lineHeight: 1.1, maxCharacters: 38, maxWidth: 0.4, source: "footer", x: 0.055, y: 0.73 },
      { align: "right", fontSize: 0.0115, fontWeight: 400, lineHeight: 1.24, maxCharacters: 48, maxWidth: 0.42, source: "equation", x: 0.945, y: 0.685 },
    ],
  },
] as const satisfies readonly EditorialTemplate[];

export const editorialTemplates = [
  ...coreEditorialTemplates,
  ...additionalEditorialTemplates,
] as const satisfies readonly EditorialTemplate[];

const editorialTemplateIdSet = new Set<string>(
  editorialTemplates.map(({ id }) => id),
);

export const editorialTemplateOptions = editorialTemplates.map(({ id, label }) => ({
  label,
  value: id,
}));

export function isEditorialTemplateId(value: unknown): value is EditorialTemplateId {
  return typeof value === "string" && editorialTemplateIdSet.has(value);
}

export function getEditorialTemplate(value: unknown): EditorialTemplate {
  if (isEditorialTemplateId(value)) {
    const match = editorialTemplates.find(({ id }) => id === value);
    if (match) return match;
  }

  return editorialTemplates[0];
}

export function resolveEditorialCopy(
  template: EditorialTemplate,
  customCopyEnabled: boolean,
  customCopy: CustomEditorialCopy,
): EditorialCopy {
  if (!customCopyEnabled) return template.copy;

  return {
    ...customCopy,
    marker: template.copy.marker,
  };
}
