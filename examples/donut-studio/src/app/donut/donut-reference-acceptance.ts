import type { ToolcraftTransferMode } from "../acceptance/types";

export const donutDeepControlAcceptance = [
  ["donut.majorRadius", "slider", "Ring changes the authored donut radius."],
  ["donut.thickness", "slider", "Thickness changes the complete donut profile."],
  ["donut.height", "slider", "Height changes the vertical donut profile."],
  ["donut.organic", "slider", "Organic changes bounded surface variation."],
  ["material.donut.color", "color", "Donut color repaints the authored Base."],
  ["material.donut.roughness", "slider", "Donut roughness changes highlights."],
  ["material.donut.subsurface", "slider", "Subsurface changes edible softness."],
  ["material.donut.softness", "slider", "Softness scales the subsurface response."],
  ["material.donut.coat", "slider", "Donut coat changes the clear highlight."],
  ["material.donut.sheen", "slider", "Donut sheen changes its edge response."],
  ["icing.coverage", "slider", "Coverage changes the icing surface band."],
  ["icing.thickness", "slider", "Icing thickness changes the coating shell."],
  ["icing.flow", "slider", "Flow changes the smooth viscous icing field."],
  ["icing.dripAmount", "slider", "Drip length changes icing edge depth."],
  ["icing.dripFrequency", "slider", "Drip frequency changes icing cadence."],
  ["icing.detail", "slider", "Detail changes organic icing variation."],
  ["material.icing.roughness", "slider", "Icing roughness changes highlights."],
  ["material.icing.subsurface", "slider", "Icing subsurface changes softness."],
  ["material.icing.coat", "slider", "Icing coat changes the clear highlight."],
  ["material.icing.sheen", "slider", "Icing sheen changes its edge response."],
  ["sprinkles.seed", "slider", "Seed regenerates deterministic placement."],
  ["sprinkles.coverage", "slider", "Coverage changes the emission band."],
  ["sprinkles.sizeVariation", "slider", "Size variation changes instance sizes."],
  ["sprinkles.rotation", "slider", "Rotation changes tangent orientation."],
  [
    "sprinkles.surfaceOffset",
    "slider",
    "Signed surface offset embeds or lifts instances from natural icing contact.",
  ],
  ["material.sprinkle.roughness", "slider", "Sprinkle roughness changes highlights."],
  ["material.sprinkle.coat", "slider", "Sprinkle coat changes clear highlights."],
  ["material.plate.color", "color", "Plate color repaints the ceramic surface."],
  ["material.plate.roughness", "slider", "Plate roughness changes reflections."],
  ["material.plate.coat", "slider", "Plate coat changes clear reflections."],
  [
    "donut.preset",
    "select",
    "Flavor preset applies a curated tasty donut look in one step.",
  ],
  ["studio.hdriVisible", "switch", "Backdrop shows the retained HDR panorama."],
  ["studio.environmentBlur", "slider", "Backdrop blur softens the visible HDR panorama."],
  ["studio.environmentStrength", "slider", "Environment strength changes HDR fill."],
  ["studio.environmentRotation", "slider", "Environment rotation turns HDR reflections."],
  ["studio.shadowsEnabled", "switch", "Shadows remove and restore product contact shading."],
  ["studio.shadowStrength", "slider", "Shadow strength changes contact opacity."],
  ["studio.shadowSoftness", "slider", "Shadow softness changes the directional edge."],
  ["studio.key.power", "slider", "Key power changes the principal light."],
  ["studio.key.color", "color", "Key color changes the principal light."],
  ["studio.key.size", "slider", "Key size changes its area highlight."],
  ["studio.warm.power", "slider", "Warm power changes the warm light."],
  ["studio.warm.color", "color", "Warm color changes the warm light."],
  ["studio.warm.size", "slider", "Warm size changes its area highlight."],
  ["studio.cool.power", "slider", "Cool power changes the cool light."],
  ["studio.cool.color", "color", "Cool color changes the cool light."],
  ["studio.cool.size", "slider", "Cool size changes its area highlight."],
] as const;

export const donutEdibleMaterialAcceptance = [
  [
    "material.donut.bake",
    "slider",
    "Bake changes caramelised colour variation across the donut.",
  ],
  [
    "material.donut.pores",
    "slider",
    "Pores changes fine crumb dimples and surface breakup.",
  ],
  [
    "material.donut.moisture",
    "slider",
    "Moisture changes soft transmission and surface roughness.",
  ],
  [
    "material.donut.variation",
    "slider",
    "Variation changes natural colour and roughness breakup.",
  ],
  [
    "material.icing.glaze",
    "slider",
    "Glaze changes the icing's wet clear highlight.",
  ],
  [
    "material.icing.texture",
    "slider",
    "Texture changes subtle hand-spread icing microstructure.",
  ],
] as const;

function deepControlSourceEvidence(id: string): string {
  if (id.startsWith("donut.")) {
    return "Evaluated Base mesh bounds plus hidden Main group deformation and simulation-node domains.";
  }
  if (id.startsWith("icing.")) {
    return "Icing and Main group geometry-node topology, stored attributes, simulation zones, and modifier drivers.";
  }
  if (id.startsWith("sprinkles.")) {
    return "Sprinkle and Main group distribution nodes, instance attributes, random fields, and modifier drivers.";
  }
  if (id.startsWith("material.")) {
    return "Authored Blender Principled BSDF inputs for Base, icing, sprinkle, and Plate materials.";
  }
  return "Authored World node tree and Key, Warm, and Cool Area object properties.";
}

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: { mode: "none" },
  behaviorCoverage: ["canvas-sizing", "control-mapping", "renderer-state"],
  mode: "reference-runtime-clone",
  referenceFeatureInventory: [
    {
      acceptanceId: "canvas.aspectRatio",
      behaviorEvidence:
        "The Blender scene stores a 1920×1080 render frame; the Toolcraft transfer keeps that authored default and exposes the standard editable output frame.",
      featureName: "Output frame",
      id: "blender.output-frame",
      referenceBehavior:
        "The visible result is evaluated inside the active Blender scene render dimensions.",
      sourceEvidence:
        "Scene render resolution 1920×1080 at 100% with square pixels.",
      status: "toolcraft-native",
      toolcraftMapping:
        "Editable Aspect ratio and width/height retain 1920×1080 as the default while supporting standard Toolcraft output sizing.",
    },
    {
      acceptanceId: "reference.scene",
      behaviorEvidence:
        "Headless Blender evaluation measured 21,504 Base polygons and 3,840 Plate polygons, then the baked GLB retained both named objects and world transforms.",
      featureName: "Donut base and plate",
      id: "blender.base-plate",
      referenceBehavior:
        "The organic donut base sits on a glossy white ceramic plate.",
      sourceEvidence:
        "Objects Base and Plate, evaluated meshes, bounds, Subdivision modifiers, and materials Material / Material.002.",
      status: "ported",
      toolcraftMapping:
        "The exact evaluated Base and Plate meshes are exported from the supplied file and rendered together in the retained Three.js scene.",
    },
    {
      acceptanceId: "icing.enabled",
      behaviorEvidence:
        "The Icing modifier exposes Enable true and drivers feed that value into Main group simulation state.",
      featureName: "Icing enablement",
      id: "blender.icing-enable",
      referenceBehavior: "Enable controls whether icing contributes geometry.",
      sourceEvidence: "Geometry Nodes group icing input Enable, default true.",
      status: "ported",
      toolcraftMapping:
        "The Icing switch attaches or removes the retained procedural coating.",
    },
    {
      acceptanceId: "icing.color",
      behaviorEvidence:
        "The authored linear RGBA [0.86699069, 0.62104517, 0, 1] drives the icing col attribute and Principled material.",
      featureName: "Icing colour",
      id: "blender.icing-colour",
      referenceBehavior: "Colour changes the complete icing material.",
      sourceEvidence: "icing group Colour input and col named attribute.",
      status: "ported",
      toolcraftMapping:
        "The color control defaults to its converted sRGB value and updates the physical icing material.",
    },
    {
      acceptanceId: "icing.clear",
      behaviorEvidence:
        "Clear Base and Clear Detail are independent boolean public inputs and modifier drivers.",
      featureName: "Icing clear operations",
      id: "blender.icing-clear",
      referenceBehavior:
        "Base clears the coating result; Detail clears accumulated variation separately.",
      sourceEvidence:
        "icing inputs Clear Base and Clear Detail plus Main Group modifier drivers.",
      status: "ported",
      toolcraftMapping:
        "Local Base and Detail actions produce visibly distinct no-coating and smooth-coating states.",
    },
    {
      acceptanceId: "sprinkles.flow",
      behaviorEvidence:
        "Flow default 1 is stored into Main group attributes and changes the generated population.",
      featureName: "Sprinkle flow",
      id: "blender.sprinkle-flow",
      referenceBehavior: "Flow controls sprinkle emission amount.",
      sourceEvidence: "Sprinkle group Flow input and driver Input_9.",
      status: "ported",
      toolcraftMapping:
        "Flow maps deterministically to 0–840 visible instances inside a 900-instance enforced boundary.",
    },
    {
      acceptanceId: "sprinkles.scale",
      behaviorEvidence:
        "Scale default 0.5 drives the sc attribute consumed by sprinkle instances.",
      featureName: "Sprinkle scale",
      id: "blender.sprinkle-scale",
      referenceBehavior: "Scale changes every generated sprinkle primitive.",
      sourceEvidence: "Sprinkle group Scale input and Main group drivers.",
      status: "ported",
      toolcraftMapping:
        "Scale updates retained instance matrices for the current deterministic layout.",
    },
    {
      acceptanceId: "sprinkles.shape",
      behaviorEvidence:
        "Reference renders verified Shape Type 1 as faceted pellets, 2 as pearls, and 3 as elongated rounded rods.",
      featureName: "Sprinkle shapes",
      id: "blender.sprinkle-shapes",
      referenceBehavior: "Three integer shape branches choose distinct geometry.",
      sourceEvidence:
        "Sprinkle Shape Type 1..3 and 59-node sprinkle instance group.",
      status: "ported",
      toolcraftMapping:
        "Segmented Pellet, Pearl, and Rod choices swap three retained shared instanced geometries.",
    },
    {
      acceptanceId: "sprinkles.palette",
      behaviorEvidence:
        "Colour Type 1 selects Solid Colour, 4 uses procedural hue, and 2/3/5 sample three external palette images that are referenced but not packed.",
      featureName: "Sprinkle colour modes",
      id: "blender.sprinkle-colours",
      referenceBehavior: "Five public color branches determine sprinkle color.",
      sourceEvidence:
        "Sprinkle Colour Type 1..5, col/typec/rand attributes, shader compare and image nodes.",
      status: "ported",
      toolcraftMapping:
        "Solid, Pastel, Candy, Rainbow, and Cocoa preserve five distinct public branches; unavailable private palette images are reconstructed as deterministic banks.",
    },
    {
      acceptanceId: "sprinkles.metallic",
      behaviorEvidence:
        "Metallic default 0 drives the Principled sprinkle material response.",
      featureName: "Sprinkle metallic response",
      id: "blender.sprinkle-metallic",
      referenceBehavior:
        "Metallic moves the sprinkle shader between dielectric and metallic response.",
      sourceEvidence: "Sprinkle Metallic input and sprinkle Principled shader.",
      status: "ported",
      toolcraftMapping:
        "Metallic updates the shared MeshPhysicalMaterial without rebuilding instances.",
    },
    {
      acceptanceId: "reference.scene",
      behaviorEvidence:
        "The source World uses brown_photostudio_02 rotated 90° at strength 0.25, a blue camera-ray background, three authored area lights, Filmic contrast, and Principled materials.",
      featureName: "Materials, world, and studio lights",
      id: "blender.lookdev",
      referenceBehavior:
        "Warm/cool studio lighting, HDR reflections, glossy plate, edible donut and icing, and a blue background define the final look.",
      sourceEvidence:
        "World node tree, three Area objects, and Material / icing / Material.002 / sprinkle Principled inputs.",
      status: "ported",
      toolcraftMapping:
        "Three RectAreaLights retain source color/power/size intent, the CC0 HDRI supplies reflections, and physical materials preserve roughness/coat/sheen character under ACES tone mapping.",
    },
    ...donutEdibleMaterialAcceptance.map(
      ([acceptanceId, , observable]) => ({
        acceptanceId,
        behaviorEvidence: `${observable} The deterministic object-space shader keeps the result stable across preview and export.`,
        featureName: acceptanceId,
        id: `approved-redesign.${acceptanceId}`,
        referenceBehavior:
          "The Blender material provides a smooth Principled surface without an exposed procedural food-surface control.",
        sourceEvidence:
          "The supplied Blender file's authored Principled materials, the user's explicit plastic-material complaint, and the user-supplied /Users/kusnizza/Desktop/Donut/ 4K BaseColor, Roughness, Normal, and FBX material reference.",
        status: "intentionally-changed" as const,
        toolcraftMapping:
          "A bounded Toolcraft slider updates retained scanned-atlas triplanar and procedural edible-PBR shader uniforms without changing geometry or tessellation.",
        userApprovedChangeReason:
          "The user explicitly requested directly realistic and appetising materials, approved the redesign with “давай делать”, then requested the supplied Donut PBR material after reporting that the procedural pass looked plastic.",
      }),
    ),
    ...donutDeepControlAcceptance.map(([acceptanceId, , observable]) => {
      const isViscousFlow = acceptanceId === "icing.flow";
      const isUserLightingAddition =
        acceptanceId === "studio.hdriVisible" ||
        acceptanceId === "studio.environmentBlur" ||
        acceptanceId === "studio.shadowsEnabled" ||
        acceptanceId === "studio.shadowStrength" ||
        acceptanceId === "studio.shadowSoftness";
      const isFlavorPresetAddition = acceptanceId === "donut.preset";
      const isUserAddition = isUserLightingAddition || isFlavorPresetAddition;
      return {
        acceptanceId,
        behaviorEvidence: isViscousFlow
          ? `${observable} Geometry tests require broad periodic lobes, multi-row displacement, and a bounded adjacent-edge slope.`
          : isFlavorPresetAddition
            ? `${observable} Applying a preset dispatches bounded controls.setValue commands whose targets and ranges are unit-tested against the schema.`
          : isUserLightingAddition
            ? `${observable} The retained HDR texture and directional shadow map update without rebuilding the scene.`
          : `${observable} The browser renderer records the resulting state in its deterministic scene signature.`,
        featureName: acceptanceId,
        id: `${isViscousFlow || isUserAddition ? "approved-redesign" : "blender"}.${acceptanceId}`,
        referenceBehavior: isViscousFlow
          ? "The Blender simulation implies accumulated icing movement, while the previous browser approximation used narrow independent sine spikes."
          : isFlavorPresetAddition
            ? "The Blender scene exposes individual modifier inputs only and has no curated multi-value flavor presets."
          : isUserLightingAddition
            ? "The Blender scene contains HDR world lighting and light-cast shadows, but it does not expose these Toolcraft controls or show the HDR panorama as the camera background."
          : observable,
        sourceEvidence: isViscousFlow
          ? "The supplied Blender icing simulation zones plus the user's explicit request to replace triangular teeth with adjustable simulated-looking flow."
          : isFlavorPresetAddition
            ? "The user's explicit request “сделай 10 пресетов вкусных пончиков” plus the existing bounded schema targets the presets write."
          : isUserLightingAddition
            ? "The supplied brown_photostudio_02 HDR asset, authored Blender lights, and the user's explicit request “добавь тени и hdri”."
          : deepControlSourceEvidence(acceptanceId),
        status: isViscousFlow || isUserAddition
          ? ("intentionally-changed" as const)
          : ("ported" as const),
        toolcraftMapping: isViscousFlow
          ? "A bounded Flow slider widens and relaxes a deterministic periodic viscous field through multiple fixed-tessellation coating rows."
          : isFlavorPresetAddition
            ? "One built-in select dispatches existing bounded control values; every touched target keeps its own acceptance, invalidation, and reset coverage."
          : isUserLightingAddition
            ? "Built-in Toolcraft controls update the retained HDR backdrop/environment and fixed-resolution directional shadow rig."
          : "A bounded Toolcraft control mutates the corresponding retained geometry, material, distribution, environment, or light property.",
        ...(isViscousFlow || isUserAddition
          ? {
              userApprovedChangeReason:
                isViscousFlow
                  ? "The user explicitly requested adjustable icing flow that imitates spreading rather than the current triangular result."
                  : isFlavorPresetAddition
                    ? "The user explicitly requested ten curated tasty donut presets."
                  : "The user explicitly requested shadows and HDRI in the application.",
            }
          : {}),
      };
    }),
  ],
  referenceName: "Donut Simulation Blender Geometry Nodes",
  referenceStudy: {
    behaviorEvidence:
      "Blender 4.5.2 headless inspection captured 48 objects, 10 materials, five Geometry Node groups totaling 430 nodes and 532 links, 28 drivers, five simulation zones, public modifier defaults, evaluated mesh statistics, world nodes, three area lights, and comparative renders of all sprinkle shapes. Sequential frames 1–240 showed no authored action, camera, or changing saved simulation result.",
    referenceLocation:
      "/Users/kusnizza/Desktop/Donut Simulation Blender Geometry Nodes.blend",
    reproductionSteps:
      "Open the supplied file in Blender 4.0 or newer, inspect Base, Plate, Icing, Sprinkle, and hidden Main Group, change the public icing/sprinkle modifier inputs, and render the scene with EEVEE.",
    sourceEvidence:
      "The local .blend was opened and evaluated directly with Blender Python; the app includes a reproducible Base/Plate export script and manifest bound to the source SHA-256.",
    status: "ran-original",
  },
  referenceTimeline: { behaviorCoverage: [], mode: "none" },
  sourceOfTruth: "reference-runtime",
};
