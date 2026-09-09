import { describe, expect, it, vi } from "vitest";
import { createToolcraftState } from "@/toolcraft/runtime";
import { appSchema } from "./app-schema";
import { handleHeroPanelAction } from "./hero-panel-actions";
import { withBasePath } from "@/section/shared/config/base-path";

describe("published hero example", () => {
  it("resets only local controls and ignores removed Apply commands", async () => {
    const dispatch = vi.fn();
    const reportFeedback = vi.fn();
    const reportProgress = vi.fn();
    const context = {
      action: { label: "Reset", value: "website.reset" },
      dispatch, reportFeedback, reportProgress,
      resolveMediaResource: vi.fn(),
      state: createToolcraftState(appSchema),
    } as Parameters<typeof handleHeroPanelAction>[0];
    await handleHeroPanelAction(context);
    expect(dispatch.mock.calls).toEqual([[{ type: "controls.reset" }]]);
    dispatch.mockClear();
    await handleHeroPanelAction({
      ...context, action: { label: "Removed action", value: "website.apply" },
    });
    expect(dispatch).not.toHaveBeenCalled();
    expect(reportFeedback).not.toHaveBeenCalled();
    expect(reportProgress).not.toHaveBeenCalled();
  });

  it("resolves all native asset categories beneath the current build base", () => {
    const base = import.meta.env.BASE_URL.replace(/\/$/u, "");
    expect(withBasePath("/images/example.jpg")).toBe(base + "/images/example.jpg");
    expect(withBasePath("/fonts/example.woff2")).toBe(base + "/fonts/example.woff2");
    expect(withBasePath("/logo-mark.svg")).toBe(base + "/logo-mark.svg");
  });
});
