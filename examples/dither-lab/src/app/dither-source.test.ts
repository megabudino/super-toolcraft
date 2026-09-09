import { describe, expect, it } from "vitest";

import { createToolcraftState, toolcraftReducer } from "@/toolcraft/runtime";
import { appSchema } from "./app-schema";
import { ditherDefaultSourceMediaAsset, ditherSourceImageTarget } from "./dither-defaults";

describe("Dither source attachment", () => {
  it("starts with the bundled file attached without creating an undo action", () => {
    const state = createToolcraftState(appSchema);
    expect(state.mediaAssets).toEqual([ditherDefaultSourceMediaAsset]);
    expect(state.history.undo).toEqual([]);
    expect(state.values[ditherSourceImageTarget]).toEqual([]);
  });

  it("removes the default and supports undo, redo, and Source reset", () => {
    const initial = createToolcraftState(appSchema);
    const removed = toolcraftReducer(initial, {
      type: "media.delete", mediaId: ditherDefaultSourceMediaAsset.id,
    });
    expect(removed.mediaAssets).toEqual([]);
    const undone = toolcraftReducer(removed, { type: "history.undo" });
    expect(undone.mediaAssets).toEqual(initial.mediaAssets);
    const redone = toolcraftReducer(undone, { type: "history.redo" });
    expect(redone.mediaAssets).toEqual([]);
    const reset = toolcraftReducer(redone, {
      type: "controls.resetTargets", targets: [ditherSourceImageTarget],
    });
    expect(reset.mediaAssets).toEqual(initial.mediaAssets);
  });

  it("replaces the same attachment and restores its content on global reset", () => {
    const initial = createToolcraftState(appSchema);
    const replaced = toolcraftReducer(initial, {
      type: "media.import",
      asset: {
        ...ditherDefaultSourceMediaAsset,
        dataUrl: "data:image/svg+xml,<svg/>",
        fileName: "replacement.svg",
        mimeType: "image/svg+xml",
      },
    });
    expect(replaced.mediaAssets).toHaveLength(1);
    expect(replaced.mediaAssets[0]?.fileName).toBe("replacement.svg");
    expect(toolcraftReducer(replaced, { type: "controls.reset" }).mediaAssets)
      .toEqual(initial.mediaAssets);
  });
});
