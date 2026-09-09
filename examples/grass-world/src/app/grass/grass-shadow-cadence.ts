const LIVE_SHADOW_INTERVAL_MS = 50;

export type GrassRenderPurpose = "export" | "interactive-preview";

export class GrassShadowCadence {
  private lastAt = Number.NEGATIVE_INFINITY;
  private lastDeformationKey = "";
  private lastStaticKey = "";
  lastUpdated = false;

  shouldUpdate(
    input: Readonly<{
      deformationKey: string;
      now: number;
      purpose: GrassRenderPurpose;
      staticKey: string;
    }>,
  ): boolean {
    const staticChanged = input.staticKey !== this.lastStaticKey;
    const deformationChanged = input.deformationKey !== this.lastDeformationKey;
    const due =
      input.purpose === "export" ||
      staticChanged ||
      (deformationChanged &&
        input.now - this.lastAt >= LIVE_SHADOW_INTERVAL_MS);
    this.lastUpdated = due;
    if (due) {
      this.lastAt = input.now;
      this.lastStaticKey = input.staticKey;
      this.lastDeformationKey = input.deformationKey;
    }
    return due;
  }
}
