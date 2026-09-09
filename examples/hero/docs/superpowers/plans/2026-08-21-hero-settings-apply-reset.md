# Hero Settings Apply And Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist Toolcraft hero settings into a tracked website JSON file through `Apply`, update neighboring local website tabs immediately, and provide adjacent sticky Reset plus header Reset paths that restore both products to shared defaults.

**Architecture:** Extend the versioned iframe protocol with request-scoped save messages. Adjacent sticky Reset and Apply actions send defaults or current values through the iframe; the website validates them in a development-only Route Handler, atomically rewrites one JSON source file, and broadcasts the committed settings to sibling tabs. Sticky Reset suppresses its matching reset-history observation, while header Reset continues through that observer.

**Tech Stack:** React, TypeScript, Toolcraft schema/onPanelAction/runtime commands, `postMessage`, BroadcastChannel, Next.js 16 Route Handlers, Zod, Node.js filesystem APIs, JSON source imports

---

### Task 1: Extend the Toolcraft protocol and action schema

**Files:**
- Modify: `recraft-tools/hero/src/app/hero-preview-protocol.ts`
- Modify: `recraft-tools/hero/src/app/app-schema.ts`

- [ ] **Step 1: Bump the preview protocol and add save request/result types**

Set `HERO_PREVIEW_PROTOCOL_VERSION` to `9`. Add `HeroWebsiteSettingsSaveIntent = "apply" | "reset"`, a `save-settings` message carrying `requestId`, `intent`, and `HeroPreviewSettings`, and a `save-result` message carrying the request id, success flag, and optional safe message. Export message creators and strict type guards that require the existing channel/version plus a non-empty request id.

```ts
export type HeroPreviewSaveSettingsMessage = Readonly<{
  channel: typeof HERO_PREVIEW_CHANNEL;
  intent: HeroWebsiteSettingsSaveIntent;
  payload: HeroPreviewSettings;
  requestId: string;
  type: "save-settings";
  version: typeof HERO_PREVIEW_PROTOCOL_VERSION;
}>;

export type HeroPreviewSaveResultMessage = Readonly<{
  channel: typeof HERO_PREVIEW_CHANNEL;
  message?: string;
  ok: boolean;
  requestId: string;
  type: "save-result";
  version: typeof HERO_PREVIEW_PROTOCOL_VERSION;
}>;
```

- [ ] **Step 2: Add sticky Reset and Apply actions**

Append a `website-actions` schema section containing one built-in `panelActions` control. The explicit user requirement overrides the normal no-duplicate-reset product rule: outline Reset sits immediately before primary Apply, and the runtime header remains available.

```ts
{
  controls: {
    apply: {
      actions: [
        { label: "Reset", value: "website.reset", variant: "outline" },
        { label: "Apply", value: "website.apply" },
      ],
      target: "website.settings",
      type: "panelActions",
    },
  },
  id: "website-actions",
  title: "Website",
}
```

### Task 2: Bridge Toolcraft actions to the iframe

**Files:**
- Create: `recraft-tools/hero/src/app/hero-preview-website-actions.ts`
- Create: `recraft-tools/hero/src/app/hero-panel-actions.ts`
- Modify: `recraft-tools/hero/src/app/hero-preview.tsx`
- Modify: `recraft-tools/hero/src/app/app-composition.tsx`

- [ ] **Step 1: Add a focused save-handler registry**

Expose one registered iframe saver without importing runtime UI internals:

```ts
import type {
  HeroPreviewSettings,
  HeroWebsiteSettingsSaveIntent,
} from "./hero-preview-protocol";

export type HeroWebsiteSettingsSaveRequest = Readonly<{
  intent: HeroWebsiteSettingsSaveIntent;
  settings: HeroPreviewSettings;
}>;

type HeroWebsiteSettingsSaveHandler = (
  request: HeroWebsiteSettingsSaveRequest,
) => Promise<void>;

let activeSaveHandler: HeroWebsiteSettingsSaveHandler | null = null;

export function registerHeroWebsiteSettingsSaveHandler(
  handler: HeroWebsiteSettingsSaveHandler,
): () => void {
  activeSaveHandler = handler;
  return () => {
    if (activeSaveHandler === handler) activeSaveHandler = null;
  };
}

export function saveHeroWebsiteSettings(
  request: HeroWebsiteSettingsSaveRequest,
): Promise<void> {
  return activeSaveHandler
    ? activeSaveHandler(request)
    : Promise.reject(new Error("The website preview is not ready."));
}
```

- [ ] **Step 2: Implement the Reset and Apply panel-action handler**

Handle `website.apply` by deriving settings from `context.state.values`. Handle `website.reset` by marking its history write as handled, dispatching `controls.reset`, and saving `HERO_PREVIEW_DEFAULTS`. Return the real async work, report progress, and convert failures into stable panel feedback.

```ts
export const handleHeroPanelAction: ToolcraftPanelActionHandler = async ({
  action,
  dispatch,
  reportFeedback,
  reportProgress,
  state,
}) => {
  const isApply = action.value === "website.apply";
  const isReset = action.value === "website.reset";
  if (!isApply && !isReset) return;

  reportProgress(0.1);

  if (isReset) {
    markHeroWebsiteResetHandled();
    dispatch({ type: "controls.reset" });
  }

  try {
    await saveHeroWebsiteSettings({
      intent: isReset ? "reset" : "apply",
      settings: isReset
        ? HERO_PREVIEW_DEFAULTS
        : createHeroPreviewSettingsFromValues(state.values),
    });
    reportProgress(1);
  } catch {
    reportFeedback({
      code: isReset
        ? "hero-settings-reset-failed"
        : "hero-settings-apply-failed",
      message: isReset
        ? "Toolcraft was reset, but the local website could not be reset."
        : "Could not apply settings to the local website.",
    });
  }
};
```

- [ ] **Step 3: Make the iframe own request/response settlement**

In `HeroExternalPreview`, keep a readiness ref and a map of pending request ids. Register a saver that posts `save-settings`, rejects when the child is not ready, times out after ten seconds, and resolves/rejects on a validated `save-result`. Clear timeouts and reject pending requests on unmount.

Observe the runtime's tagged Controls-reset history generation after mount. When that generation advances, call the same saver with `intent: "reset"` and `HERO_PREVIEW_DEFAULTS`. Initialize the previous ref from the first render so opening Toolcraft never writes the website file; ignore generation decreases caused by Undo.

- [ ] **Step 4: Register the panel handler through the composition**

```ts
export const appComposition: ToolcraftAppComposition = {
  canvasContent: <HeroExternalPreview />,
  onPanelAction: handleHeroPanelAction,
  rendererPipelineRegistration: heroPreviewPipelineRegistration,
  sceneBoundsProvider: () => [HERO_PREVIEW_SCENE_BOUNDS],
  schema: appSchema,
};
```

### Task 3: Add the tracked website settings source and local write endpoint

**Files:**
- Create: `recraft-v4-styles/src/components/pages/home/hero-applied-settings.json`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-scene-settings.ts`
- Create: `recraft-v4-styles/src/features/hero-settings/server/update-hero-settings.ts`
- Create: `recraft-v4-styles/src/features/hero-settings/index.server.ts`
- Create: `recraft-v4-styles/src/app/api/hero-settings/route.ts`

- [ ] **Step 1: Preserve the current standalone site appearance in tracked JSON**

Create a complete JSON object matching the current website settings: background `#1F2AA2`, card gap `10`, roll `85`, safety width `883`, scale `98`, perspective `600`, current dispersion/heading/pattern/prompt values, and vanishing point `{ "x": 50, "y": 44 }`.

- [ ] **Step 2: Separate base defaults from applied settings**

Import the JSON in `hero-scene-settings.ts`. Change `defaultHeroSceneSettings` to the complete Toolcraft schema baseline (`cardGap: -24`, `cardRoll: 42`, `cardSafetyWidth: 720`, `cardScale: 100`, `perspective: 1400`, plus the exact Toolcraft dispersion, heading, pattern, prompt, background, and vanishing-point defaults). After the normalizer declaration export:

```ts
export const appliedHeroSceneSettings =
  normalizeHeroSceneSettings(appliedHeroSceneSettingsSource) ?? defaultHeroSceneSettings;
```

The default object remains the reset/fallback authority; the applied object is the standalone-site authority.

- [ ] **Step 3: Add the server-only PUT implementation**

Create a server-only feature handler that:

- permits only `NODE_ENV === "development"` with request hostname `localhost`, `127.0.0.1`, or `::1`;
- enforces a 32 KiB body bound from both `content-length` and actual text length;
- parses JSON safely;
- uses `z.unknown().transform(...)` plus `normalizeHeroSceneSettings` to produce canonical settings or a Zod issue;
- writes formatted JSON plus a final newline to a unique temporary file in the same directory;
- renames that temporary file over the fixed `hero-applied-settings.json` path;
- removes only its explicit temporary file after failure;
- returns `{ settings }` with `Cache-Control: no-store`, or stable 400/403/413/422/500 responses without filesystem details.

- [ ] **Step 4: Keep the App Router file as an adapter**

```ts
export { updateHeroSettings as PUT } from '@/features/hero-settings/index.server';

export const runtime = 'nodejs';
```

`index.server.ts` imports `server-only` and re-exports `updateHeroSettings`.

### Task 4: Apply and broadcast settings on the website

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-preview-boundary.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`

- [ ] **Step 1: Start standalone output from applied settings**

Initialize `HeroPreviewBoundary` state from `appliedHeroSceneSettings`. Make `HeroV4Styles` use the same applied value for its optional settings default while preserving `defaultHeroSceneSettings` as the reset baseline in the settings module.

- [ ] **Step 2: Upgrade the child protocol to version 9**

Keep the live `settings` guard. Add a strict `save-settings` guard for `requestId`, `intent`, and payload. On a trusted save request, normalize the payload, `PUT` it to `/api/hero-settings`, validate the returned settings with the same normalizer, update local state, broadcast the canonical result, and post a request-scoped `save-result` to the trusted parent.

- [ ] **Step 3: Synchronize neighboring tabs without durable browser state**

Create `BroadcastChannel("recraft.hero-settings")` in a separate client effect. Normalize every received value before calling `setSettings`. After a successful PUT, post the normalized result. Close the channel during cleanup. Do not read or write localStorage.

### Task 5: Align product readiness and the worklog

**Files:**
- Modify: `recraft-tools/hero/src/app/app-acceptance-data.ts`
- Modify: `recraft-tools/hero/docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Declare Apply ownership and acceptance**

Add one command ownership entry for `website.settings` with panel ownership and the canvas alternative rejected. Extend product summary/requested behavior with local Apply and shared Reset. Add a `panelActions` acceptance entry with `actionCoverage: ["website.apply"]`, `evidence: "command-side-effect"`, and an expected observable covering the tracked JSON, neighboring tab, and subsequent reset.

- [ ] **Step 2: Add the Website action inventory**

Append a `website-actions` inventory entry whose only target is `website.settings`, entity is `Website hero publication`, and grouping reason states that Apply commits the current editor configuration to the local website source.

- [ ] **Step 3: Record Delivery 17**

Record the exact user workflow, Tier 3 protocol/persistence surface, development-only source mutation, adjacent sticky Reset override plus retained header Reset, version 9 data flow, rejected browser-only storage/production backend/direct TypeScript rewrite, ordinary-product-work performance intent, skipped verification boundary, and writable-checkout risk. Update high-level Renderer, Interaction Ownership, Controls, and Verification decisions.

### Task 6: Review without validation or publication

**Files:**
- Review only: all files listed above
- Preserve: pre-existing sphere-gallery docs and viewport-anchor edits

- [ ] **Step 1: Inspect the scoped diff and status**

Run `git diff` only for the implementation, feature spec/plan, readiness, and worklog files, then run `git status --short`. Confirm the earlier sphere-gallery and viewport-anchor changes remain present and unmodified by this feature.

- [ ] **Step 2: Stop without checks, commit, or push**

Per the user's standing instruction, do not run tests, browser checks, lint, typecheck, formatting, build, delivery, or `git diff --check`. Do not commit or push; the user will test locally and publish later.
