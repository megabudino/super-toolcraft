import type { ToolcraftRendererPipelinePassContract } from "@/toolcraft/runtime";

export type GrassRenderResult = Readonly<{
  bladeCount: number;
  signature: string;
}>;

export type GrassSceneResource = Readonly<{
  canvas: HTMLCanvasElement;
  dispose: () => void;
}>;

export type GrassRendererPassContracts = {
  "grass-butterfly-layout-build": ToolcraftRendererPipelinePassContract<GrassRenderResult>;
  "grass-butterfly-resource": ToolcraftRendererPipelinePassContract<string>;
  "grass-environment-resource": ToolcraftRendererPipelinePassContract<string>;
  "grass-scan-resource": ToolcraftRendererPipelinePassContract<string>;
  "grass-export-frame": ToolcraftRendererPipelinePassContract<HTMLCanvasElement>;
  "grass-ground-geometry-build": ToolcraftRendererPipelinePassContract<string>;
  "grass-lawn-layout-build": ToolcraftRendererPipelinePassContract<GrassRenderResult>;
  "grass-layout-build": ToolcraftRendererPipelinePassContract<GrassRenderResult>;
  "grass-scene-render": ToolcraftRendererPipelinePassContract<GrassRenderResult>;
  "grass-scene-resource": ToolcraftRendererPipelinePassContract<
    GrassSceneResource,
    GrassSceneResource,
    readonly [string]
  >;
  "grass-rock-layout-build": ToolcraftRendererPipelinePassContract<GrassRenderResult>;
  "grass-tufted-layout-build": ToolcraftRendererPipelinePassContract<GrassRenderResult>;
  "grass-white-layout-build": ToolcraftRendererPipelinePassContract<GrassRenderResult>;
  "grass-wild-layout-build": ToolcraftRendererPipelinePassContract<GrassRenderResult>;
  "grass-yellow-layout-build": ToolcraftRendererPipelinePassContract<GrassRenderResult>;
  "grass-noise-preview": ToolcraftRendererPipelinePassContract<string>;
};
