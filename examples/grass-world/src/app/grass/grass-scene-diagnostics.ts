import {
  combineGrassLayoutSignatures,
  createGrassCoordinateSignature,
  type GrassCoordinateLayout,
} from "./grass-world-coverage";

export type GrassSceneRenderDiagnostics = Readonly<{
  butterflyCount: number;
  butterflyLandingBlend: number;
  butterflyTransitioning: boolean;
  calls: number;
  clumpCount: number;
  detailedLawnBlades: number;
  detailedTallBlades: number;
  equivalentLawnBlades: number;
  lightweightLawnBlades: number;
  lightweightTallBlades: number;
  shadowUpdated: boolean;
  surfaceTiltX: number;
  surfaceTiltZ: number;
  triangles: number;
  windActivation: number;
  windDirectionAngle: number;
  windPointerActive: boolean;
}>;

export class GrassLayoutSignatureRegistry {
  private readonly signatures: Record<string, string> = {};

  update(label: string, layout: GrassCoordinateLayout): void {
    this.signatures[label] = createGrassCoordinateSignature(label, layout);
  }

  toString(): string {
    return combineGrassLayoutSignatures(this.signatures);
  }
}
