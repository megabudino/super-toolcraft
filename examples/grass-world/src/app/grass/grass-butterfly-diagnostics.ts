import { grassButterflyTextureSizes } from "./grass-butterfly-assets";
import type { GrassSceneRenderDiagnostics } from "./grass-scene-diagnostics";
import type { GrassSettings } from "./grass-settings-types";

const textureSize = String(Math.max(...Object.values(grassButterflyTextureSizes)));
const textureSizes = JSON.stringify(grassButterflyTextureSizes);

export function publishGrassButterflyDiagnostics({
  canvas,
  diagnostics,
  host,
  layoutSignature,
  resourceSignature,
  settings,
}: Readonly<{
  canvas: HTMLCanvasElement;
  diagnostics: GrassSceneRenderDiagnostics;
  host: HTMLElement;
  layoutSignature: string;
  resourceSignature: string;
  settings: GrassSettings;
}>): void {
  const values = {
    grassButterflyCount: String(diagnostics.butterflyCount),
    grassButterflyFlightCycles: String(settings.butterflies.flightCycles),
    grassButterflyHeightRange: `${settings.butterflies.heightMin}:${settings.butterflies.heightMax}`,
    grassButterflyLandingBlend:
      diagnostics.butterflyLandingBlend.toFixed(4),
    grassButterflyLandingTime: String(settings.butterflies.landingTime),
    grassButterflyLayoutSignature: layoutSignature,
    grassButterflyResourceSignature: resourceSignature,
    grassButterflySeed: String(settings.butterflies.seed),
    grassButterflySizeRange: `${settings.butterflies.sizeMin}:${settings.butterflies.sizeMax}`,
    grassButterflyTextureSize: textureSize,
    grassButterflyTextureSizes: textureSizes,
    grassButterflyTransitioning: String(
      diagnostics.butterflyTransitioning,
    ),
    grassButterflyWingCycles: String(settings.butterflies.wingCycles),
  };
  for (const [key, value] of Object.entries(values)) {
    canvas.dataset[key] = value;
    host.dataset[key] = value;
  }
}
