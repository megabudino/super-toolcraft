import { describe, expect, it, vi } from "vitest";
import { defineToolcraft } from "@/toolcraft/runtime/schema/define-toolcraft";
import { createToolcraftState } from "@/toolcraft/runtime/state/create-template-state";
import { toolcraftReducer } from "@/toolcraft/runtime/state/reducer";
import type { ToolcraftCommand, ToolcraftFileAsset } from "@/toolcraft/runtime/state/types";
import { createToolcraftDataUrlResourceRef } from "@/toolcraft/runtime/source-assets/media-resource-ref";
import { createMemoryToolcraftBinaryAssetRepository } from "@/toolcraft/runtime/source-assets/repository/memory-binary-asset-repository";
import { createToolcraftSourceAssetBinaryMediaHydrator } from "@/toolcraft/runtime/source-assets/source-asset-binary-media-hydrator";

// Regression for the exact upstream hydration implementation on this app's
// pinned reducer/repository APIs. No product scene or browser state is replaced.
function fixture(count = 1) {
  const dataUrl = "data:application/octet-stream;base64,AQID";
  const resourceRef = createToolcraftDataUrlResourceRef("file", dataUrl);
  const assets: ToolcraftFileAsset[] = Array.from({ length: count }, (_, index) => ({
    assetKind: "file", fileName: `${index}.bin`, id: `asset-${index}`,
    layerId: `layer-${index}`, mimeType: "application/octet-stream",
    position: { x: 0, y: 0 }, lifecycle: "restoring", resourceRef,
  }));
  const state = createToolcraftState(defineToolcraft({ canvas: { enabled: true }, panels: {} }));
  state.mediaAssets = assets;
  const repository = createMemoryToolcraftBinaryAssetRepository();
  const originalBeginLease = repository.beginLease.bind(repository);
  const beginLease = vi.spyOn(repository, "beginLease");
  const jobs = assets.map(asset => ({ assetId: asset.id, dataUrl, kind: "file" as const, mimeType: asset.mimeType, resourceRef }));
  const cleanupManager = {
    collect: vi.fn(async () => {}), dispose: vi.fn(async () => {}), retryRollbacks: vi.fn(async () => {}),
    rollback: vi.fn(async (lease: { rollback: () => Promise<void> } | null) => { await lease?.rollback(); }),
  };
  const dispatch = vi.fn((command: ToolcraftCommand) => { Object.assign(state, toolcraftReducer(state, command)); });
  const hydrate = createToolcraftSourceAssetBinaryMediaHydrator({ cleanupManager, dispatch, getState: () => state, repository });
  return { assets, state, repository, originalBeginLease, beginLease, jobs, dispatch, hydrate };
}

describe("pinned binary-media hydration compatibility", () => {
  it("shares pending work across overlapping callers", async () => {
    const f = fixture();
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    f.beginLease.mockImplementation(async id => { await gate; return f.originalBeginLease(id); });
    const first = f.hydrate(f.jobs);
    let secondFinished = false;
    const second = f.hydrate(f.jobs).then(() => { secondFinished = true; });
    try {
      await vi.waitFor(() => expect(f.beginLease).toHaveBeenCalled());
      expect(f.beginLease).toHaveBeenCalledTimes(1);
      expect(secondFinished).toBe(false);
    } finally {
      release();
      await Promise.all([first, second]);
    }
    expect(f.dispatch).toHaveBeenCalledTimes(1);
    expect(f.state.mediaAssets[0]?.lifecycle).toBe("ready");
  });

  it("does not restart the remaining 60 defaults on ready notifications", async () => {
    const f = fixture(60);
    const update = f.dispatch.getMockImplementation()!;
    const observers: Promise<void>[] = [];
    f.dispatch.mockImplementation(command => {
      update(command);
      observers.push(f.hydrate(f.jobs));
    });
    await f.hydrate(f.jobs);
    await Promise.all(observers);
    expect(f.beginLease).toHaveBeenCalledTimes(60);
    expect(f.dispatch).toHaveBeenCalledTimes(60);
    expect(f.state.mediaAssets.every(asset => asset.lifecycle === "ready")).toBe(true);
  });

  it("shares repository restoration and allows failed-work retry and reset", async () => {
    const f = fixture();
    f.beginLease.mockRejectedValueOnce(new Error("temporary storage failure"));
    await Promise.all([f.hydrate(f.jobs), f.hydrate(f.jobs)]);
    expect(f.dispatch).toHaveBeenCalledTimes(1);
    expect(f.state.mediaAssets[0]?.lifecycle).toBe("unavailable");
    f.state.mediaAssets = f.assets;
    await f.hydrate(f.jobs);
    expect(f.state.mediaAssets[0]?.lifecycle).toBe("ready");
    f.state.mediaAssets = f.assets.map(asset => ({ ...asset }));
    f.dispatch.mockClear();
    const get = vi.spyOn(f.repository, "get");
    await Promise.all([f.hydrate([]), f.hydrate([])]);
    expect(get).toHaveBeenCalledTimes(1);
    expect(f.dispatch).toHaveBeenCalledTimes(1);
    expect(f.state.mediaAssets[0]?.lifecycle).toBe("ready");
  });
});
