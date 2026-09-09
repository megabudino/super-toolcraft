# Settings JSON Defaults Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the supported product values from `dot-ring-studio-settings.json`
the Dot Ring Studio defaults.

**Architecture:** Keep Toolcraft schema `defaultValue` as reset/default
authority and update only test expectations that encode old defaults. Do not
add startup-import logic, renderer fallback changes, or runtime-only initial
state.

**Tech Stack:** TypeScript, Toolcraft schema/runtime, Vitest/Playwright source
fixtures.

---

### Task 1: Update schema defaults

**Files:**
- Modify: `src/app/app-schema.ts`

- [ ] **Step 1: Replace supported defaults**

Set the schema defaults to:

```ts
canvas.renderScale.defaultValue = 2;
appearance.background = { hex: "#030A16" };
ring.radius = 372;
ring.density = 160;
ring.rows = 12;
ring.colorMode = "rows";
ring.color1 = { hex: "#441AFF" };
ring.color2 = { hex: "#3A99FF" };
ring.color3 = { hex: "#7B5AFF" };
ring.color4 = { hex: "#b8ff2e" };
ring.color5 = { hex: "#FFAC68" };
ring.colorSpread = 55;
ring.dotSize = 1.05;
ring.sizeResponse = 96;
ring.glow = 0;
wave.formula = "organic";
wave.speed = 0.35;
wave.rotationSpeed = 0.25;
wave.globalRotationSpeed = -0.39;
wave.affectedAmplitude = 156;
wave.calmAmplitude = 46;
wave.sectorAngle = 118;
wave.rowEcho = 10;
```

Keep already matching background inclusion, canvas size, timeline duration,
image export, and video export defaults unchanged. Keep `audio.source` as
`null`.

### Task 2: Update encoded expectations and worklog

**Files:**
- Modify: `src/app/app-schema.test.ts`
- Modify: `e2e/app-controls.spec.ts`
- Modify: `e2e/dot-ring-export-background.spec.ts`
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Update old default expectations**

Expect render scale `2`, settings-transfer radius `372`, and Infinity
background `#030A16`.

- [ ] **Step 2: Record the delivery decision**

Add an ordinary-delivery worklog entry covering the JSON source, supported
mapping, runtime-only exclusions, and the user's explicit no-checks request.

### Task 3: Respect verification constraint

- [ ] **Step 1: Do not execute checks**

Do not run Vitest, Playwright, typecheck, build, kernel verification,
`npm run verify:delivery`, or any other validation command.
