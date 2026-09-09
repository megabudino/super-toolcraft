import { waveDefaultValues } from "./wave-default-values";

export const materialDefaults = {
  clearcoat: waveDefaultValues["material.clearcoat"],
  clearcoatRoughness: waveDefaultValues["material.clearcoatRoughness"],
  color: waveDefaultValues["material.color"],
  roughness: waveDefaultValues["material.roughness"],
} as const;

const materialReason =
  "Material edits update one retained MeshPhysicalMaterial without rebuilding geometry.";

export const materialSection = {
  controls: {
    color: {
      applicability: { mode: "always" },
      defaultValue: materialDefaults.color,
      label: "Color",
      performanceReason: materialReason,
      performanceRole: "responsiveness",
      target: "material.color",
      type: "color",
    },
    roughness: {
      applicability: { mode: "always" },
      defaultValue: materialDefaults.roughness,
      label: "Roughness",
      max: 1,
      min: 0,
      performanceReason: materialReason,
      performanceRole: "responsiveness",
      sliderValueKind: "continuous",
      step: 0.01,
      target: "material.roughness",
      type: "slider",
    },
    clearcoat: {
      applicability: { mode: "always" },
      defaultValue: materialDefaults.clearcoat,
      label: "Clearcoat",
      max: 1,
      min: 0,
      performanceReason: materialReason,
      performanceRole: "responsiveness",
      sliderValueKind: "continuous",
      step: 0.01,
      target: "material.clearcoat",
      type: "slider",
    },
    clearcoatRoughness: {
      applicability: { mode: "always" },
      defaultValue: materialDefaults.clearcoatRoughness,
      label: "Coat roughness",
      max: 1,
      min: 0,
      performanceReason: materialReason,
      performanceRole: "responsiveness",
      sliderValueKind: "continuous",
      step: 0.01,
      target: "material.clearcoatRoughness",
      type: "slider",
    },
  },
  id: "material",
  title: "Material",
} as const;
