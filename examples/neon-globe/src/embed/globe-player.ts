import { clampNumber, createGlobeGeometry, readGlobeSettings } from "../app/globe-model";
import { drawWebsiteGlobe, getGlobeBackingSize } from "./globe-frame";
import landingPreset from "./landing-preset.json";
import type { NeonGlobe, NeonGlobeOptions, NeonGlobeValues } from "./neon-globe";

export class GlobePlayer implements NeonGlobe {
  readonly canvas: HTMLCanvasElement;
  private readonly win: Window & typeof globalThis;
  private readonly doc: Document;
  private readonly renderScale: number;
  private readonly motion: "auto" | "still";
  private readonly reducedMotion: MediaQueryList;
  private readonly resizeObserver: ResizeObserver;
  private readonly intersectionObserver: IntersectionObserver;
  private pixelRatioQuery: MediaQueryList;
  private context: CanvasRenderingContext2D | null;
  private values: Record<string, unknown>;
  private settings;
  private geometry;
  private width = 0;
  private height = 0;
  private pixelRatio = 1;
  private elapsedMs = 0;
  private previousFrameMs: number | null = null;
  private animationFrame: number | null = null;
  private inView = false;
  private pageHidden = false;
  private paused = false;
  private destroyed = false;
  private dirty = true;

  constructor(
    private readonly container: HTMLElement,
    options: NeonGlobeOptions,
    private readonly onDestroy: () => void,
  ) {
    this.doc = container.ownerDocument;
    this.win = this.doc.defaultView as Window & typeof globalThis;
    this.renderScale = clampNumber(options.renderScale, 1, 2, 2);
    this.motion = options.motion ?? "auto";
    this.values = structuredClone({ ...landingPreset.values, ...options.values });
    this.settings = readGlobeSettings(this.values);
    this.geometry = createGlobeGeometry(this.settings);
    this.canvas = this.doc.createElement("canvas");
    this.context = this.canvas.getContext("2d");
    if (!this.context) throw new Error("Canvas 2D is unavailable.");
    this.canvas.setAttribute("aria-hidden", "true");
    Object.assign(this.canvas.style, {
      position: "absolute", inset: "0", width: "100%", height: "100%",
      display: "block", pointerEvents: "none",
    });
    this.reducedMotion = this.win.matchMedia("(prefers-reduced-motion: reduce)");
    this.pixelRatioQuery = this.createPixelRatioQuery();
    this.resizeObserver = new this.win.ResizeObserver(this.resize);
    this.intersectionObserver = new this.win.IntersectionObserver((entries) => {
      const entry = entries.find((candidate) => candidate.target === this.container);
      if (!entry) return;
      this.inView = entry.isIntersecting && entry.intersectionRatio > 0;
      this.reconcile();
    });
    this.container.append(this.canvas);
    this.resizeObserver.observe(this.container);
    this.intersectionObserver.observe(this.container);
    this.reducedMotion.addEventListener("change", this.invalidate);
    this.doc.addEventListener("visibilitychange", this.reconcile);
    this.win.addEventListener("resize", this.resize);
    this.win.addEventListener("pagehide", this.hidePage);
    this.win.addEventListener("pageshow", this.showPage);
    this.resize();
  }

  private createPixelRatioQuery(): MediaQueryList {
    const query = this.win.matchMedia(`(resolution: ${this.win.devicePixelRatio || 1}dppx)`);
    query.addEventListener("change", this.changePixelRatio);
    return query;
  }

  private changePixelRatio = (): void => {
    this.pixelRatioQuery.removeEventListener("change", this.changePixelRatio);
    this.pixelRatioQuery = this.createPixelRatioQuery();
    this.resize();
  };

  private resize = (): void => {
    if (this.destroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const backing = getGlobeBackingSize(width, height, this.win.devicePixelRatio, this.renderScale);
    if (width === this.width && height === this.height && backing.pixelRatio === this.pixelRatio) return;
    this.width = width;
    this.height = height;
    this.pixelRatio = backing.pixelRatio;
    if (this.canvas.width !== backing.width) this.canvas.width = backing.width;
    if (this.canvas.height !== backing.height) this.canvas.height = backing.height;
    this.invalidate();
  };

  private hidePage = (): void => {
    this.pageHidden = true;
    this.reconcile();
  };

  private showPage = (): void => {
    this.pageHidden = false;
    this.resize();
    this.reconcile();
  };

  private isStill(): boolean {
    return this.motion === "still" || this.reducedMotion.matches;
  }

  private canDraw(): boolean {
    return !this.destroyed && !this.doc.hidden && !this.pageHidden && this.inView &&
      this.width > 0 && this.height > 0;
  }

  private cancelFrame(): void {
    if (this.animationFrame !== null) this.win.cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.previousFrameMs = null;
  }

  private reconcile = (): void => {
    if (!this.canDraw()) {
      this.cancelFrame();
      return;
    }
    if (this.paused || this.isStill()) this.cancelFrame();
    if (this.animationFrame === null && (this.dirty || (!this.paused && !this.isStill()))) {
      this.animationFrame = this.win.requestAnimationFrame(this.render);
    }
  };

  private invalidate = (): void => {
    if (this.destroyed) return;
    this.dirty = true;
    this.reconcile();
  };

  private render = (nowMs: number): void => {
    this.animationFrame = null;
    if (!this.canDraw() || !this.context) {
      this.previousFrameMs = null;
      return;
    }
    const moving = !this.paused && !this.isStill();
    if (moving && this.previousFrameMs !== null) {
      this.elapsedMs += Math.max(0, nowMs - this.previousFrameMs);
    }
    this.previousFrameMs = moving ? nowMs : null;
    this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    drawWebsiteGlobe(this.context, this.width, this.height, this.settings,
      this.geometry, this.elapsedMs, this.isStill());
    this.dirty = false;
    this.reconcile();
  };

  update(values: NeonGlobeValues): void {
    if (this.destroyed) return;
    const nextValues = { ...this.values, ...structuredClone(values) };
    const next = readGlobeSettings(nextValues);
    if (next.latitudeCount !== this.settings.latitudeCount || next.meridianCount !== this.settings.meridianCount) {
      this.geometry = createGlobeGeometry(next);
    }
    this.values = nextValues;
    this.settings = next;
    this.invalidate();
  }

  pause(): void {
    this.paused = true;
    this.reconcile();
  }

  resume(): void {
    this.paused = false;
    this.reconcile();
  }

  restart(): void {
    this.elapsedMs = 0;
    this.previousFrameMs = null;
    this.invalidate();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.cancelFrame();
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.reducedMotion.removeEventListener("change", this.invalidate);
    this.pixelRatioQuery.removeEventListener("change", this.changePixelRatio);
    this.doc.removeEventListener("visibilitychange", this.reconcile);
    this.win.removeEventListener("resize", this.resize);
    this.win.removeEventListener("pagehide", this.hidePage);
    this.win.removeEventListener("pageshow", this.showPage);
    this.canvas.remove();
    this.canvas.width = 0;
    this.canvas.height = 0;
    this.context = null;
    this.geometry = { latitudes: [], meridians: [] };
    this.values = {};
    this.onDestroy();
  }
}
