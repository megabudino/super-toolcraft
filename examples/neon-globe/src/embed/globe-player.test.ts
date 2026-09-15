import { afterEach, describe, expect, it, vi } from "vitest";
import { GLOBE_TARGETS } from "../app/globe-constants";
import { readGlobeSettings } from "../app/globe-model";
import { drawWebsiteGlobe } from "./globe-frame";
import { createBrowserFixture } from "./globe-player.test-support";
import landingPreset from "./landing-preset.json";
import { createNeonGlobe, type NeonGlobe, type NeonGlobeOptions } from "./neon-globe";

vi.mock("./globe-frame", async (importOriginal) => ({
  ...await importOriginal<typeof import("./globe-frame")>(),
  drawWebsiteGlobe: vi.fn(),
}));

const players: NeonGlobe[] = [];
const draw = vi.mocked(drawWebsiteGlobe);

function mount(fixture: ReturnType<typeof createBrowserFixture>, options?: NeonGlobeOptions) {
  const host = fixture.host();
  const player = createNeonGlobe(host, options);
  players.push(player);
  fixture.show(host);
  return { player, host };
}

afterEach(() => {
  for (const player of players.splice(0)) player.destroy();
  vi.clearAllMocks();
});

describe("website globe lifecycle", () => {
  it("starts with the exact composition supplied in the editor settings export", () => {
    const fixture = createBrowserFixture();
    mount(fixture);
    fixture.frame(0);
    const settings = draw.mock.lastCall?.[3];
    expect(settings).toEqual(readGlobeSettings(landingPreset.values));
    expect(settings?.logos.map(({ logoId, position, scale }) => [logoId, position, scale])).toEqual([
      ["dxc", 60, 114], ["meta", 71, 121], ["prada", 76, 100], ["zillow", 68, 108],
    ]);
  });

  it("allows one preset value to be overridden without losing the saved pose or other scales", () => {
    const fixture = createBrowserFixture();
    const { player } = mount(fixture, { values: { [GLOBE_TARGETS.logoDxcScale]: 90 } });
    fixture.frame(0);
    expect(draw.mock.lastCall?.[3].logos[0].scale).toBe(90);
    expect(draw.mock.lastCall?.[3].logos[1].scale).toBe(121);
    expect(draw.mock.lastCall?.[3].orientation).toEqual(landingPreset.values["globe.orientation"]);
    player.update({ [GLOBE_TARGETS.logoHoldSeconds]: 4 });
    fixture.frame(16);
    expect(draw.mock.lastCall?.[3].logos[0].scale).toBe(90);
    expect(draw.mock.lastCall?.[3].orientation).toEqual(landingPreset.values["globe.orientation"]);
  });

  it("imports without a DOM and rejects invalid mounts/options", () => {
    expect(typeof window).toBe("undefined");
    expect(() => createNeonGlobe(null as unknown as HTMLElement)).toThrow("browser HTMLElement");
    const fixture = createBrowserFixture();
    expect(() => createNeonGlobe(fixture.host(), { motion: "invalid" as "auto" })).toThrow("motion");
    expect(fixture.canvases).toHaveLength(0);
  });

  it("renders full DPR times resolution scale, without a quality cap", () => {
    const fixture = createBrowserFixture({ dpr: 3 });
    const { player } = mount(fixture);
    expect([player.canvas.width, player.canvas.height]).toEqual([3840, 2160]);
    fixture.frame(100);
    expect(fixture.canvases[0].context.setTransform).toHaveBeenCalledWith(6, 0, 0, 6, 0, 0);
    expect(draw.mock.lastCall?.slice(1, 3)).toEqual([640, 360]);
    expect(fixture.canvases[0].setAttribute).toHaveBeenCalledWith("aria-hidden", "true");
    expect(fixture.canvases[0].style).toMatchObject({ pointerEvents: "none" });
  });

  it.each([[0, 1], [3, 2], [NaN, 2], [1.5, 1.5]])("validates resolution scale %s", (input, scale) => {
    const fixture = createBrowserFixture();
    const { player } = mount(fixture, { renderScale: input });
    expect(player.canvas.width).toBe(640 * scale);
  });

  it("does not draw until visible or while offscreen; resumes without fast-forwarding", () => {
    const fixture = createBrowserFixture();
    const host = fixture.host();
    const player = createNeonGlobe(host);
    players.push(player);
    expect(fixture.frames.size).toBe(0);
    fixture.show(host);
    fixture.frame(100);
    fixture.frame(148);
    expect(draw.mock.lastCall?.[5]).toBe(48);
    fixture.show(host, false);
    expect(fixture.frames.size).toBe(0);
    fixture.show(host);
    fixture.frame(100000);
    expect(draw.mock.lastCall?.[5]).toBe(48);
    fixture.frame(100016);
    expect(draw.mock.lastCall?.[5]).toBe(64);
  });

  it("preserves phase and manual pause across document and page visibility changes", () => {
    const fixture = createBrowserFixture();
    const { player } = mount(fixture);
    fixture.frame(100);
    fixture.frame(120);
    fixture.hide(true);
    expect(fixture.frames.size).toBe(0);
    fixture.hide(false);
    fixture.frame(5000);
    expect(draw.mock.lastCall?.[5]).toBe(20);
    fixture.win.emit("pagehide");
    expect(fixture.frames.size).toBe(0);
    fixture.win.emit("pageshow");
    fixture.frame(10000);
    expect(draw.mock.lastCall?.[5]).toBe(20);
    player.pause();
    fixture.hide(true);
    fixture.hide(false);
    fixture.win.emit("pagehide");
    fixture.win.emit("pageshow");
    expect(fixture.frames.size).toBe(0);
    player.resume();
    fixture.frame(20000);
    fixture.frame(20016);
    expect(draw.mock.lastCall?.[5]).toBe(36);
  });

  it("uses a single final frame for reduced motion and reacts to preference changes", () => {
    const fixture = createBrowserFixture({ reduced: true });
    const { player } = mount(fixture);
    fixture.frame(100);
    expect(draw.mock.lastCall?.[6]).toBe(true);
    expect(fixture.frames.size).toBe(0);
    player.restart();
    fixture.frame(1000);
    expect(draw.mock.lastCall?.slice(5)).toEqual([0, true]);
    expect(fixture.frames.size).toBe(0);
    fixture.reduce(false);
    fixture.frame(5000);
    fixture.frame(5016);
    expect(draw.mock.lastCall?.slice(5)).toEqual([16, false]);
    fixture.reduce(true);
    fixture.frame(5100);
    expect(draw.mock.lastCall?.slice(5)).toEqual([16, true]);
    expect(fixture.frames.size).toBe(0);
  });

  it("keeps explicit still mode static even after resume", () => {
    const fixture = createBrowserFixture();
    const { player } = mount(fixture, { motion: "still" });
    fixture.frame(0);
    player.resume();
    expect(fixture.frames.size).toBe(0);
    player.update({ [GLOBE_TARGETS.lineWidth]: 2 });
    fixture.frame(20);
    expect(draw.mock.lastCall?.[3].lineWidth).toBe(2);
    expect(draw.mock.lastCall?.[6]).toBe(true);
    expect(fixture.frames.size).toBe(0);
  });

  it("handles zero-sized hosts, resizing, and screen DPR changes", () => {
    const fixture = createBrowserFixture();
    const host = fixture.host(0, 0);
    const player = createNeonGlobe(host, { motion: "still" });
    players.push(player);
    fixture.show(host);
    expect(fixture.frames.size).toBe(0);
    fixture.resize(host, 390, 844);
    fixture.frame(0);
    expect([player.canvas.width, player.canvas.height]).toEqual([780, 1688]);
    const oldQuery = fixture.queries.find((query) => query.media.includes("resolution"))!;
    fixture.win.devicePixelRatio = 3;
    oldQuery.change(false);
    fixture.frame(16);
    expect([player.canvas.width, player.canvas.height]).toEqual([2340, 5064]);
    expect(oldQuery.listenerCount).toBe(0);
    expect(fixture.queries.at(-1)?.media).toBe("(resolution: 3dppx)");
    expect(fixture.frames.size).toBe(0);
  });

  it("clones updates, validates settings, and only rebuilds grid geometry when needed", () => {
    const fixture = createBrowserFixture();
    const orientation = { position: [1, 2, 5], up: [0, 1, 0] };
    const { player } = mount(fixture, { values: { [GLOBE_TARGETS.orientation]: orientation } });
    orientation.position[0] = 90;
    fixture.frame(0);
    const geometry = draw.mock.lastCall?.[4];
    expect(draw.mock.lastCall?.[3].orientation.position[0]).toBe(1);
    player.pause();
    player.update({ [GLOBE_TARGETS.lineWidth]: 999, [GLOBE_TARGETS.band1Width]: 50 });
    fixture.frame(16);
    expect(draw.mock.lastCall?.[3].lineWidth).toBe(8);
    expect(draw.mock.lastCall?.[4]).toBe(geometry);
    expect(fixture.frames.size).toBe(0);
    player.update({ [GLOBE_TARGETS.latitudeCount]: 20 });
    fixture.frame(32);
    expect(draw.mock.lastCall?.[4]).not.toBe(geometry);
  });

  it("owns each mount once and releases all observers, listeners, frames, and backing pixels", () => {
    const fixture = createBrowserFixture();
    const { player, host } = mount(fixture);
    expect(() => createNeonGlobe(host)).toThrow("already has a globe");
    fixture.frame(0);
    player.destroy();
    player.destroy();
    player.update({ [GLOBE_TARGETS.logoSpeed]: 1 });
    player.restart();
    player.resume();
    expect(fixture.frames.size).toBe(0);
    expect(fixture.doc.listenerCount + fixture.win.listenerCount).toBe(0);
    expect(fixture.queries.every((query) => query.listenerCount === 0)).toBe(true);
    expect(fixture.resizeObservers[0].disconnect).toHaveBeenCalledTimes(1);
    expect(fixture.intersectionObservers[0].disconnect).toHaveBeenCalledTimes(1);
    expect(fixture.canvases[0].remove).toHaveBeenCalledTimes(1);
    expect([player.canvas.width, player.canvas.height]).toEqual([0, 0]);
    const replacement = createNeonGlobe(host);
    players.push(replacement);
    expect(replacement.canvas).not.toBe(player.canvas);
  });

  it("keeps clocks and controls independent across multiple instances", () => {
    const fixture = createBrowserFixture();
    const a = mount(fixture).player;
    const b = mount(fixture).player;
    fixture.frame(100);
    fixture.frame(140);
    a.pause();
    fixture.frame(180);
    expect(draw.mock.lastCall?.[0]).toBe(fixture.canvases[1].context);
    expect(draw.mock.lastCall?.[5]).toBe(80);
    b.restart();
    fixture.frame(200);
    expect(draw.mock.lastCall?.[5]).toBe(0);
    a.resume();
    fixture.frame(220);
    const aCall = draw.mock.calls.filter((call) => Object.is(call[0], fixture.canvases[0].context)).at(-1);
    expect(aCall?.[5]).toBe(40);
  });
});
