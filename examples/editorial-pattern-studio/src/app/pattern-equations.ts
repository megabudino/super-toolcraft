export type Point = readonly [number, number];

export type EquationId =
  | "harmonic-halo"
  | "coupled-pendulum"
  | "magnetic-orbit"
  | "standing-wave"
  | "torus-knot"
  | "hypotrochoid"
  | "duffing-trace"
  | "vortex-ring"
  | "wave-packet"
  | "membrane-mode"
  | "superformula"
  | "shell-interference";

export type EquationParameters = {
  coupling: number;
  phase: number;
  resonance: number;
  symmetry: number;
  warp: number;
};

type NormalizedEquationParameters = {
  c: number;
  m: number;
  n: number;
  phi: number;
  phaseDegrees: number;
  w: number;
};

export const equationOptions: readonly { label: string; value: EquationId }[] = [
  { label: "Harmonic Halo", value: "harmonic-halo" },
  { label: "Coupled Pendulum", value: "coupled-pendulum" },
  { label: "Magnetic Orbit", value: "magnetic-orbit" },
  { label: "Standing Wave", value: "standing-wave" },
  { label: "Torus Knot", value: "torus-knot" },
  { label: "Hypotrochoid", value: "hypotrochoid" },
  { label: "Duffing Trace", value: "duffing-trace" },
  { label: "Vortex Ring", value: "vortex-ring" },
  { label: "Wave Packet", value: "wave-packet" },
  { label: "Membrane Mode", value: "membrane-mode" },
  { label: "Superformula", value: "superformula" },
  { label: "Shell Interference", value: "shell-interference" },
];

const equationIds = new Set<EquationId>(equationOptions.map(({ value }) => value));

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function isEquationId(value: unknown): value is EquationId {
  return typeof value === "string" && equationIds.has(value as EquationId);
}

function normalizeParameters(parameters: EquationParameters): NormalizedEquationParameters {
  const n = Math.round(clamp(parameters.symmetry, 2, 16));
  const resonance = Math.round(clamp(parameters.resonance, 1, 16));
  const phaseDegrees = clamp(parameters.phase, -180, 180);

  return {
    c: 0.12 + 0.78 * (clamp(parameters.coupling, 0, 100) / 100),
    m: n + resonance,
    n,
    phi: (phaseDegrees * Math.PI) / 180,
    phaseDegrees,
    w: clamp(parameters.warp, 0, 100) / 100,
  };
}

function evaluateEquation(
  equation: EquationId,
  t: number,
  parameters: NormalizedEquationParameters,
): Point {
  const { c, m, n, phi, w } = parameters;
  const difference = m - n;

  switch (equation) {
    case "harmonic-halo":
      return [
        Math.cos(n * t) + c * Math.sin((7 * m + 1) * t + phi) + 0.28 * w * Math.cos((n + m) * t),
        0.82 * Math.sin(n * t) + c * Math.cos((7 * m - 1) * t - phi) + 0.28 * w * Math.sin((n + m) * t),
      ];
    case "coupled-pendulum":
      return [
        Math.cos(n * t) + c * Math.cos(m * t + phi) + 0.38 * w * Math.cos((n + m) * t),
        Math.sin(n * t) - c * Math.sin(m * t - phi) + 0.38 * w * Math.sin(difference * t + phi),
      ];
    case "magnetic-orbit":
      return [
        (1 - c * 0.45) * Math.cos(n * t) + c * Math.cos(m * t + phi) + 0.3 * w * Math.cos((n + 2 * m) * t),
        (1 - c * 0.45) * Math.sin(n * t) - c * Math.sin(m * t + phi) + 0.3 * w * Math.sin((2 * n + m) * t),
      ];
    case "standing-wave": {
      const theta = n * t + 0.32 * w * Math.sin(m * t + phi);
      const radius = 1 + 0.58 * c * Math.cos(m * t + phi) + 0.24 * w * Math.cos((n + m) * t);
      return [radius * Math.cos(theta), (0.72 + c * 0.22) * radius * Math.sin(theta)];
    }
    case "torus-knot": {
      const breathing = 1 + 0.62 * c * Math.cos(m * t + phi);
      const theta = n * t + 0.3 * w * Math.sin(m * t - phi);
      return [
        breathing * Math.cos(theta) + 0.18 * w * Math.cos(difference * t),
        breathing * Math.sin(theta) + 0.42 * w * Math.sin(m * t + phi),
      ];
    }
    case "hypotrochoid":
      return [
        (1 - c * 0.35) * Math.cos(n * t) + c * Math.cos(difference * t + phi) + 0.32 * w * Math.cos(m * t),
        (1 - c * 0.35) * Math.sin(n * t) - c * Math.sin(difference * t + phi) + 0.32 * w * Math.sin(m * t),
      ];
    case "duffing-trace":
      return [
        Math.cos(n * t) + 0.58 * c * Math.cos(3 * n * t + phi) + 0.3 * w * Math.cos(m * t),
        Math.sin(m * t + phi) + 0.58 * c * Math.sin(3 * m * t - phi) + 0.3 * w * Math.sin(n * t),
      ];
    case "vortex-ring": {
      const theta = n * t + 0.38 * w * Math.sin(m * t - phi);
      const radius = 1 + 0.52 * c * Math.sin(m * t + phi + w * Math.sin(n * t));
      return [
        radius * Math.cos(theta) + 0.22 * c * Math.cos((n + m) * t),
        radius * Math.sin(theta) + 0.22 * c * Math.sin(difference * t + phi),
      ];
    }
    case "wave-packet": {
      const envelope = 1 + 0.58 * c * Math.cos(difference * t + phi);
      return [
        envelope * Math.cos(n * t) + 0.34 * w * Math.cos(m * t + phi),
        envelope * Math.sin(m * t + phi) + 0.34 * w * Math.sin(n * t),
      ];
    }
    case "membrane-mode":
      return [
        Math.cos(n * t) * (1 + 0.7 * c * Math.cos(m * t + phi)) + 0.3 * w * Math.cos((n + m) * t),
        Math.sin(m * t) * (1 + 0.7 * c * Math.sin(n * t - phi)) + 0.3 * w * Math.sin(difference * t),
      ];
    case "superformula": {
      const theta = t + 0.2 * w * Math.sin(m * t + phi);
      const cosine = Math.abs(Math.cos(n * theta));
      const sine = Math.abs(Math.sin(n * theta));
      const base = cosine ** (2 + c * 4) + sine ** (2 + w * 6);
      const radius = Math.max(0.24, base ** (-1 / (1.2 + c + w)) + 0.16 * c * Math.cos(m * t + phi));
      return [
        radius * Math.cos(theta) + 0.16 * w * Math.cos(difference * t),
        radius * Math.sin(theta) + 0.16 * w * Math.sin(m * t + phi),
      ];
    }
    case "shell-interference":
      return [
        Math.cos(t) + c * Math.sin((7 * m + 1) * t + phi) + 0.3 * w * Math.cos(n * t),
        (0.7 + 0.2 * c) * Math.sin(t) + c * Math.cos((7 * m - 1) * t - phi) + 0.3 * w * Math.sin(n * t),
      ];
  }
}

export function sampleEquationPoints(
  equation: EquationId,
  parameters: EquationParameters,
  detail: number,
): readonly Point[] {
  const safeDetail = Math.round(clamp(detail, 800, 12_000));
  const normalizedParameters = normalizeParameters(parameters);
  const points: Point[] = [];

  for (let index = 0; index <= safeDetail; index += 1) {
    points.push(
      evaluateEquation(equation, (index / safeDetail) * Math.PI * 2, normalizedParameters),
    );
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const radius = Math.max((maxX - minX) / 2, (maxY - minY) / 2, 0.0001);

  return points.map(([x, y]) => [(x - centerX) / radius, (y - centerY) / radius] as const);
}

export function getEquationDisplayLines(
  equation: EquationId,
  parameters: EquationParameters,
): readonly [string, string] {
  const { c, m, n, phaseDegrees, w } = normalizeParameters(parameters);
  const label = equationOptions.find(({ value }) => value === equation)?.label ?? "Field Equation";
  const phi = ((phaseDegrees * Math.PI) / 180).toFixed(2);
  const coupling = c.toFixed(2);
  const warp = w.toFixed(2);
  const difference = m - n;

  switch (equation) {
    case "harmonic-halo":
      return [
        `${label} · x(t)=cos(${n}t)+${coupling}sin(${7 * m + 1}t+${phi})+${(0.28 * w).toFixed(2)}cos(${n + m}t)`,
        `y(t)=0.82sin(${n}t)+${coupling}cos(${7 * m - 1}t−${phi})+${(0.28 * w).toFixed(2)}sin(${n + m}t)`,
      ];
    case "coupled-pendulum":
      return [
        `${label} · x(t)=cos(${n}t)+${coupling}cos(${m}t+${phi})+${(0.38 * w).toFixed(2)}cos(${n + m}t)`,
        `y(t)=sin(${n}t)−${coupling}sin(${m}t−${phi})+${(0.38 * w).toFixed(2)}sin(${difference}t+${phi})`,
      ];
    case "magnetic-orbit":
      return [
        `${label} · x(t)=${(1 - c * 0.45).toFixed(2)}cos(${n}t)+${coupling}cos(${m}t+${phi})+${(0.3 * w).toFixed(2)}cos(${n + 2 * m}t)`,
        `y(t)=${(1 - c * 0.45).toFixed(2)}sin(${n}t)−${coupling}sin(${m}t+${phi})+${(0.3 * w).toFixed(2)}sin(${2 * n + m}t)`,
      ];
    case "standing-wave":
      return [
        `${label} · x(t)=r(t)cos(${n}t+${(0.32 * w).toFixed(2)}sin(${m}t+${phi}))`,
        `y(t)=${(0.72 + c * 0.22).toFixed(2)}r(t)sin(·), r(t)=1+${(0.58 * c).toFixed(2)}cos(${m}t+${phi})+${(0.24 * w).toFixed(2)}cos(${n + m}t)`,
      ];
    case "torus-knot":
      return [
        `${label} · x(t)=(1+${(0.62 * c).toFixed(2)}cos(${m}t+${phi}))cos(${n}t+${(0.3 * w).toFixed(2)}sin(${m}t−${phi}))`,
        `y(t)=(1+${(0.62 * c).toFixed(2)}cos(${m}t+${phi}))sin(·)+${(0.42 * w).toFixed(2)}sin(${m}t+${phi})`,
      ];
    case "hypotrochoid":
      return [
        `${label} · x(t)=${(1 - c * 0.35).toFixed(2)}cos(${n}t)+${coupling}cos(${difference}t+${phi})+${(0.32 * w).toFixed(2)}cos(${m}t)`,
        `y(t)=${(1 - c * 0.35).toFixed(2)}sin(${n}t)−${coupling}sin(${difference}t+${phi})+${(0.32 * w).toFixed(2)}sin(${m}t)`,
      ];
    case "duffing-trace":
      return [
        `${label} · x(t)=cos(${n}t)+${(0.58 * c).toFixed(2)}cos(${3 * n}t+${phi})+${(0.3 * w).toFixed(2)}cos(${m}t)`,
        `y(t)=sin(${m}t+${phi})+${(0.58 * c).toFixed(2)}sin(${3 * m}t−${phi})+${(0.3 * w).toFixed(2)}sin(${n}t)`,
      ];
    case "vortex-ring":
      return [
        `${label} · x(t)=r(t)cos(${n}t+${(0.38 * w).toFixed(2)}sin(${m}t−${phi}))+${(0.22 * c).toFixed(2)}cos(${n + m}t)`,
        `y(t)=r(t)sin(·)+${(0.22 * c).toFixed(2)}sin(${difference}t+${phi}), r(t)=1+${(0.52 * c).toFixed(2)}sin(${m}t+${phi}+${warp}sin(${n}t))`,
      ];
    case "wave-packet":
      return [
        `${label} · x(t)=e(t)cos(${n}t)+${(0.34 * w).toFixed(2)}cos(${m}t+${phi})`,
        `y(t)=e(t)sin(${m}t+${phi})+${(0.34 * w).toFixed(2)}sin(${n}t), e(t)=1+${(0.58 * c).toFixed(2)}cos(${difference}t+${phi})`,
      ];
    case "membrane-mode":
      return [
        `${label} · x(t)=cos(${n}t)(1+${(0.7 * c).toFixed(2)}cos(${m}t+${phi}))+${(0.3 * w).toFixed(2)}cos(${n + m}t)`,
        `y(t)=sin(${m}t)(1+${(0.7 * c).toFixed(2)}sin(${n}t−${phi}))+${(0.3 * w).toFixed(2)}sin(${difference}t)`,
      ];
    case "superformula":
      return [
        `${label} · x(t)=r(t)cos(t+${(0.2 * w).toFixed(2)}sin(${m}t+${phi}))+${(0.16 * w).toFixed(2)}cos(${difference}t)`,
        `y(t)=r(t)sin(·)+${(0.16 * w).toFixed(2)}sin(${m}t+${phi}), r(t)=(|cos(${n}θ)|^${(2 + c * 4).toFixed(1)}+|sin(${n}θ)|^${(2 + w * 6).toFixed(1)})^−${(1 / (1.2 + c + w)).toFixed(2)}`,
      ];
    case "shell-interference":
      return [
        `${label} · x(t)=cos(t)+${coupling}sin(${7 * m + 1}t+${phi})+${(0.3 * w).toFixed(2)}cos(${n}t)`,
        `y(t)=${(0.7 + 0.2 * c).toFixed(2)}sin(t)+${coupling}cos(${7 * m - 1}t−${phi})+${(0.3 * w).toFixed(2)}sin(${n}t)`,
      ];
  }
}
