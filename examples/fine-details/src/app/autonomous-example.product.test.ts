import { describe, expect, it, vi } from "vitest";
import { createToolcraftState } from "@/toolcraft/runtime";
import { appSchema } from "./app-schema";
import { handleFineDetailsPanelAction } from "./fine-details-panel-actions";
import { withBasePath } from "@/section/shared/config/base-path";
import { registerFineDetailsPromptFlightCommandSender } from "./fine-details-preview-website-actions";

describe("published fine-details example", () => {
  it("resets local controls/flight and ignores removed Apply commands", async () => {
    const resetFlight = vi.fn().mockResolvedValue(undefined);
    const unregister = registerFineDetailsPromptFlightCommandSender(resetFlight);
    const dispatch = vi.fn();
    const reportFeedback = vi.fn();
    const reportProgress = vi.fn();
    const context = {
      action: { label: "Reset", value: "website.reset" },
      dispatch, reportFeedback, reportProgress,
      resolveMediaResource: vi.fn(),
      state: createToolcraftState(appSchema),
    } as Parameters<typeof handleFineDetailsPanelAction>[0];
    await handleFineDetailsPanelAction(context);
    expect(dispatch.mock.calls).toEqual([[{ type: "controls.reset" }]]);
    expect(resetFlight).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ command: "reset" }));
    resetFlight.mockClear();
    dispatch.mockClear();
    await handleFineDetailsPanelAction({
      ...context, action: { label: "Removed action", value: "website.apply" },
    });
    expect(dispatch).not.toHaveBeenCalled();
    expect(reportFeedback).not.toHaveBeenCalled();
    expect(reportProgress).not.toHaveBeenCalled();
    expect(resetFlight).not.toHaveBeenCalled();
    unregister();
  });

  it("resolves all native asset categories beneath the current build base", () => {
    const base = import.meta.env.BASE_URL.replace(/\/$/u, "");
    expect(withBasePath("/images/example.jpg")).toBe(base + "/images/example.jpg");
    expect(withBasePath("/fonts/example.woff2")).toBe(base + "/fonts/example.woff2");
    expect(withBasePath("/logo-mark.svg")).toBe(base + "/logo-mark.svg");
  });
});
