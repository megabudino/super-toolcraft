# Reference Lighting Scene Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce and load a Grass Studio settings preset that matches the supplied luminous moss-island reference as closely as the current controls allow, with lighting as the primary fidelity target.

**Architecture:** Keep product source and renderer unchanged. Transform the user's exported Toolcraft settings into a separate reversible preset, import it through the real settings flow, then iterate only existing camera, environment, vegetation, material, and scan-layer targets against real WebGL screenshots.

**Tech Stack:** Toolcraft settings JSON, existing Three.js/WebGL renderer, browser screenshot inspection, `jq` for read-only JSON validation, `apply_patch` for the preset artifact.

---

### Task 1: Create the reference-scene preset

**Files:**
- Read: `/Users/kusnizza/Downloads/grass-studio-settings.json`
- Create: `/Users/kusnizza/Downloads/grass-studio-reference-lighting-settings.json`

- [ ] **Step 1: Validate the source settings artifact**

Run:

```bash
jq -e '.appId == "grass-studio" and .source == "toolcraft-settings" and (.values | type == "object")' /Users/kusnizza/Downloads/grass-studio-settings.json
```

Expected: `true` and exit code `0`.

- [ ] **Step 2: Create a separate preset with the initial reference mapping**

Preserve all unrelated source keys and apply this target map:

```json
{
  "solo.terrain": false,
  "solo.lawn": false,
  "solo.tall": false,
  "solo.tufted": false,
  "solo.wild": false,
  "solo.white": false,
  "solo.yellow": false,
  "solo.rocks": false,
  "solo.boulder": false,
  "field.width": 7,
  "field.depth": 5,
  "terrain.noiseScale": 0.58,
  "terrain.detail": 4,
  "terrain.roughness": 56,
  "terrain.heightRange": [-0.08, 1.58],
  "preview.bladeCount": 6000,
  "preview.lawnBladeCount": 12000,
  "view.orientation": {
    "position": [0.055, 0.405, 0.913],
    "up": [0, 1, 0]
  },
  "environment.preset": "sunrise",
  "environment.visible": false,
  "environment.intensity": 195,
  "environment.rotationX": -18,
  "environment.rotation": 118,
  "environment.rotationZ": 128,
  "environment.keyColor": {"hex": "#FFF1AD"},
  "environment.keyStrength": 172,
  "environment.fillColor": {"hex": "#0A3327"},
  "environment.fillStrength": 23,
  "environment.rimColor": {"hex": "#C9E887"},
  "environment.rimStrength": 72,
  "environment.exposure": 108,
  "environment.sceneContrast": 158,
  "environment.sceneSaturation": 104,
  "environment.highlightWarmth": 52,
  "environment.shadowCoolness": 58,
  "environment.sunPatchEnabled": true,
  "environment.sunPatchScale": 3.8,
  "environment.sunPatchCoverage": 44,
  "environment.sunPatchSoftness": 56,
  "environment.sunPatchStrength": 84,
  "environment.sunPatchOffset": {"x": "-0.12", "y": "-0.18"},
  "environment.sunPatchSeed": 37,
  "scene.background": "#000000",
  "export.includeBackground": true,
  "wind.profile": "off",
  "lawn.enabled": true,
  "lawn.densityMax": 30000,
  "lawn.distanceMin": 0.015,
  "lawn.thickness": 0.0125,
  "lawn.heightRange": [0.06, 0.11],
  "lawn.taperEnd": 90,
  "lawn.tilt2d": 12,
  "lawn.pbrRoughness": 84,
  "lawn.pbrSheen": 48,
  "lawn.colorVariation": 34,
  "lawn.colorContrast": 130,
  "lawn.colorSaturation": 92,
  "lawn.instanceColor1": "#183E24",
  "lawn.instanceColorWeight1": 50,
  "lawn.instanceColor2": "#376A2C",
  "lawn.instanceColorWeight2": 34,
  "lawn.instanceColor3": "#72913D",
  "lawn.instanceColorWeight3": 16,
  "grass.enabled": true,
  "field.densityMax": 20000,
  "field.distanceMin": 0.04,
  "blade.thickness": 0.035,
  "blade.heightRange": [0.3, 0.9],
  "blade.taperEnd": 92,
  "blade.tilt2d": 28,
  "appearance.pbrRoughness": 76,
  "appearance.pbrSheen": 58,
  "appearance.colorVariation": 38,
  "appearance.colorContrast": 124,
  "appearance.colorSaturation": 94,
  "appearance.instanceColor1": "#1B4726",
  "appearance.instanceColorWeight1": 48,
  "appearance.instanceColor2": "#567D2D",
  "appearance.instanceColorWeight2": 34,
  "appearance.instanceColor3": "#A4B94E",
  "appearance.instanceColorWeight3": 18,
  "appearance.groundColor": {"hex": "#102B1D"},
  "surface.textureScale": 1.25,
  "surface.normalStrength": 118,
  "surface.roughness": 86,
  "surface.colorContrast": 126,
  "surface.colorSaturation": 78,
  "scan.tufted.enabled": true,
  "scan.tufted.count": 520,
  "scan.tufted.sizeRange": [0.3, 0.5],
  "scan.tufted.clumping": 68,
  "scan.wild.enabled": true,
  "scan.wild.count": 260,
  "scan.wild.sizeRange": [0.32, 0.58],
  "scan.wild.clumping": 72,
  "scan.white.enabled": true,
  "scan.white.count": 10,
  "scan.yellow.enabled": true,
  "scan.yellow.count": 14,
  "scan.rocks.enabled": true,
  "scan.rocks.count": 9,
  "scan.boulder.enabled": false
}
```

Also replace the Tall and Lawn `bladeGradient` values with three-stop linear gradients:

```json
{
  "appearance.bladeGradient": {
    "angle": 90,
    "gradientType": "linear",
    "stops": [
      {"color": "#13351F", "opacity": 100, "position": "12%"},
      {"color": "#6F9635", "opacity": 100, "position": "66%"},
      {"color": "#F1EFA0", "opacity": 100, "position": "96%"}
    ]
  },
  "lawn.bladeGradient": {
    "angle": 90,
    "gradientType": "linear",
    "stops": [
      {"color": "#102E20", "opacity": 100, "position": "14%"},
      {"color": "#47762E", "opacity": 100, "position": "67%"},
      {"color": "#A7C45A", "opacity": 100, "position": "94%"}
    ]
  }
}
```

Use `apply_patch` to add the complete transformed JSON. Do not overwrite the source export.

- [ ] **Step 3: Validate the new preset and exact critical targets**

Run:

```bash
jq -e '
  .appId == "grass-studio" and
  .values["preview.bladeCount"] == 6000 and
  .values["preview.lawnBladeCount"] == 12000 and
  .values["environment.visible"] == false and
  .values["environment.fillStrength"] == 23 and
  .values["environment.sceneContrast"] == 158 and
  .values["field.densityMax"] == 20000 and
  .values["lawn.densityMax"] == 30000 and
  .values["scan.boulder.enabled"] == false
' /Users/kusnizza/Downloads/grass-studio-reference-lighting-settings.json
```

Expected: `true` and exit code `0`.

### Task 2: Import and inspect the scene in the real app

**Files:**
- Read/import: `/Users/kusnizza/Downloads/grass-studio-reference-lighting-settings.json`
- Capture: `/Users/kusnizza/Projects/toolcraft-apps/grass/reference-lighting-scene-pass-1.png`

- [ ] **Step 1: Reuse or start the Grass Studio server**

Run:

```bash
npm run dev
```

Expected: the protected launcher reports the existing Grass Studio URL or starts the app on its saved port and confirms the Toolcraft server identity.

- [ ] **Step 2: Import through the visible settings action**

Open the verified local URL, use the app's settings import control, select `/Users/kusnizza/Downloads/grass-studio-reference-lighting-settings.json`, and wait until the WebGL canvas reports the imported values in its settings signature.

Expected critical state:

```json
{
  "preview": {"bladeCount": 6000, "lawnBladeCount": 12000},
  "environment": {
    "visible": false,
    "fillStrength": 0.23,
    "keyStrength": 1.72,
    "rimStrength": 0.72,
    "sceneContrast": 1.58,
    "sceneSaturation": 1.04
  },
  "field": {"densityMax": 20000},
  "lawn": {"densityMax": 30000},
  "wind": {"profile": "off"}
}
```

- [ ] **Step 3: Capture and evaluate pass 1**

Pause playback, wait for HDRI/scans to finish loading, capture the product canvas, and check:

- pure black background;
- strongest rim light on the upper/rear crown rather than uniform front light;
- deep but readable central trough;
- Tall tips pale yellow-green without broad white clipping;
- Lawn darker than Tall Grass;
- foreground materially darker than the upper crown;
- no isolated giant boulder and only sparse rocks/flowers;
- no WebGL/shader console errors.

Expected: save `/Users/kusnizza/Projects/toolcraft-apps/grass/reference-lighting-scene-pass-1.png` and record which of the checks require adjustment.

### Task 3: Refine lighting before color and density

**Files:**
- Modify: `/Users/kusnizza/Downloads/grass-studio-reference-lighting-settings.json`
- Capture: `/Users/kusnizza/Projects/toolcraft-apps/grass/reference-lighting-scene-final.png`

- [ ] **Step 1: Correct direction and key/fill balance**

Adjust only these targets first: `environment.rotationX`, `environment.rotation`, `environment.rotationZ`, `environment.intensity`, `environment.keyStrength`, `environment.fillStrength`, `environment.rimStrength`, and `environment.exposure`.

Use these bounded decisions:

- if the front plane is brighter than the crown, rotate the environment in `8–15°` increments before changing colors;
- if the trough is black with no green detail, increase Fill in `3–5` point steps, never above `35`;
- if the whole field glows uniformly, decrease Fill before decreasing Key;
- if tips clip broadly, reduce Exposure in `4–6` point steps before reducing Key;
- if the right silhouette merges into black, raise Rim in `5–8` point steps, never above `95`.

Expected: the light hierarchy matches the reference before material colors are refined.

- [ ] **Step 2: Correct tonal separation and local illumination**

Adjust `sceneContrast`, `sceneSaturation`, `highlightWarmth`, `shadowCoolness`, and the six sun-patch values. Keep one broad patch: `sunPatchScale >= 3`, `sunPatchSoftness >= 45`, and `sunPatchCoverage` between `35` and `55`.

Expected: upper crowns carry concentrated warm light, lower foreground stays dark, and the scene does not break into many small artificial light spots.

- [ ] **Step 3: Correct vegetation color and silhouette**

Only after light is stable, adjust Tall/Lawn gradients, three instance colors, saturation/contrast, Tall thickness/height, and scan counts. Preserve:

- `preview.bladeCount = 6000`;
- `preview.lawnBladeCount = 12000`;
- `field.densityMax = 20000`;
- `lawn.densityMax = 30000`;
- Tall thickness between `0.025` and `0.045`;
- Tall maximum height between `0.8m` and `1.0m`;
- Lawn maximum height between `0.09m` and `0.13m`.

Expected: the scene reads as dense moss plus long hair-like grass, not uniformly wide neon blades.

- [ ] **Step 4: Save and verify the final artifact**

Export or persist the final settings to `/Users/kusnizza/Downloads/grass-studio-reference-lighting-settings.json`, validate it with `jq`, reload it once through the real import flow, and capture `/Users/kusnizza/Projects/toolcraft-apps/grass/reference-lighting-scene-final.png`.

Expected: reload restoration is pixel-stable, the reference hierarchy remains visible, and the console has no WebGL/shader errors.

### Task 4: Record delivery evidence

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Add the coherent delivery entry**

Record the request, static reference path, measured reference observations, selected existing-settings approach, exact preset path, rejected default/renderer changes, state-to-output mapping, browser screenshots, JSON/import verification, skipped performance/delivery checks, and fixed Tall placement-mask limitation.

- [ ] **Step 2: Confirm no product source changed**

Run:

```bash
find src/app -type f -newer docs/superpowers/specs/2026-07-21-reference-lighting-scene-settings-design.md -print
```

Expected: no product implementation file was modified by this settings-only batch.

- [ ] **Step 3: Final handoff**

Provide clickable links to the final preset, final screenshot, design, and implementation plan. Report the exact light interpretation and any fidelity limit caused by the current fixed distribution/preview architecture.
