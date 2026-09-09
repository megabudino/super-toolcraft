# Kinetic Circle — Product Spec

## Product goal

Create one centered procedural mosaic circle whose silhouette, inner/outer radius, radial relief, Z volume, repetition count, dot structure, palette, 3D orientation, canvas mode, and animation behavior can be authored through Toolcraft. The product stays a single compositional object while offering several visibly distinct form and genuinely volumetric motion families.

## Redesign decision

- User-approved change: replace the former three simultaneous figures with one configurable circle.
- Preserve the reference-derived concentric dot language and probabilistic radial palette.
- Move visual variety into product settings instead of fixed sibling figures.
- Use the starter `orientationGizmo` and direct object drag as one shared 3D orientation input.
- Use the starter Infinity Canvas mode for unbounded spatial editing while preserving the finite output frame.
- Keep Toolcraft playback timeline, editable output size, persistence, viewport controls, and PNG/video delivery.

## Canvas and output

- Default canvas: editable finite 1920×1080 (16:9), WebGL preview with runtime Resolution scale.
- Runtime Setup exposes `Infinity canvas`. Infinite mode removes artboard bounds and clipping, hides finite size controls, and preserves the dormant 1920×1080-or-user-edited finite size exactly for restoration.
- One centered procedural 3D relief object; no independent layers or sibling figures.
- The object stays inside the canvas at every exposed form/depth/repetition value.
- The 70px starter orientation gizmo stays fixed 16px from the canvas viewport’s left and bottom edges, does not move with pan/zoom, and is excluded from output and exports.
- Dragging a visible object pixel rotates the object; dragging the background pans the viewport. Gizmo drag, axis snap, direct object drag, reset, undo/redo, preview, PNG, and video all consume `view.orbit`.
- Preview and export consume the same geometry, 3D orientation, flat-disc shader, palette, timeline phase, and background state.

## Control Section Inventory

| Section | Product entity / workflow | Targets | Grouping reason |
| --- | --- | --- | --- |
| Variations | Whole-artwork variation shuffle | `panel.variations` | Two curated randomize commands re-roll the whole look or only the coloring so users explore varied results in one click. |
| Shape | Single circle silhouette and 3D orientation | `shape.form`, `shape.bend`, `shape.rotation`, `shape.depth`, `shape.repeats`, `view.orbit` | Form parameters define the object’s silhouette and relief; the editor-only starter orientation control writes the same pose used by direct object rotation and output. |
| Volume | Radial bounds and authored 3D volume | `volume.radiusRange`, `volume.zSpread`, `volume.zBend`, `volume.zTwist`, `volume.perspective` | The radial span defines the inner and outer boundaries; Z spread sets thickness, signed bend chooses convex or concave curvature, helical variation adds twist, and perspective defines spatial projection. |
| Dot Field | Point arrangement structure | `pattern.layout`, `pattern.density`, `pattern.dotSize`, `pattern.arms`, `pattern.arcFill`, `pattern.seed` | Layout mode (rings, sunflower, spiral arms, arcs), point count, coverage, deterministic variation, and the layout-specific arm/arc parameters define how samples are arranged; `Arms` and `Arc coverage` hide unless their layout is active. |
| Dot Style | Per-point rendering style | `style.dotShape`, `style.taper`, `style.glow` | Dot mask (disc, ring, square, diamond, streak), radial size grading, and additive neon glow define how each sample is drawn without changing the arrangement. |
| Mosaic Palette | Palette source colors | `palette.preset`, `palette.base`, `palette.bright`, `palette.cyan`, `palette.violet`, `palette.warm` | The curated preset choice and five editable custom colors define which colors the field can use; custom pickers hide for curated presets. |
| Coloring | Color distribution pattern | `palette.colorMode`, `palette.highlight`, `palette.accents` | Distribution mode (bands, gradient, sectors, spiral, depth, patches, duotone), mode-aware highlight position, and accent density define how the chosen palette spreads across the field. |
| Motion | Timeline trajectory | `motion.type`, `motion.speed`, `motion.strength`, `motion.wavelength` | Motion family (ripple, breathe, twist, orbit, flow, sweep, pulse), cycle count, planar amplitude, and spatial frequency define the principal trajectory. |
| Dynamics | Volumetric motion response | `motion.damping`, `motion.turbulence`, `motion.zMotion`, `motion.coreOpening`, `motion.ballWeight`, `motion.sparkle` | Falloff, tangential drift, independent Z travel, inner-ring opening, point inertia, and per-dot twinkle define how the trajectory occupies and reacts in 3D space. |
| Background | Output compositing | `export.includeBackground`, `appearance.background` | Include and color jointly define live preview and still/video background behavior. |
| Image Export | Still delivery | `export.image.format`, `export.image.resolution` | Format and resolution jointly configure the still output. |
| Video Export | Motion delivery | `export.video.format`, `export.video.resolution` | Format and resolution jointly configure the encoded timeline output. |

Runtime Setup also owns `canvas.infinity`, `canvas.aspectRatio`, `canvas.size.width`, `canvas.size.height`, `canvas.renderScale`, settings transfer, and the Timeline switch. Infinity is a runtime mode rather than an app-authored product section.

## Control selection

- `Form`, `Layout`, `Dot shape`, `Preset`, coloring `Mode`, and `Motion type`: built-in `select` with explicit finite options and no custom UI.
- `Randomize look` / `Randomize colors`: built-in section `actions` handled through `onPanelAction`, dispatching curated in-range `controls.setValue` steps with the palette preset last so one Undo visibly reverts.
- 3D orientation: built-in starter `orientationGizmo`; `label: false`, `keyframeable: false`, target `view.orbit`.
- `Ring radius`: built-in `rangeSlider` because users author a meaningful lower/upper radial bound together.
- `Bend`, `Depth`, `Contour angle`, `Z spread`, signed `Z bend`, `Z twist`, `Perspective`, `Density`, `Dot size`, and continuous motion/dynamics parameters: built-in `slider`.
- `Repeats`, `Seed`, spiral `Arms`, and integer loop `Speed`: built-in discrete `slider`.
- `Arc coverage`, `Taper`, `Glow`, `Highlight`, `Accents`, and `Sparkle`: built-in continuous `slider`; `Arms`/`Arc coverage` and the five custom colors use `visibleWhen` dependency cohesion.
- Palette and background: built-in `color`.
- Background inclusion: built-in `switch`.
- Export delivery: sticky built-in `panelActions`.
- Infinity Canvas: runtime-owned built-in `switch` at `canvas.infinity`.
- No app-authored custom controls, uploads, vector pads, curves editor, collections, or layers are required.

## Slider response contract

Every creative slider owns a distinct visible job. The useful range must span from a restrained state to a clearly different authored state; adjacent controls must not be aliases for one shared displacement coefficient.

| Slider | Exposed range | Independent visible response |
| --- | --- | --- |
| `Bend` | 0–100% | Nonlinear contour amplitude from circular restraint to a motion-safe 32% radial deformation. |
| `Contour angle` | 0–360° | In-plane rotation of the complete authored contour; the Circle family includes a restrained secondary asymmetry so quarter turns remain visible. |
| `Depth` | 0–100% | Simultaneously changes the center-to-edge contour profile and the physical static relief, from planar to a pronounced dome/ridge volume. |
| `Repeats` | 2–12 | Changes the number of actual contour lobes, pinches, or ridges across a broader low-to-high frequency range. |
| `Ring radius` lower | 0–100% | Opens and closes the center hole independently of the outside boundary. |
| `Ring radius` upper | 0–100% | Contracts and expands the outside boundary independently of the center hole. |
| `Z spread` | 0–160% | Scales static authored thickness from exactly flat through the balanced default to a substantially deeper but soft-limited relief. |
| `Z bend` | −100–100% | Reverses the main dome continuously from concave through neutral to convex without changing helical handedness. |
| `Z twist` | −100–100% | Applies a signed helical depth field with opposite handedness and enough turns to produce distinct saddle/spiral volumes. |
| `Perspective` | 0–100% | Moves from near-orthographic projection to a bounded close-camera foreshortening without changing orientation. |
| `Density` | 18–100 | Moves from a sparse readable ring lattice to the existing dense hard limit. |
| `Dot size` | 2–18px | Moves from fine particles to bold overlapping flat discs without changing canvas or export dimensions. |
| `Seed` | 1–24 | Selects deterministic but visibly different angular, radial, size, and palette scatter while preserving concentric structure. |
| `Speed` | 1–6 | Runs one to six complete forward cycles per timeline loop; integer values preserve the seam. |
| `Amount` | 0–100% | Controls the principal mode-aware planar displacement up to about 10% of canvas height. |
| `Frequency` | 0–100% | Traverses a broad low-to-high spatial frequency response instead of a narrow middle band. |
| `Z motion` | 0–100% | Controls independent front-to-back travel up to about 15% of canvas height. |
| `Core opening` | 0–100% | Applies an outward pulse concentrated at the inner boundary up to about 15% of canvas height. |
| `Falloff` | 0–100% | Moves from field-wide motion to a sharply core-localized energy envelope. |
| `Drift` | 0–100% | Adds its own tangential travel up to about 7.5% of canvas height rather than a nearly invisible few pixels. |
| `Ball weight` | 0–100% | Adds size-dependent phase lag, reduced response, downward gravity bias, deeper Z settling, and heavier point scale. |

The default creative state reproduces the user-provided exported preset from `kinetic-circle-settings (1).json`: Circle with Bend 26, Contour angle 249°, Depth 42, Repeats 12; radius 2–93%, Z spread 31%, Z bend −9%, Z twist 22%, Perspective 84%; Rings at Density 88, Dot size 6px, Seed 6; Disc with Taper −59% and Glow 0; Ember palette with Spiral coloring, Highlight 95%, and Accents 100%; Ripple at Speed 2, Amount 46%, Frequency 29%, Z motion 34%, Core opening 56%, Falloff 23%, Drift 25%, Ball weight 21%, and Sparkle 22%. Response curves remain intentionally nonlinear across the exposed ranges.

When several planar amplitudes are simultaneously pushed into their top range, the shader applies a smooth composition-fit envelope and a tighter perspective cap to the combined field. Individual sliders keep their full response; only the compounded extreme is scaled enough to preserve an output margin instead of clipping against the canvas.

## Shape behavior

- `Circle`: a restrained primary/secondary harmonic contour that stays closest to a circle while keeping Bend, Repeats, and Contour angle visible.
- `Flower`: outward radial lobes controlled by Bend and Repeats.
- `Pinch`: alternating inward constrictions with depth-sensitive curvature.
- `Vortex`: a radial twist whose angular warp grows through the field.
- `Bend` controls deformation amplitude.
- `Depth` controls both the center-to-edge deformation profile and a bounded physical Z relief, so 3D rotation produces visible parallax, foreshortening, and depth-sensitive point scale.
- `Repeats` controls the number of repeated contour features.
- `Contour angle` rotates the authored form in its own plane without changing the canvas, 3D orientation, or timeline.
- `Ring radius` maps its lower and upper thumbs to independent inner/outer normalized radii. The inner thumb can open a center hole; the outer thumb changes the field boundary without changing canvas size.
- `Z spread` scales the complete authored relief from flat to a deeper 160% volume.
- `Z bend` controls the signed primary dome: negative values push the center inward, zero removes the dome term, and positive values pull it outward.
- `Z twist` adds a signed helical depth wave through angle and radius, allowing convex, saddle-like, and spiral volumes.
- `Perspective` continuously moves projection from restrained/near-orthographic to strongly foreshortened without changing the saved orientation.
- `view.orbit` stores a validated camera-style orientation pose. The shader converts canvas-space Y-down geometry to right-handed world-space Y-up, derives a camera basis from the pose, and perspective-projects the animated relief into the logical output frame without reflecting the gizmo axes.
- Every form uses every visible shape parameter; no visible setting is inert.

## Motion behavior

- Toolcraft playback timeline with a seamless forward-only eight-second loop.
- `Ripple`: center-out radial wave paired with an independent travelling Z wave.
- `Breathe`: radial expansion/contraction paired with volume compression and lift.
- `Twist`: tangential oscillation paired with a helical Z displacement.
- `Orbit`: coupled radial/tangential drift whose points also orbit through depth.
- `Speed` remains an integer number of complete cycles per timeline loop so every type stitches at the seam; its useful range is broadened to one through six cycles.
- `Amount`, `Frequency`, `Falloff`, and `Drift` map to mode-aware shader uniforms and never rebuild geometry.
- `Z motion` controls the independent axial displacement shared by every motion family.
- `Core opening` applies a positive, pulsing radial force strongest at the authored inner boundary, visibly opening and closing the center without reversing the loop direction.
- `Ball weight` adds per-point inertia from the existing size variation: heavier points lag in phase, respond with less amplitude, bias downward in the local gravity direction, settle deeper in Z, and read slightly larger while preserving a deterministic seamless loop.
- Hover does not pause animation; active viewport drag/pan/wheel still coalesces non-essential preview work without changing playback state.
- Orientation-gizmo, direct-object orbit, and live creative slider drags remain responsive. At a selected 2× preview scale, these continuous gestures temporarily use a 1× interaction backing and restore the exact selected backing immediately on release; logical output size, state, still export, and video export never change.

## Infinity Canvas behavior

- `canvas.infinity` is injected by the Toolcraft runtime into Setup for editable-output apps.
- Enabling it changes `state.canvas.mode` to `infinite` through one undoable command; the dormant finite `canvas.size` is not overwritten.
- Aspect ratio, Canvas width, and Canvas height are visible only in finite mode.
- Infinite mode renders the product as a centered world-space scene element without finite clipping or border bounds; viewport pan and zoom remain active.
- When Background is included, its selected color fills the complete infinite viewport while the product renderer clears transparently, avoiding a second finite background rectangle.
- Disabling Background while Infinity is active atomically restores finite mode.
- Disabling Infinity recenters the finite artboard and restores the exact dormant finite size.
- LocalStorage restores canvas mode, pose, finite size, viewport, controls, and timeline.

## Product architecture

- Custom persistent WebGL 2 point-sprite renderer.
- CPU geometry build generates one deterministic concentric field, applies the selected form transform, and emits bounded Z relief.
- Shape, volume geometry (`radiusRange`, `zSpread`, `zTwist`), dot structure, canvas size, seed, and palette invalidate `geometry-build`.
- Signed `volume.zBend`, perspective, motion/dynamics controls, timeline phase, and `view.orbit` invalidate only `gpu-preview`.
- The built-in runtime gizmo and model-orbit hook share `view.orbit`, history grouping, reset, and persistence.
- PNG/video exports rebuild the same one-object geometry at exact output dimensions and apply the same 3D camera basis; editor-only gizmo DOM is never composited.
- LocalStorage persistence version 7 promotes the user-provided exported creative settings to the initial and Reset state. The transport snapshot time and paused state remain session-owned.
- No Layers panel because the product has one editable procedural object.
- No upload flow because the product is generative rather than source-media-driven.

## Renderer Technique Decision Matrix

| Candidate | Preview fit | Export fit | Decision |
| --- | --- | --- | --- |
| SVG / DOM | Thousands of animated point nodes create mutation pressure. | Crisp but expensive at the exposed density. | Rejected. |
| Canvas 2D | Repeats thousands of CPU arc and transform calls per frame. | Retained only for helper-owned still compositing. | Rejected for preview. |
| WebGL 2 | Stable point buffers, uniform-only motion modes, broad support. | Reuses the same geometry and shader at exact output sizes. | Selected. |
| WebGPU | More setup and narrower availability without visible benefit for this bounded field. | Adds compatibility complexity. | Rejected. |

## Renderer Layer Inventory

| Layer | Content | Primitive count | Renderer | Export |
| --- | --- | --- | --- | --- |
| Kinetic circle relief | One dense authored dot form with Z relief and perspective orientation | High | WebGL 2 | Included |
| Orientation gizmo | Runtime editor handle, axes and snap targets | Low | Canvas 2D | Excluded |
| Export composite | Standard background/alpha and encoded output | Low | Canvas 2D / MediaRecorder | Composited |

## Render Pipeline Inventory

1. `geometry-build`: one centered field between authored inner/outer radii, form transform, separate dome/ridge/helical Z components, radial metadata, and packed color; cached by canvas size, `shape.*`, `volume.radiusRange`, `volume.zSpread`, `volume.zTwist`, geometry-affecting `pattern.*`, and `palette.*`.
2. `shader-program`: compiled WebGL program and stable buffer/VAO resources; cached for renderer lifetime.
3. `orientation-basis`: validated `view.orbit` pose converted into right/up/back uniforms; gizmo and direct drag update only this pose.
4. `gpu-preview`: canvas-mode-aware background clear, signed dome composition with a smooth depth limit, adjustable perspective, independent radial/tangential/axial motion, mass response, flat antialiased point shading, and point draw; `volume.zBend`, `volume.perspective`, `motion.*`, timeline phase, `view.orbit`, and render scale invalidate only this pass. Continuous orbit and creative-slider gestures temporarily lower only the preview backing scale and guarantee a trailing full-quality frame on release.
5. `export-frame`: exact-size WebGL render with the same pose plus standard still/video composition; isolated from preview and editor handle resources.

## Animation Intent Inventory

- Mode: Toolcraft playback timeline.
- Loop duration: eight seconds, product-derived.
- Direction: forward-only and seamless; no mirror, yoyo, ping-pong, or reverse fallback.
- Transport: top Toolcraft timeline only.
- Video export: deterministic frames derived from runtime timeline time.

## Verification note

Verification tier: Tier 2

Reason: This post-first-working pass changes schema defaults, renderer fallbacks, and persistence identity without changing control ranges, renderer equations, layout, export behavior, or the copied Toolcraft runtime.

Run: No commands or browser checks for this pass, following the user's explicit instruction not to run verification.

Skip: `npm run ai:check`, typecheck, tests, build, browser checks, performance checks, and `npm install`. Dependencies and lockfile are unchanged.
