// @vitest-environment jsdom
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { HeroNativePreview } from "./hero-native-preview";

const { state, dispatch } = vi.hoisted(() => ({
  dispatch: vi.fn(),
  state: { canvas: { mode: "finite", offset: { x: 0, y: 0 }, zoom: 100 }, mediaAssets: [], values: {} },
}));
vi.mock("@/toolcraft/runtime/react", () => ({
  useToolcraftSelector: (select: (input: typeof state) => unknown) => select(state),
  useToolcraftDispatch: () => dispatch,
  useToolcraftMediaPresentationUrls: () => new Map(),
  useToolcraftProductSceneFrame: () => ({ mode: "finite", rect: { width: 1920, height: 1080 } }),
  useToolcraftPipelinePass: (_pass: unknown, _cache: unknown, run: () => void) => {
    React.useEffect(run, [run]);
    return { status: "success" };
  },
}));
vi.mock("./hero-gallery-row-activation", () => ({ useHeroGalleryRowActivation: () => undefined }));
vi.mock("./hero-native-media-sync", () => ({ HeroNativeMediaSync: () => null }));
vi.mock("@/section/reference/reference-surface", () => ({ ReferenceSurface: ({ children }: React.PropsWithChildren) => <div>{children}</div> }));
vi.mock("@/section/components/pages/home/hero-v4-styles", () => ({
  default: ({ viewportWidth, onPanChange }: { viewportWidth: number; onPanChange: (pan: { x: number; y: number }, group: string) => void }) =>
    <section data-native-hero data-width={viewportWidth} onClick={() => onPanChange({ x: .25, y: -.5 }, "native-drag")}>Recraft styles</section>,
}));

afterEach(() => vi.clearAllMocks());

it("mounts the Hero section directly and writes native gestures into runtime history", async () => {
  const host = document.createElement("div");
  const root = createRoot(host);
  await act(async () => root.render(<HeroNativePreview />));
  expect(host.querySelector("iframe")).toBeNull();
  const header = host.querySelector("[data-recraft-header]");
  expect(header).not.toBeNull();
  expect(header?.nextElementSibling).toBe(host.querySelector("[data-native-hero]"));
  expect(header?.querySelector('img[alt="Recraft"]')?.getAttribute("src")).toBe("/logo-mark.svg");
  expect(Array.from(header?.querySelectorAll("nav a") ?? []).map(link => link.textContent)).toEqual(["API", "Docs"]);
  expect(header?.querySelector('[data-recraft-studio-link]')?.textContent).toBe("Try Recraft Studio");
  expect(host.querySelector("[data-native-hero]")?.getAttribute("data-width")).toBe("1920");
  await act(async () => host.querySelector("section")?.click());
  expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
    type: "controls.setValue", target: "sphere.pan", value: { x: .25, y: -.5 }, historyGroup: "native-drag",
  }));
  await act(async () => root.unmount());
});
