import { defineToolcraft } from "@/toolcraft/runtime";

import { resolveGalleryPresetUrl } from "./gallery-preset-url";

const responsiveReason =
  "The live WebGL gallery must respond while this visible setting changes.";

const galleryPresets = [
  {
    dataUrl: resolveGalleryPresetUrl(
      import.meta.env.BASE_URL,
      "woman-white-eyeliner-yellow-jacket.jpg",
    ),
    fileName: "Woman with White Eyeliner and Yellow Jacket.jpg",
    id: "gallery-preset-woman-white-eyeliner-yellow-jacket",
  },
  {
    dataUrl: resolveGalleryPresetUrl(
      import.meta.env.BASE_URL,
      "white-suv-desert.jpg",
    ),
    fileName: "White SUV Desert Photo.jpg",
    id: "gallery-preset-white-suv-desert",
  },
  {
    dataUrl: resolveGalleryPresetUrl(
      import.meta.env.BASE_URL,
      "aerial-mountain-range.jpg",
    ),
    fileName: "Aerial Mountain Range.jpg",
    id: "gallery-preset-aerial-mountain-range",
  },
  {
    dataUrl: resolveGalleryPresetUrl(
      import.meta.env.BASE_URL,
      "blue-ice-cave.jpg",
    ),
    fileName: "Blue Ice Cave.jpg",
    id: "gallery-preset-blue-ice-cave",
  },
  {
    dataUrl: resolveGalleryPresetUrl(
      import.meta.env.BASE_URL,
      "pink-white-background.jpg",
    ),
    fileName: "Pink White Background Image.jpg",
    id: "gallery-preset-pink-white-background",
  },
  {
    dataUrl: resolveGalleryPresetUrl(
      import.meta.env.BASE_URL,
      "desert-dune.jpg",
    ),
    fileName: "Desert Dune.jpg",
    id: "gallery-preset-desert-dune",
  },
  {
    dataUrl: resolveGalleryPresetUrl(
      import.meta.env.BASE_URL,
      "modern-high-rise-buildings.jpg",
    ),
    fileName: "Modern High-Rise Buildings.jpg",
    id: "gallery-preset-modern-high-rise-buildings",
  },
  {
    dataUrl: resolveGalleryPresetUrl(
      import.meta.env.BASE_URL,
      "blue-pink-light.jpg",
    ),
    fileName: "Blue Pink Light Illustration.jpg",
    id: "gallery-preset-blue-pink-light",
  },
  {
    dataUrl: resolveGalleryPresetUrl(
      import.meta.env.BASE_URL,
      "snow-capped-mountain.jpg",
    ),
    fileName: "Snow-capped Mountain.jpg",
    id: "gallery-preset-snow-capped-mountain",
  },
  {
    dataUrl: resolveGalleryPresetUrl(
      import.meta.env.BASE_URL,
      "turquoise-ocean.jpg",
    ),
    fileName: "Turquoise Ocean.jpg",
    id: "gallery-preset-turquoise-ocean",
  },
  {
    dataUrl: resolveGalleryPresetUrl(
      import.meta.env.BASE_URL,
      "geometric-facade-london.jpg",
    ),
    fileName: "Geometric Facade London.jpg",
    id: "gallery-preset-geometric-facade-london",
  },
  {
    dataUrl: resolveGalleryPresetUrl(
      import.meta.env.BASE_URL,
      "abstract-red-orange.jpg",
    ),
    fileName: "Abstract Red Orange Background.jpg",
    id: "gallery-preset-abstract-red-orange",
  },
  {
    dataUrl: resolveGalleryPresetUrl(
      import.meta.env.BASE_URL,
      "modern-architecture.jpg",
    ),
    fileName: "Modern Architecture.jpg",
    id: "gallery-preset-modern-architecture",
  },
  {
    dataUrl: resolveGalleryPresetUrl(
      import.meta.env.BASE_URL,
      "blue-pink-background.jpg",
    ),
    fileName: "Blue Pink Background Wallpaper.jpg",
    id: "gallery-preset-blue-pink-background",
  },
] as const;

const slider = (
  target: string,
  label: string,
  defaultValue: number,
  min: number,
  max: number,
  step: number,
  description?: string,
) => ({
  defaultValue,
  ...(description ? { description } : {}),
  label,
  max,
  min,
  orderRole: "strength" as const,
  performanceReason: responsiveReason,
  performanceRole: "responsiveness" as const,
  sliderValueKind: "continuous" as const,
  step,
  target,
  type: "slider" as const,
});

export const appSchema = defineToolcraft({
  canvas: {
    draggable: true,
    enabled: true,
    renderScale: {
      defaultValue: 2,
      enabled: true,
      max: 2,
      min: 1,
      step: 0.25,
    },
    size: { height: 1080, unit: "px", width: 1920 },
    sizing: { mode: "editable-output" },
    upload: true,
  },
  export: { png: { background: "transparent" } },
  media: {
    defaultAssets: galleryPresets.map((preset) => ({
      ...preset,
      assetKind: "image" as const,
      mimeType: "image/jpeg",
      sourceTarget: "source.images",
    })),
  },
  panels: {
    controls: {
      sections: [
        {
          controls: {
            images: {
              accept: "image/*",
              assetKind: "image",
              defaultValue: null,
              description:
                "Order the source set by dragging thumbnails; preview and export use the first 24 images in that exact order.",
              label: "Images",
              multiple: true,
              orderRole: "input",
              performanceReason:
                "Importing, sorting, transforming, or removing source images must keep the preview responsive.",
              performanceRole: "responsiveness",
              target: "source.images",
              type: "fileDrop",
            },
          },
          title: "Gallery",
        },
        {
          controls: {
            mode: {
              defaultValue: "spiral",
              description:
                "Flow wraps cards around an endless curved path; Deck deals cards from a front-facing stack.",
              label: false,
              options: [
                { label: "Flow", value: "spiral" },
                { label: "Deck", value: "stack" },
              ],
              orderRole: "mode",
              performanceReason: responsiveReason,
              performanceRole: "responsiveness",
              target: "layout.mode",
              type: "segmented",
            },
          },
          title: "Layout",
        },
        {
          controls: {
            radius: slider("spiral.radius", "Radius", 2.8, 1.8, 6, 0.05),
            twist: {
              ...slider(
                "spiral.twistDegrees",
                "Twist",
                20.4,
                18,
                80,
                0.1,
              ),
              unit: "°",
            },
            verticalGap: slider(
              "spiral.verticalGap",
              "Vertical gap",
              0.35,
              0.35,
              1.4,
              0.01,
            ),
            depth: slider("spiral.depth", "Depth", 1.75, 0, 4, 0.05),
            depthOffset: slider(
              "spiral.depthOffset",
              "Depth offset",
              -0.2,
              -3,
              1,
              0.05,
            ),
            taper: slider(
              "spiral.taper",
              "Distance taper",
              0.04,
              0,
              0.12,
              0.005,
            ),
            repetitions: {
              defaultValue: 3,
              description:
                "Repeats the uploaded sequence around the infinite wrap; this is the primary live workload control.",
              label: "Repetitions",
              max: 8,
              min: 1,
              orderRole: "detail",
              performanceReason:
                "Each repetition adds one rendered card per source image and increases per-frame GPU work linearly.",
              performanceRole: "workload",
              sliderValueKind: "discrete",
              step: 1,
              target: "spiral.repetitions",
              type: "slider",
              variant: "discrete",
            },
          },
          title: "Flow",
          visibleWhen: { equals: "spiral", target: "layout.mode" },
        },
        {
          controls: {
            gap: slider(
              "stack.gap",
              "Card gap",
              0.22,
              0.1,
              0.6,
              0.005,
              "Vertical spacing between resting deck cards.",
            ),
            depthStep: slider(
              "stack.depthStep",
              "Depth step",
              1.4,
              0.2,
              1.4,
              0.01,
            ),
            backTilt: {
              ...slider(
                "stack.backTiltDegrees",
                "Back tilt",
                0,
                0,
                32,
                0.1,
              ),
              unit: "°",
            },
            fallDistance: slider(
              "stack.fallDistance",
              "Fall distance",
              0.6,
              0.6,
              3,
              0.05,
              "How far the passed card drops before fading out.",
            ),
            fallTilt: {
              ...slider(
                "stack.fallTiltDegrees",
                "Fall tilt",
                74,
                30,
                110,
                0.5,
                "Lying angle the passed card reaches while it falls.",
              ),
              unit: "°",
            },
            scrollWeight: slider(
              "stack.scrollWeight",
              "Scroll weight",
              1,
              0,
              1,
              0.01,
              "Higher values add mass: deck scrolling ramps up and glides to rest more gradually.",
            ),
          },
          title: "Deck",
          visibleWhen: { equals: "stack", target: "layout.mode" },
        },
        {
          controls: {
            width: slider("card.width", "Width", 2.7, 1.2, 4.5, 0.05),
            height: slider("card.height", "Height", 1.5, 0.8, 3.5, 0.05),
            curveRadius: slider(
              "card.curveRadius",
              "Curve radius",
              10,
              1.2,
              10,
              0.05,
              "Smaller radii produce a stronger permanent cylindrical bend.",
            ),
            cornerRadius: slider(
              "card.cornerRadius",
              "Corner radius",
              0.055,
              0,
              0.22,
              0.005,
            ),
          },
          title: "Cards",
        },
        {
          controls: {
            color: {
              defaultValue: { hex: "#000000", opacity: 15 },
              description:
                "Color and opacity of the shadow every card casts; 0% opacity removes it.",
              label: "Color",
              performanceReason: responsiveReason,
              performanceRole: "responsiveness",
              target: "shadow.color",
              type: "colorOpacity",
            },
            blur: slider(
              "shadow.blur",
              "Blur",
              0.31,
              0.05,
              0.9,
              0.01,
              "How far the shadow spreads and feathers beyond the card.",
            ),
            offset: {
              defaultValue: { x: "0.03", y: "0.12" },
              description:
                "Direction and distance the shadow falls, as if moving the light source.",
              label: "Offset",
              performanceReason: responsiveReason,
              performanceRole: "responsiveness",
              target: "shadow.offset",
              type: "vector",
            },
          },
          title: "Shadow",
        },
        {
          controls: {
            tilt: {
              ...slider(
                "depth.tiltDegrees",
                "Distance tilt",
                4.01,
                0,
                14,
                0.1,
              ),
              unit: "°",
            },
            focusFalloff: slider(
              "depth.focusFalloff",
              "Focus falloff",
              0.36,
              0,
              0.36,
              0.01,
            ),
            focusFloor: slider(
              "depth.focusFloor",
              "Focus floor",
              0.58,
              0.2,
              1,
              0.01,
              "Sets the darkest brightness retained by distant cards.",
            ),
            scaleFalloff: slider(
              "depth.scaleFalloff",
              "Scale falloff",
              0.43,
              0,
              0.6,
              0.01,
            ),
            minScale: slider(
              "depth.minScale",
              "Minimum scale",
              0.89,
              0.35,
              1,
              0.01,
            ),
          },
          title: "Depth",
        },
        {
          controls: {
            wheelSpeed: slider(
              "physics.wheelSpeed",
              "Wheel speed",
              1,
              0.1,
              3,
              0.05,
            ),
            dragSpeed: slider(
              "physics.dragSpeed",
              "Drag speed",
              2.5,
              0.4,
              6,
              0.1,
            ),
            keyStep: slider(
              "physics.keyStep",
              "Key step",
              120,
              20,
              260,
              5,
            ),
            inertia: slider(
              "physics.inertia",
              "Inertia",
              0.02,
              0.02,
              0.25,
              0.005,
              "Lower values glide longer; higher values follow input more quickly.",
            ),
            flexStrength: slider(
              "physics.flexStrength",
              "Flex strength",
              0.29,
              0,
              0.6,
              0.01,
              "Controls the speed-signed physical bow applied along card height.",
            ),
            flexResponse: slider(
              "physics.flexResponse",
              "Flex response",
              1.35,
              0.2,
              2.5,
              0.05,
            ),
            snapStrength: slider(
              "physics.snapStrength",
              "Snap strength",
              0,
              0,
              0.35,
              0.01,
              "Settles toward the nearest source card after input stops.",
            ),
          },
          title: "Physics",
        },
        {
          controls: {
            pressDepth: slider(
              "interaction.pressDepth",
              "Press depth",
              0.38,
              0,
              1,
              0.01,
            ),
            pressShrink: slider(
              "interaction.pressShrink",
              "Press shrink",
              0.095,
              0,
              0.12,
              0.005,
            ),
            parallax: slider(
              "interaction.parallax",
              "Pointer parallax",
              0.36,
              0,
              0.5,
              0.01,
              "Offsets the gallery subtly toward the pointer.",
            ),
            invertDirection: {
              defaultValue: false,
              label: "Invert direction",
              orderRole: "mode",
              performanceReason: responsiveReason,
              performanceRole: "responsiveness",
              target: "interaction.invertDirection",
              type: "switch",
            },
          },
          title: "Interaction",
        },
        {
          controls: {
            perspective: {
              ...slider(
                "view.perspective",
                "Perspective",
                33,
                24,
                72,
                1,
              ),
              unit: "°",
            },
            cameraDistance: slider(
              "view.cameraDistance",
              "Camera distance",
              8.6,
              5,
              16,
              0.1,
            ),
            sceneOffset: slider(
              "view.sceneOffset",
              "Scene offset",
              0,
              -2,
              3,
              0.05,
            ),
            portraitScale: slider(
              "view.portraitScale",
              "Portrait scale",
              0.82,
              0.45,
              1,
              0.01,
            ),
          },
          title: "View",
        },
        {
          controls: {
            includeBackground: {
              defaultValue: true,
              description:
                "Controls live preview and still-image background visibility.",
              label: "Include",
              performanceReason: responsiveReason,
              performanceRole: "responsiveness",
              target: "export.includeBackground",
              type: "switch",
            },
            background: {
              defaultValue: "#EDEDED",
              label: false,
              performanceReason: responsiveReason,
              performanceRole: "responsiveness",
              target: "appearance.background",
              type: "color",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["includeBackground", "background"],
              layout: "inline",
            },
          ],
          title: "Background",
        },
        {
          controls: {
            imageFormat: {
              defaultValue: "png",
              label: "Format",
              options: [
                { label: "PNG", value: "png" },
                { label: "JPG", value: "jpg" },
              ],
              performanceReason:
                "Changing format selects the browser encoding path for the final image.",
              performanceRole: "responsiveness",
              target: "export.image.format",
              type: "select",
            },
            imageResolution: {
              defaultValue: "4k",
              label: "Resolution",
              options: [
                { label: "2K", value: "2k" },
                { label: "4K", value: "4k" },
                { label: "8K", value: "8k" },
              ],
              performanceReason:
                "The selected long edge changes the final batch render and encoded image dimensions.",
              performanceRole: "responsiveness",
              target: "export.image.resolution",
              type: "select",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["imageFormat", "imageResolution"],
              layout: "inline",
            },
          ],
          title: "Image Export",
        },
        {
          actionGroup: "secondary",
          controls: {
            output: {
              actions: [
                {
                  icon: "upload-simple",
                  label: "Export PNG",
                  role: "export-image",
                  value: "export.png",
                },
                {
                  icon: "upload-simple",
                  label: "Export Code",
                  role: "download-output",
                  value: "export.code",
                },
              ],
              target: "export.actions",
              type: "panelActions",
            },
          },
          title: "Export",
        },
      ],
      title: "Spatial Gallery",
    },
  },
  persistence: {
    include: ["values", "canvas", "panels", "media"],
    key: "toolcraft:spatial-gallery:state:v9",
    storage: "localStorage",
    version: 9,
  },
  settingsTransfer: "auto",
  toolbar: {
    history: true,
    radar: true,
    theme: true,
    zoom: true,
  },
});
