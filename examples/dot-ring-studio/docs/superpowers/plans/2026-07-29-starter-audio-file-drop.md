# Starter Audio FileDrop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Dot Ring Studio's custom music uploader with the built-in Toolcraft `fileDrop` presentation and media lifecycle used by the current starter.

**Architecture:** Declare audio import in the product schema and let the signed runtime own file selection, drag-and-drop, status, file-row presentation, removal, persistence, and reset. Keep the existing audio decoder and renderer consuming `state.mediaAssets`, remove the product-owned control renderer, and migrate acceptance/browser coverage to standard `fileDrop` semantics.

**Tech Stack:** TypeScript, React 19, Toolcraft runtime schema and source-asset coordinator, Vitest, Playwright.

---

## File Map

- Modify `src/app/app-schema.test.ts`: add a focused contract test that requires the starter `fileDrop` schema and no custom control renderer.
- Modify `src/app/app-schema.ts`: replace the `audioSource` custom control declaration with an audio-only built-in `fileDrop`.
- Modify `src/app/app-composition.tsx`: remove the custom audio-control renderer registration.
- Delete `src/app/audio-source-control.tsx`: remove duplicated upload, status, drag/drop, and deletion UI.
- Modify `src/app/app-acceptance-data.ts`: declare built-in media lifecycle coverage and update overall requested behavior.
- Modify `src/app/app-verification-impact.json`: remove the deleted production owner and assign `audio.source` to the composition owner.
- Modify `e2e/app-controls.spec.ts`: observe the built-in file row and remove the uploaded track through its standard row action.
- Modify `e2e/dot-ring-browser-support.ts`: locate `audio.source` by runtime target and assert the standard file-row filename.
- Modify `e2e/app-performance-path-adapters.ts`: replace the custom mode-marker assertion with a standard file-row assertion.
- Modify `docs/toolcraft/agent-worklog.md`: record the starter source, built-in-control decision, unchanged renderer mapping, verification tier, and delivery narrative.

### Task 1: Lock The Built-In Audio Control Contract

**Files:**

- Modify: `src/app/app-schema.test.ts`
- Test: `src/app/app-schema.test.ts`

- [ ] **Step 1: Add the failing schema/composition test**

Add this test inside `describe("Dot Ring Studio schema", ...)`:

```ts
it("uses the starter fileDrop for source audio", () => {
  const audioControl = appSchema.panels.controls?.sections
    .flatMap((section) => Object.values(section.controls))
    .find((control) => control.target === "audio.source");

  expect(audioControl).toMatchObject({
    accept: "audio/*,.aac,.aif,.aiff,.flac,.m4a,.mp3,.ogg,.wav,.webm",
    assetKind: "file",
    defaultValue: null,
    multiple: false,
    type: "fileDrop",
  });
  expect(appComposition.controlRenderers).toBeUndefined();
});
```

- [ ] **Step 2: Run the focused test and confirm the old custom control fails it**

Run:

```bash
pnpm exec vitest run src/app/app-schema.test.ts
```

Expected: FAIL because `audio.source` still has `type: "audioSource"` and `appComposition.controlRenderers` is still defined.

- [ ] **Step 3: Record the no-git checkpoint**

This standalone app directory is not a git repository. Do not attempt a commit; keep the test failure as the implementation checkpoint.

### Task 2: Replace The Custom Uploader With Schema FileDrop

**Files:**

- Modify: `src/app/app-schema.ts`
- Modify: `src/app/app-composition.tsx`
- Delete: `src/app/audio-source-control.tsx`
- Test: `src/app/app-schema.test.ts`

- [ ] **Step 1: Replace the `audioSource` schema body**

Use the built-in control while retaining the existing target, label, description, and performance ownership:

```ts
audioSource: {
  accept: "audio/*,.aac,.aif,.aiff,.flac,.m4a,.mp3,.ogg,.wav,.webm",
  assetKind: "file",
  defaultValue: null,
  description:
    "Uses the bundled MP3 analysis by default; upload audio to drive the waveform from another track.",
  label: "Audio",
  multiple: false,
  orderRole: "input",
  performanceReason:
    "Importing audio can decode and analyze source media before preview reuses the cached profile.",
  performanceRole: "responsiveness",
  target: "audio.source",
  type: "fileDrop",
},
```

Do not add `media.defaultAssets`: the product has a bundled analysis profile, not an authored default audio file resource.

- [ ] **Step 2: Remove the custom renderer from composition**

Delete:

```ts
import { dotRingControlRenderers } from "./audio-source-control";
```

and remove:

```ts
controlRenderers: dotRingControlRenderers,
```

The remaining composition continues to provide the product renderer, model presentation, export handler, runtime media suppression, renderer pipeline, scene bounds, and schema.

- [ ] **Step 3: Delete the duplicated custom control module**

Delete `src/app/audio-source-control.tsx`. Its file validation, source-asset coordination, drag state, status copy, and remove button are now owned by schema `fileDrop` and the signed runtime.

- [ ] **Step 4: Run the focused test**

Run:

```bash
pnpm exec vitest run src/app/app-schema.test.ts
```

Expected: the new starter `fileDrop` test passes; acceptance validation may still fail until Task 3 updates the row from custom-control to media-lifecycle coverage.

### Task 3: Migrate Acceptance, Persistence, And Verification Ownership

**Files:**

- Modify: `src/app/app-acceptance-data.ts`
- Modify: `src/app/app-verification-impact.json`
- Test: `src/app/app-schema.test.ts`
- Test: `src/app/app-acceptance.media-upload.test.ts`

- [ ] **Step 1: Allow `controlAcceptance` to receive media lifecycle coverage**

Add this property to the helper argument type:

```ts
mediaLifecycleCoverage?: ToolcraftComponentAcceptance["mediaLifecycleCoverage"];
```

- [ ] **Step 2: Replace the custom-control acceptance row**

Replace the `audio.source` entry with:

```ts
controlAcceptance({
  componentType: "fileDrop",
  evidence: "media-lifecycle",
  expectedObservable:
    "Uploading audio changes the waveform source; removing or resetting it restores the bundled profile.",
  id: "audio.source",
  interactionId: "source-audio-authoring",
  mediaLifecycleCoverage: ["upload", "remove", "reset"],
  userAction:
    "Upload a WAV file, inspect the attached file and ring, remove it, then verify Reset returns to the bundled profile.",
}),
```

Remove `builtInFitCheck` and `customControlCoverage` from this row because the control is no longer custom.

- [ ] **Step 3: Keep product readiness aligned with the new request**

Extend `appProductReadiness.requestedBehavior` so the overall product contract explicitly includes using the current starter file uploader for source audio without removing the existing Infinity canvas requirement:

```ts
requestedBehavior:
  "Preserve the existing audio-reactive Dot Ring Studio, use the current Toolcraft starter FileDrop for source audio, and keep the starter Infinity canvas with finite-size restoration, viewport background, pan/zoom, and scene-bounded PNG/video export.",
```

- [ ] **Step 4: Align persistence acceptance with the media capability**

Because schema `fileDrop` enables the runtime media capability, add `"media"` to the declared `runtime.persistence.reload` slices and state that attached audio media restores after reload:

```ts
expectedObservable:
  "Values, canvas mode/size/viewport, panels, timeline, and attached audio media restore after a real reload.",
persistenceSlices: ["values", "canvas", "panels", "timeline", "media"],
```

- [ ] **Step 5: Update impact ownership**

In `src/app/app-verification-impact.json`:

- remove the entire owner whose path is `src/app/audio-source-control.tsx`;
- add `"audio.source"` to the functional `acceptanceIds` for `src/app/app-composition.tsx`;
- keep `audio.source` on `src/app/app-schema.ts` and the existing audio-analysis/renderer production owners.

Do not add E2E files to the production-module inventory.

- [ ] **Step 6: Run focused contract tests**

Run:

```bash
pnpm exec vitest run src/app/app-schema.test.ts src/app/app-acceptance.media-upload.test.ts
```

Expected: PASS, including `validateToolcraftAcceptanceCoverage(...)` with `fileDrop` upload/remove/reset coverage.

- [ ] **Step 7: Record the no-git checkpoint**

Do not commit because this workspace has no `.git` directory.

### Task 4: Migrate Browser And Performance-Adapter Selectors

**Files:**

- Modify: `e2e/app-controls.spec.ts`
- Modify: `e2e/dot-ring-browser-support.ts`
- Modify: `e2e/app-performance-path-adapters.ts`
- Test: `e2e/app-controls.spec.ts`

- [ ] **Step 1: Read the filename from the built-in file row**

In `e2e/app-controls.spec.ts`, replace the custom source-name query inside `observeAudio` with:

```ts
const sourceName =
  root
    .querySelector<HTMLElement>(
      '[data-toolcraft-control-target="audio.source"] [data-slot="file-upload-file-item"] span[title]',
    )
    ?.getAttribute("title")
    ?.trim() ?? "";
```

Keep the rendered `data-frame-signature` as the output signature.

- [ ] **Step 2: Remove the attached audio through the standard action**

After the upload assertion, replace the custom button lookup with:

```ts
await control
  .getByRole("button", { name: "Remove audio-pulse.wav" })
  .click();
```

Keep the existing assertion that the product renderer returns to `Minimal Electro Bass Pulse`, then re-upload through `session.controlAction(...)` so protected media-lifecycle evidence remains attached.

- [ ] **Step 3: Update the shared audio upload helper**

In `uploadAudioFixture`, select the control by runtime target:

```ts
const field = page.locator(
  '[data-toolcraft-control-target="audio.source"]',
);
```

After setting the file, assert the built-in attachment:

```ts
await expect(field.getByTitle("audio-pulse.wav")).toBeVisible();
```

Keep the rendered canvas source assertion and animation-frame wait.

- [ ] **Step 4: Update the media-import performance adapter**

After importing the phase-specific file, replace the custom mode assertion with:

```ts
await expect(field.getByTitle(sourceName)).toBeVisible();
```

Keep the output source-name assertion and two-frame wait. This changes only the setup assertion; it does not broaden or authorize performance verification.

- [ ] **Step 5: Run the focused browser lifecycle**

Run:

```bash
pnpm exec playwright test e2e/app-controls.spec.ts --grep "browser: source audio drives rendered waveform"
```

Expected: PASS. The empty state uses the starter upload card, upload renders one paperclip file row, the row remove action restores the bundled profile, and re-upload produces media-lifecycle evidence.

### Task 5: Record The Decision And Run Targeted Development Checks

**Files:**

- Modify: `docs/toolcraft/agent-worklog.md`
- Test: product source and focused browser coverage

- [ ] **Step 1: Update the Controls decision**

State that Source Audio now uses the built-in `fileDrop` with `assetKind: "file"` and an audio-only accept list; runtime owns attached-file presentation, import, remove, reset, and persistence.

- [ ] **Step 2: Add one Decision Trail entry**

Record:

- request: `возьми загрузку файла из текущего стартера, там загрузка файлов по дизайну реализована по другому, я про файл с музыкой`;
- task type: ordinary Tier 3 media-upload delivery;
- current starter and signed runtime source checked;
- `core/control-selection.md`, `core/layout.md`, `core/setup-export.md`, `core/media-upload.md`, schema/component/acceptance contracts;
- selected built-in `fileDrop`, rejected custom restyling and copied UI;
- panel ownership unchanged;
- `state.mediaAssets` to audio decoder to renderer/output mapping;
- one bare delivery verification narrative;
- risk that the empty attachment state does not show the bundled profile name.

- [ ] **Step 3: Run targeted source checks**

Run:

```bash
pnpm ai:check
pnpm typecheck
pnpm exec vitest run src/app/app-schema.test.ts src/app/app-acceptance.media-upload.test.ts
```

Expected: all commands pass; the code-health inventory no longer requires `src/app/audio-source-control.tsx`.

### Task 6: Verify The Coherent Delivery And Start The App

**Files:**

- Verify all changed files through the protected delivery lifecycle.

- [ ] **Step 1: Read the Verification-phase contract documents**

Immediately before proof, read `docs/toolcraft/acceptance-testing.md` in full. Do not run `npm run verify:perf`; the user did not request a full audit or report a performance complaint.

- [ ] **Step 2: Run the one protected delivery gate**

Run:

```bash
npm run verify:delivery
```

Expected: PASS with the lifecycle-selected protected receipt and ownership-derived audio media acceptance.

- [ ] **Step 3: Start or reuse the verified local app**

Run:

```bash
npm run dev
```

Expected: the starter script reports the verified URL for this app, reusing its saved port if already running and never stopping unrelated servers.

- [ ] **Step 4: Inspect the real UI with the browser workflow**

Open the reported app URL and verify:

- `Source Audio` shows the starter empty upload card;
- choosing `e2e/fixtures/audio-pulse.wav` shows a compact paperclip row with `audio-pulse.wav` and a row remove button;
- the canvas `data-audio-source` becomes `audio-pulse.wav`;
- removing the row restores the empty upload card and `Minimal Electro Bass Pulse`;
- the rest of the controls panel and animated ring remain visually unchanged.

- [ ] **Step 5: Deliver the result**

Report the changed behavior, focused checks, protected delivery result, and local app URL. Do not claim a full performance audit.
