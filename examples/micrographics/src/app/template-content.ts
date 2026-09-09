import type { MicrographTemplateId } from "./template-catalog";

export function contentRandom(seed: number): () => number {
  let value = Math.floor(seed) % 2147483647;
  if (value <= 0) {
    value += 2147483646;
  }
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length) % items.length] as T;
}

function digits(rng: () => number, count: number): string {
  let value = "";
  for (let index = 0; index < count; index += 1) {
    value += String(Math.floor(rng() * 10));
  }
  return value;
}

function letters(rng: () => number, count: number): string {
  const alphabet = "ABCDEFGHJKLMNPRSTVWXZ";
  let value = "";
  for (let index = 0; index < count; index += 1) {
    value += alphabet[Math.floor(rng() * alphabet.length)] ?? "X";
  }
  return value;
}

function code(rng: () => number): string {
  return `${letters(rng, 1)}${digits(rng, 1)}-${digits(rng, 2)}`;
}

function longCode(rng: () => number): string {
  return `${letters(rng, 3)}-${letters(rng, 1)}${digits(rng, 1)}-${digits(rng, 4)}`;
}

const processWords = [
  "ALIGN",
  "CALIBRATE",
  "CHARGE",
  "EXTRACT",
  "INTAKE",
  "LEVEL",
  "LOAD",
  "PROCESS",
  "RENDER",
  "SEAL",
  "SHIP",
  "SYNC",
  "TORQUE",
  "VERIFY",
] as const;

const captionWords = [
  "ENGINEERED FOR MOTION",
  "FIELD READY UNIT",
  "INTERNAL ISSUE",
  "REFERENCE SAMPLE",
  "SYSTEMS INTEGRATION",
  "TECHNICAL PROOF",
] as const;

const cities = [
  ["BERLIN", "52.5200° N", "13.4050° E", "CET UTC+01:00", "BER | DEU"],
  ["OSLO", "59.9139° N", "10.7522° E", "CET UTC+01:00", "OSL | NOR"],
  ["TOKYO", "35.6762° N", "139.6503° E", "JST UTC+09:00", "TYO | JPN"],
  ["ZURICH", "47.3769° N", "8.5417° E", "CET UTC+01:00", "ZRH | CHE"],
] as const;

function numberedRows(
  rng: () => number,
  count: number,
  state: (index: number) => string,
): string[] {
  const rows: string[] = [];
  const used = new Set<string>();
  for (let index = 0; index < count; index += 1) {
    let word = pick(rng, processWords);
    while (used.has(word) && used.size < processWords.length) {
      word = pick(rng, processWords);
    }
    used.add(word);
    rows.push(`0${index + 1} | ${word} | ${state(index)}`);
  }
  return rows;
}

export function generateTemplateContent(
  template: MicrographTemplateId,
  seed: number,
): string {
  const rng = contentRandom(seed * 7907 + 11);

  if (template.startsWith("mega-")) {
    const brand = pick(rng, ["VEKTOR", "ORBITA", "KOSMOS", "ATLAS", "NORDMARK"]);
    return [
      `©3.11LABS | ${brand}`,
      pick(rng, ["TXT2IMG", "IMG2IMG", "TXT2VID"]),
      "We are architects of | the unseen.",
      `MIDJOURNEY | 6.${Math.floor(rng() * 9)}`,
      `STABLE DIFFUSION | 1.${Math.floor(rng() * 9)}`,
      `RUNWAYML | 2.${Math.floor(rng() * 9)}`,
      String(20 + Math.floor(rng() * 75)),
      `${letters(rng, 2)}-${digits(rng, 3)}`,
    ].join("\n");
  }

  if (template.startsWith("plate-")) {
    const brand = pick(rng, ["VEKTOR", "ORBITA", "KOSMOS", "ATLAS", "NORDMARK"]);
    return [
      `©3.11LABS | ${brand}`,
      "TXT2IMG",
      "We are architects of | the unseen.",
      "MIDJOURNEY",
      "STABLE DIFFUSION",
      "RUNWAYML",
      `SD 1.${1 + Math.floor(rng() * 8)}`,
    ].join("\n");
  }

  switch (template as string) {
    case "address": {
      const city = pick(rng, cities);
      return ["TO", "STUDIO VEKTOR HAUS", `${digits(rng, 3)} BAHNHOFSTRASSE`, city[0], city[4].slice(-3)].join("\n");
    }
    case "barcode":
      return `LAB-${letters(rng, 1)}${digits(rng, 1)}-${letters(rng, 2)}${digits(rng, 2)}-202${Math.floor(rng() * 7)}`;
    case "binary": {
      const row = (): string =>
        Array.from({ length: 28 }, () => (rng() > 0.5 ? "1" : "0")).join("");
      return [row(), row(), row()].join("\n");
    }
    case "arc-lockup": {
      const brand = pick(rng, ["VEKTOR", "ORBITA", "KOSMOS", "ATLAS"]);
      return [
        "TXT2IMG",
        `©3.11LABS | ${brand}`,
        "MIDJOURNEY",
        "STABLE DIFFUSION",
        "RUNWAYML",
        `SD 1.${1 + Math.floor(rng() * 8)}`,
        "We are architects of | the unseen.",
        "20 | 25",
      ].join("\n");
    }
    case "axis-lockup":
      return [
        `©2025 V2.${Math.floor(rng() * 9)} SD1.${Math.floor(rng() * 9)}`,
        "TXT2IMG",
        pick(rng, ["VEKTOR", "ORBITA", "KOSMOS", "ATLAS"]),
        "We are architects of | the unseen.",
        "/ 2025",
        "©3.11LABS",
        `MIDJOURNEY | 6.${Math.floor(rng() * 9)}`,
        `STABLE DIFFUSION | 1.${Math.floor(rng() * 9)}`,
        `RUNWAYML | 2.${Math.floor(rng() * 9)}`,
      ].join("\n");
    case "lab-plate":
      return [
        `3.11LABS | ${pick(rng, ["NYC", "TYO", "BER"])}`,
        "ALGORITHMICALLY GENERATED",
        "WE ARE | ARCHITECTS OF THE UNSEEN",
        `DIMENSIONS: | ${(rng() * 3 + 1).toFixed(1)}" X ${(rng() * 9 + 4).toFixed(1)}" X ${(rng() * 12 + 8).toFixed(1)}"`,
        `For ${pick(rng, ["Vektor", "Atlas", "Orbita"])}, Inc`,
        "MIDJOURNEY",
        "STABLE DIFFUSION",
        "RUNWAYML",
        `SD 1.${1 + Math.floor(rng() * 8)}`,
      ].join("\n");
    case "lamp-lockup":
      return [
        "Y©2025",
        `©3.11LABS | ${pick(rng, ["VEKTOR", "ORBITA", "ATLAS"])}`,
        "MIDJOURNEY",
        "STABLE DIFFUSION",
        "RUNWAYML",
        `SD 1.${1 + Math.floor(rng() * 8)}`,
        "TXT2IMG",
      ].join("\n");
    case "strip-lockup":
      return [
        "©3.11LABS",
        pick(rng, ["VEKTOR", "ORBITA", "KOSMOS", "ATLAS"]),
        "MIDJOURNEY",
        "STABLE DIFFUSION",
        "RUNWAYML",
        "We are architects | of the unseen.",
        "TXT2IMG | Y 2025",
      ].join("\n");
    case "studio-lockup":
      return [
        "©3.11LABS",
        "Algorithmically Generated",
        `${pick(rng, ["NYC", "TYO", "BER", "OSL"])} 2025`,
        "/TOOLS",
        "MIDJOURNEY",
        "STABLE DIFFUSION",
        "RUNWAYML",
        `SD 1.${1 + Math.floor(rng() * 8)}`,
        `For ${pick(rng, ["Vektor", "Atlas", "Orbita"])}, Inc`,
      ].join("\n");
    case "arc-orbits":
      return rng() > 0.5 ? `${letters(rng, 1)}${digits(rng, 1)}-${digits(rng, 2)}` : "";
    case "axis-star":
      return "";
    case "bar-column":
      return "";
    case "brand-lockup": {
      const brand = pick(rng, ["VEKTOR", "ORBITA", "KOSMOS", "ATLAS", "NORDMARK"]);
      return [
        "TXT2IMG",
        "©3.11LABS",
        brand,
        "MIDJOURNEY",
        "STABLE DIFFUSION",
        "RUNWAYML",
        `SD 1.${1 + Math.floor(rng() * 8)}`,
      ].join("\n");
    }
    case "approval":
      return `APPROVED | QA-${digits(rng, 2)}`;
    case "battery":
      return String(10 + Math.floor(rng() * 90));
    case "calendar":
      return String(1 + Math.floor(rng() * 28));
    case "callout":
      return ["A", "B", "C"].map((marker) => `${marker} | ${pick(rng, processWords)}`).join("\n");
    case "chevron-flow":
      return pick(rng, ["FEED", "FLOW", "NEXT", "PUSH"]);
    case "circuit":
      return `PCB-${letters(rng, 1)}${digits(rng, 2)}`;
    case "clock-face":
      return `${String(Math.floor(rng() * 24)).padStart(2, "0")}:${String(Math.floor(rng() * 60)).padStart(2, "0")}`;
    case "constellation":
      return `${pick(rng, ["LYR", "ORI", "CAS", "VEG"])}-${digits(rng, 2)}`;
    case "donut-gauge":
      return `${20 + Math.floor(rng() * 75)} | ${pick(rng, ["CHARGE", "FILL", "USED", "LOAD"])}`;
    case "elevation":
      return `PEAK ${1 + Math.floor(rng() * 3)} ${digits(rng, 3)} M | PROFILE 0${1 + Math.floor(rng() * 8)}`;
    case "equalizer":
      return `EQ-${digits(rng, 2)} | ${digits(rng, 2)} DB`;
    case "fader":
      return `${pick(rng, ["GAIN", "MIX", "TRIM", "PAN"])} | ${digits(rng, 2)}`;
    case "fingerprint":
      return `ID ${digits(rng, 4)}`;
    case "gantt":
      return numberedRows(rng, 4, () => "").map((row) => row.split(" | ")[1] ?? "").join("\n");
    case "grid-cell":
      return `${pick(rng, ["A", "B", "C", "D", "E", "F"])}${1 + Math.floor(rng() * 6)}`;
    case "helix":
      return `GC ${digits(rng, 2)}%`;
    case "hex-grid":
      return `HX-${digits(rng, 2)}`;
    case "histogram":
      return pick(rng, ["DENSITY", "OUTPUT", "LOAD", "SPREAD"]);
    case "iso-cube":
      return `${digits(rng, 3)} | ${digits(rng, 2)} | ${digits(rng, 2)}`;
    case "level":
      return `LEVEL | 0.${digits(rng, 1)}°`;
    case "matrix":
      return [0, 1, 2]
        .map(() => `${digits(rng, 1)} | ${digits(rng, 1)} | ${digits(rng, 1)}`)
        .join("\n");
    case "moon-phases":
      return `PHASE ${1 + Math.floor(rng() * 8)}`;
    case "notation":
      return `OP. ${digits(rng, 2)}`;
    case "percent-blocks":
      return String(10 * (1 + Math.floor(rng() * 9)));
    case "pipeline":
      return pick(rng, ["IN | PROC | OUT", "LOAD | SYNC | SEAL | SHIP", "RAW | RENDER | POST"]);
    case "postmark":
      return `${pick(rng, ["OSLO", "TOKYO", "ZURICH", "BERLIN"])} | 202${Math.floor(rng() * 7)}`;
    case "protractor":
      return `${10 + Math.floor(rng() * 160)}`;
    case "punch-card":
      return `PC-${digits(rng, 2)}`;
    case "receipt":
      return [
        `RENDER | ${(rng() * 8 + 1).toFixed(2)}`,
        `SYNC | ${(rng() * 3 + 0.4).toFixed(2)}`,
        `TOTAL | ${(rng() * 11 + 2).toFixed(2)}`,
      ].join("\n");
    case "reticle":
      return `MIL ${digits(rng, 1)}.${digits(rng, 1)}`;
    case "route-map": {
      const stops = ["OSL", "BER", "ZRH", "NYC", "TYO"];
      const origin = Math.floor(rng() * stops.length);
      const destination = (origin + 1 + Math.floor(rng() * (stops.length - 1))) % stops.length;
      return `${stops[origin]} - ${stops[destination]} | ${digits(rng, 1)} ${digits(rng, 3)} KM`;
    }
    case "scatter":
      return `${pick(rng, ["SAMPLE", "FIELD", "BATCH"])} ${letters(rng, 1)}`;
    case "scope":
      return `CH${1 + Math.floor(rng() * 4)} | ${digits(rng, 2)} HZ`;
    case "stamp-frame":
      return `${digits(rng, 2)} | ${pick(rng, ["POST", "AIR", "EXP"])}`;
    case "sun-path":
      return `0${4 + Math.floor(rng() * 4)}:${pick(rng, ["00", "15", "30"])} | ${18 + Math.floor(rng() * 4)}:${pick(rng, ["00", "15", "45"])}`;
    case "switch-bank":
      return `SW | ${Array.from({ length: 4 }, () => (rng() > 0.4 ? "1" : "0")).join(" ")}`;
    case "tally":
      return String(7 + Math.floor(rng() * 19));
    case "terminal":
      return [
        `> run ${pick(rng, ["render", "build", "sync"])}`,
        `> ${pick(rng, ["sync", "pack", "seal"])} --all`,
        "> done",
      ].join("\n");
    case "test-pattern":
      return `CAL ${digits(rng, 2)}`;
    case "thermometer":
      return `${digits(rng, 2)}°C`;
    case "ticket":
      return `ADMIT | ${digits(rng, 6)}`;
    case "tick-ring":
      return `${digits(rng, 2)}%`;
    case "compass":
      return `${pick(rng, ["N", "NE", "NW", "S"])} ${digits(rng, 2)}°`;
    case "contour":
      return `${digits(rng, 3)} M`;
    case "cross-grid":
      return "";
    case "date-strip":
      return String(3 + Math.floor(rng() * 20));
    case "film-strip":
      return String(10 + Math.floor(rng() * 80));
    case "fold-marks":
      return "CUT | FOLD";
    case "keypad":
      return "";
    case "map-scale":
      return `1:${pick(rng, ["100", "200", "500", "1000"])} | ${pick(rng, ["50", "100", "250"])} M`;
    case "scale-ladder":
      return `0 | ${pick(rng, ["60", "100", "200"])} | M`;
    case "shipping-tag":
      return `FROM | ${pick(rng, ["OSL", "BER", "ZRH", "NYC"])}\nTO | ${pick(rng, ["TYO", "NYC", "OSL", "BER"])}`;
    case "viewfinder":
      return `REC | 00:${String(Math.floor(rng() * 60)).padStart(2, "0")}`;
    case "dieline":
      return `For ${pick(rng, ["Vektor", "Orbita", "Atlas", "Nordmark"])}, Inc`;
    case "molecule":
      return "";
    case "morse-row":
      return "";
    case "plate-header":
      return `3.11LABS | ${pick(rng, ["NYC", "TYO", "BER", "OSL"])}`;
    case "spec-block":
      return [
        "ALGORITHMICALLY GENERATED",
        "WE ARE | ARCHITECTS OF THE UNSEEN",
        `DIMENSIONS: | ${(rng() * 3 + 1).toFixed(1)}" X ${(rng() * 9 + 4).toFixed(1)}" X ${(rng() * 12 + 8).toFixed(1)}"`,
      ].join("\n");
    case "spoke-wheel":
      return rng() > 0.5 ? `${letters(rng, 1)}${digits(rng, 1)}-${digits(rng, 2)}` : "";
    case "tool-columns":
      return [
        `MIDJOURNEY | 6.${Math.floor(rng() * 9)}`,
        `STABLE DIFFUSION | 1.${Math.floor(rng() * 9)}`,
        `RUNWAYML | 2.${Math.floor(rng() * 9)}`,
      ].join("\n");
    case "totem":
      return "";
    case "dial":
      return `${digits(rng, 2)}% | ${pick(rng, ["OUTPUT", "CHARGE", "TORQUE", "LOAD"])}`;
    case "dot-matrix":
      return `DM-${digits(rng, 2)}`;
    case "eartag":
      return `${digits(rng, 4)} | ${pick(rng, ["NL", "DE", "CH", "NO", "JP"])}`;
    case "footer-line":
      return `TEN FORTY TWO | STUDIO | ${pick(rng, ["DUSSELDORF", "OSLO", "TOKYO", "ZURICH"])}`;
    case "lens":
      return `LN-${digits(rng, 2)}`;
    case "manifest":
      return [
        `GENERATE ${pick(rng, ["CINEMA", "OUTPUT", "SIGNAL"])}`,
        "TEXT TO MOTION",
        `${pick(rng, ["FILM", "FIELD", "UNIT"])} SYNTHESIS UNIT`,
        "EDIT DIRECT EXTEND",
        `${pick(rng, ["VIDEO", "AUDIO", "IMAGE"])} MODEL ACTIVE`,
      ].join("\n");
    case "orbit":
      return `${letters(rng, 1)}${digits(rng, 1)}-${digits(rng, 2)}`;
    case "pagination":
      return `0${1 + Math.floor(rng() * 8)} | 0${2 + Math.floor(rng() * 7)}\n${pick(rng, ["SECTION", "SEQUENCE", "VOLUME", "PLATE"])}`;
    case "pill-badge":
      return pick(rng, ["GENERATING", "THINKING...", "RENDERING", "SYNCING", "LOADING"]);
    case "progress":
      return `${pick(rng, ["LOADING", "RENDER", "UPLOAD", "SYNC"])} | ${digits(rng, 2)}%`;
    case "schematic":
      return `NODE ${letters(rng, 1)}${digits(rng, 1)}`;
    case "signal":
      return `SIGNAL | ${digits(rng, 2)}%`;
    case "stack":
      return `STACK 0${1 + Math.floor(rng() * 8)}`;
    case "starburst":
      return `${letters(rng, 1)}${digits(rng, 1)}-${digits(rng, 2)}`;
    case "big-number":
      return digits(rng, rng() > 0.65 ? 2 : 2).replace(/^0/, String(1 + Math.floor(rng() * 8)));
    case "brackets":
      return `SYSTEM MODULE\n${pick(rng, captionWords)}`;
    case "caption":
      return [`${pick(rng, ["INTERNAL ISSUE", "CONTROL SAMPLE", "FIELD REPORT"])}`, pick(rng, captionWords), `PROTOCOL ${code(rng)}`].join("\n");
    case "checklist":
      return ["CHECK", ...numberedRows(rng, 5, () => (rng() > 0.35 ? "OK" : "--"))].join("\n");
    case "coords": {
      const city = pick(rng, cities);
      return city.join("\n");
    }
    case "data-table":
      return [
        `POWER | ${digits(rng, 2)}%`,
        `WEIGHT | ${(rng() * 4 + 0.5).toFixed(2)} KG`,
        `WIDTH | ${digits(rng, 3)} MM`,
        `HEIGHT | ${digits(rng, 3)} MM`,
        `UNITS | ${digits(rng, 2)}`,
      ].join("\n");
    case "dimension":
      return `${digits(rng, 3)} MM`;
    case "globe": {
      const city = pick(rng, cities);
      return [city[1], city[2], city[4]].join("\n");
    }
    case "graph":
      return `${pick(rng, ["INTERNAL ISSUE", "CALIBRATION", "RESPONSE"])}`;
    case "hatch":
      return `TS-${letters(rng, 1)}${digits(rng, 1)}-${digits(rng, 4)}`;
    case "qr-code":
      return `LOT-${letters(rng, 1)}${digits(rng, 1)}-${digits(rng, 4)}`;
    case "radar":
      return `${digits(rng, 2)}-${digits(rng, 2)}`;
    case "reg-mark":
      return `${letters(rng, 1)}${digits(rng, 1)}-${digits(rng, 2)}`;
    case "ruler":
      return `0 | ${pick(rng, ["40", "60", "80", "120"])} | MM`;
    case "run-state":
      return ["STATE", ...numberedRows(rng, 5, (index) => (index < 3 ? "on" : "off"))].join("\n");
    case "sequence":
      return ["SEQUENCE", "001", "002", "003", "004", "005"].join("\n");
    case "spec-sheet":
      return [
        "CONTROL SAMPLE",
        `LENGTH | ${digits(rng, 3)} MM`,
        `CLOCK | ${digits(rng, 2)} HZ`,
        `MASS | ${(rng() * 3 + 0.2).toFixed(2)} KG`,
        "---",
        "CALIBRATION",
        `OFFSET | ${digits(rng, 2)} MK`,
        `PHASE | ${digits(rng, 1)}`,
      ].join("\n");
    case "target":
      return `${letters(rng, 1)}${digits(rng, 1)}-${digits(rng, 2)} | ${digits(rng, 2)}%`;
    case "timecode": {
      const pad = (value: number): string => String(value).padStart(2, "0");
      return `${pad(Math.floor(rng() * 24))}:${pad(Math.floor(rng() * 60))}:${pad(Math.floor(rng() * 60))}`;
    }
    case "waveform":
      return `ORIGIN | ${digits(rng, 2)}%`;
    default:
      return "";
  }
}

