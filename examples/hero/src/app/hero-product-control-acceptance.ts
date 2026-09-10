import type { ToolcraftComponentAcceptance } from "./acceptance/types";
import { heroBackgroundPatternTargets } from "./hero-background-pattern-values";
import { heroDispersionTargets } from "./hero-dispersion-values";
import { heroEffectsControlAcceptance } from "./hero-effects-acceptance";
import { heroGalleryTargets } from "./hero-gallery-values";
import { heroHeadingTargets } from "./hero-heading-values";
import { heroHeadingCtaTargets } from "./hero-heading-cta-values";
import { heroHeadingSubtitleTargets } from "./hero-heading-subtitle-values";

function controlAcceptance({
  componentType,
  expectedObservable,
  id,
  target,
  userAction,
}: {
  componentType: string;
  expectedObservable: string;
  id: string;
  target: string;
  userAction: string;
}): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName: `${id} maps canonical state into the hero preview payload`,
    browser: true,
    browserTestName: `browser: ${id} changes the embedded hero output`,
    componentType,
    evidence: "rendered-pixels",
    expectedObservable,
    fixture:
      "Local Recraft website hero with authored or uploaded images in mirrored rows or a multi-row sphere gallery",
    id,
    interactionId: `panel-${target.replaceAll(".", "-")}`,
    kind: "control",
    target,
    userAction,
  };
}

function rowImagesAcceptance(
  target: string,
  rowNumber: number,
): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName:
      "assigns each sphere row only the images from its matching row target",
    browser: true,
    browserTestName: `browser: Row ${rowNumber} images preserve upload order, aspect and transforms`,
    componentType: "fileDrop",
    evidence: "media-lifecycle",
    expectedObservable: `Only the attached images for Row ${rowNumber} appear in that sphere row and preserve their order, aspect and transforms. Removing every image leaves the row blank without changing sibling row content; resetting the Row Images section restores its attached default images.`,
    fixture: "Two small portrait and landscape PNG sphere-row fixtures",
    id: target,
    interactionId: `panel-${target.replaceAll(".", "-")}`,
    kind: "control",
    mediaLifecycleCoverage: [
      "upload",
      "remove",
      "reset",
      "rotate",
      "flip",
      "transform-output",
      "reorder",
      "order-output",
    ],
    target,
    userAction: `Upload, reorder, rotate, flip, remove and reset images for Row ${rowNumber}; verify its own content follows the media lifecycle, sibling rows stay unchanged, and the row is blank when the drop is empty.`,
  };
}

export const heroProductControlAcceptance: readonly ToolcraftComponentAcceptance[] =
  [
    controlAcceptance({
      componentType: "switch",
      expectedObservable:
        "The embedded hero stage changes between its selected blue color and transparency.",
      id: "background.enabled",
      target: "export.includeBackground",
      userAction: "Toggle Background in Setup.",
    }),
    controlAcceptance({
      componentType: "color",
      expectedObservable:
        "The embedded website hero uses the selected stage color.",
      id: "background.color",
      target: "appearance.background",
      userAction: "Choose a different Background color.",
    }),
    controlAcceptance({
      componentType: "switch",
      expectedObservable:
        "The native checker layer appears over or disappears from the selected hero background color.",
      id: heroBackgroundPatternTargets.enabled,
      target: heroBackgroundPatternTargets.enabled,
      userAction: "Toggle Visible in Pattern.",
    }),
    {
      ...controlAcceptance({
        componentType: "colorOpacity",
        expectedObservable:
          "The checker squares use the selected color and transparency while the solid background remains unchanged.",
        id: heroBackgroundPatternTargets.colorOpacity,
        target: heroBackgroundPatternTargets.colorOpacity,
        userAction: "Choose a different Pattern color and opacity.",
      }),
      controlPartCoverage: ["colorOpacity.hex", "colorOpacity.opacity"],
    },
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "Every native checker square grows or shrinks to the selected side length.",
      id: heroBackgroundPatternTargets.squareSize,
      target: heroBackgroundPatternTargets.squareSize,
      userAction: "Drag the Square size slider.",
    }),
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The Recraft line changes size independently while the Styles line keeps its current size.",
      id: heroHeadingTargets.recraftSize,
      target: heroHeadingTargets.recraftSize,
      userAction: "Drag the Recraft size slider.",
    }),
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The Styles line changes size independently while the Recraft line keeps its current size.",
      id: heroHeadingTargets.stylesSize,
      target: heroHeadingTargets.stylesSize,
      userAction: "Drag the Styles size slider.",
    }),
    controlAcceptance({
      componentType: "color",
      expectedObservable:
        "Both hero heading lines use the selected shared color while the V4 badge keeps its own gray treatment.",
      id: heroHeadingTargets.color,
      target: heroHeadingTargets.color,
      userAction: "Choose a different Text color.",
    }),
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The signed vertical space between the Recraft and Styles lines visibly changes.",
      id: heroHeadingTargets.lineGap,
      target: heroHeadingTargets.lineGap,
      userAction: "Drag the Line gap slider.",
    }),
    controlAcceptance({
      componentType: "switch",
      expectedObservable:
        "The V4 badge appears or disappears without hiding either heading line.",
      id: heroHeadingTargets.badgeVisible,
      target: heroHeadingTargets.badgeVisible,
      userAction: "Toggle Badge.",
    }),
    controlAcceptance({
      componentType: "color",
      expectedObservable:
        "The V4 text and circular outline use the selected color while both heading lines keep their current color.",
      id: heroHeadingTargets.badgeColor,
      target: heroHeadingTargets.badgeColor,
      userAction: "Choose a different Badge color.",
    }),
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The complete V4 badge artwork scales uniformly while retaining its authored proportions.",
      id: heroHeadingTargets.badgeScale,
      target: heroHeadingTargets.badgeScale,
      userAction: "Drag the Badge scale slider.",
    }),
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The visible vertical distance between the scaled badge and Recraft line matches the selected pixel value.",
      id: heroHeadingTargets.badgeGap,
      target: heroHeadingTargets.badgeGap,
      userAction: "Drag the Badge gap slider.",
    }),
    controlAcceptance({
      componentType: "switch",
      expectedObservable:
        "The badge shadow appears or disappears without changing the badge artwork or heading shadow.",
      id: heroHeadingTargets.badgeShadowEnabled,
      target: heroHeadingTargets.badgeShadowEnabled,
      userAction: "Toggle Badge Shadow.",
    }),
    {
      ...controlAcceptance({
        componentType: "vector",
        expectedObservable:
          "Changing either axis moves only the badge shadow around the scaled V4 badge.",
        id: heroHeadingTargets.badgeShadowOffset,
        target: heroHeadingTargets.badgeShadowOffset,
        userAction: "Move Badge Shadow offset horizontally and vertically.",
      }),
      controlPartCoverage: ["vector.x", "vector.y"],
    },
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The badge shadow edge becomes sharper or softer without changing its spread.",
      id: heroHeadingTargets.badgeShadowBlur,
      target: heroHeadingTargets.badgeShadowBlur,
      userAction: "Drag Badge Shadow blur.",
    }),
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The badge shadow contracts or expands around the scaled badge before blur is applied.",
      id: heroHeadingTargets.badgeShadowSpread,
      target: heroHeadingTargets.badgeShadowSpread,
      userAction: "Drag Badge Shadow spread.",
    }),
    {
      ...controlAcceptance({
        componentType: "colorOpacity",
        expectedObservable:
          "The badge shadow uses the selected color and transparency without recoloring the badge.",
        id: heroHeadingTargets.badgeShadowColorOpacity,
        target: heroHeadingTargets.badgeShadowColorOpacity,
        userAction: "Choose a different Badge Shadow color and opacity.",
      }),
      controlPartCoverage: ["colorOpacity.hex", "colorOpacity.opacity"],
    },
    controlAcceptance({
      componentType: "switch",
      expectedObservable:
        "The heading shadow appears or disappears without changing the heading content or gallery.",
      id: heroHeadingTargets.shadowEnabled,
      target: heroHeadingTargets.shadowEnabled,
      userAction: "Toggle Heading Shadow.",
    }),
    {
      ...controlAcceptance({
        componentType: "vector",
        expectedObservable:
          "Changing either axis moves only the heading shadow around both text lines.",
        id: heroHeadingTargets.shadowOffset,
        target: heroHeadingTargets.shadowOffset,
        userAction: "Move Heading Shadow offset horizontally and vertically.",
      }),
      controlPartCoverage: ["vector.x", "vector.y"],
    },
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The heading shadow edge becomes sharper or softer without changing its spread.",
      id: heroHeadingTargets.shadowBlur,
      target: heroHeadingTargets.shadowBlur,
      userAction: "Drag Heading Shadow blur.",
    }),
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The heading shadow contracts or expands around both text lines before blur is applied.",
      id: heroHeadingTargets.shadowSpread,
      target: heroHeadingTargets.shadowSpread,
      userAction: "Drag Heading Shadow spread.",
    }),
    {
      ...controlAcceptance({
        componentType: "colorOpacity",
        expectedObservable:
          "The heading shadow uses the selected color and transparency without recoloring the text.",
        id: heroHeadingTargets.shadowColorOpacity,
        target: heroHeadingTargets.shadowColorOpacity,
        userAction: "Choose a different Heading Shadow color and opacity.",
      }),
      controlPartCoverage: ["colorOpacity.hex", "colorOpacity.opacity"],
    },
    {
      ...controlAcceptance({
        componentType: "vector",
        expectedObservable:
          "Changing either axis moves the V4 badge and both heading lines together while preserving the native reference's heading-above-gallery layer order.",
        id: heroHeadingTargets.position,
        target: heroHeadingTargets.position,
        userAction: "Move Position horizontally and vertically.",
      }),
      controlPartCoverage: ["vector.x", "vector.y"],
    },
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The Figma subtitle changes size while preserving its line-height and letter-spacing proportions.",
      id: heroHeadingSubtitleTargets.fontSize,
      target: heroHeadingSubtitleTargets.fontSize,
      userAction: "Drag the Hero Subtitle Font size slider.",
    }),
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The vertical distance between the hero heading and its Figma subtitle visibly changes.",
      id: heroHeadingSubtitleTargets.gap,
      target: heroHeadingSubtitleTargets.gap,
      userAction: "Drag the Hero Subtitle Gap slider.",
    }),
    controlAcceptance({
      componentType: "switch",
      expectedObservable:
        "The subtitle shadow appears or disappears without changing the heading, badge, or CTA shadows.",
      id: heroHeadingSubtitleTargets.shadowEnabled,
      target: heroHeadingSubtitleTargets.shadowEnabled,
      userAction: "Toggle Hero Subtitle Shadow.",
    }),
    {
      ...controlAcceptance({
        componentType: "vector",
        expectedObservable:
          "Changing either axis moves only the subtitle shadow around the Figma text.",
        id: heroHeadingSubtitleTargets.shadowOffset,
        target: heroHeadingSubtitleTargets.shadowOffset,
        userAction: "Move Hero Subtitle Shadow offset horizontally and vertically.",
      }),
      controlPartCoverage: ["vector.x", "vector.y"],
    },
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The subtitle shadow edge becomes sharper or softer without changing its spread.",
      id: heroHeadingSubtitleTargets.shadowBlur,
      target: heroHeadingSubtitleTargets.shadowBlur,
      userAction: "Drag Hero Subtitle Shadow blur.",
    }),
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The subtitle shadow contracts or expands around the text before blur is applied.",
      id: heroHeadingSubtitleTargets.shadowSpread,
      target: heroHeadingSubtitleTargets.shadowSpread,
      userAction: "Drag Hero Subtitle Shadow spread.",
    }),
    {
      ...controlAcceptance({
        componentType: "colorOpacity",
        expectedObservable:
          "The subtitle shadow uses the selected color and transparency without recoloring the white text.",
        id: heroHeadingSubtitleTargets.shadowColorOpacity,
        target: heroHeadingSubtitleTargets.shadowColorOpacity,
        userAction: "Choose a different Hero Subtitle Shadow color and opacity.",
      }),
      controlPartCoverage: ["colorOpacity.hex", "colorOpacity.opacity"],
    },
    controlAcceptance({
      componentType: "text",
      expectedObservable:
        "The CTA renders the entered one-line copy inside the Hero Heading group.",
      id: heroHeadingCtaTargets.text,
      target: heroHeadingCtaTargets.text,
      userAction: "Enter different CTA text.",
    }),
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The CTA label changes font size while its authored padding remains unchanged.",
      id: heroHeadingCtaTargets.fontSize,
      target: heroHeadingCtaTargets.fontSize,
      userAction: "Drag the CTA Font size slider.",
    }),
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The CTA grows or contracts equally on its left and right sides.",
      id: heroHeadingCtaTargets.horizontalPadding,
      target: heroHeadingCtaTargets.horizontalPadding,
      userAction: "Drag the CTA Side padding slider.",
    }),
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The CTA grows or contracts equally above and below its text.",
      id: heroHeadingCtaTargets.verticalPadding,
      target: heroHeadingCtaTargets.verticalPadding,
      userAction: "Drag the CTA Vertical padding slider.",
    }),
    controlAcceptance({
      componentType: "color",
      expectedObservable:
        "The CTA label uses the selected text color without recoloring the button fill.",
      id: heroHeadingCtaTargets.textColor,
      target: heroHeadingCtaTargets.textColor,
      userAction: "Choose a different CTA Text color.",
    }),
    controlAcceptance({
      componentType: "color",
      expectedObservable:
        "The CTA uses the selected button color without recoloring its label.",
      id: heroHeadingCtaTargets.backgroundColor,
      target: heroHeadingCtaTargets.backgroundColor,
      userAction: "Choose a different CTA Button color.",
    }),
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The vertical distance between the hero subtitle and CTA visibly changes.",
      id: heroHeadingCtaTargets.gap,
      target: heroHeadingCtaTargets.gap,
      userAction: "Drag the CTA Text gap slider.",
    }),
    controlAcceptance({
      componentType: "switch",
      expectedObservable:
        "The CTA shadow appears or disappears without changing the heading shadow.",
      id: heroHeadingCtaTargets.shadowEnabled,
      target: heroHeadingCtaTargets.shadowEnabled,
      userAction: "Toggle CTA Shadow.",
    }),
    {
      ...controlAcceptance({
        componentType: "vector",
        expectedObservable:
          "Changing either axis moves only the CTA shadow around the button.",
        id: heroHeadingCtaTargets.shadowOffset,
        target: heroHeadingCtaTargets.shadowOffset,
        userAction: "Move CTA Shadow offset horizontally and vertically.",
      }),
      controlPartCoverage: ["vector.x", "vector.y"],
    },
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The CTA shadow edge becomes sharper or softer without changing its spread.",
      id: heroHeadingCtaTargets.shadowBlur,
      target: heroHeadingCtaTargets.shadowBlur,
      userAction: "Drag CTA Shadow blur.",
    }),
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The CTA shadow contracts or expands around the button before blur is applied.",
      id: heroHeadingCtaTargets.shadowSpread,
      target: heroHeadingCtaTargets.shadowSpread,
      userAction: "Drag CTA Shadow spread.",
    }),
    {
      ...controlAcceptance({
        componentType: "colorOpacity",
        expectedObservable:
          "The CTA shadow uses the selected color and transparency without recoloring the button.",
        id: heroHeadingCtaTargets.shadowColorOpacity,
        target: heroHeadingCtaTargets.shadowColorOpacity,
        userAction: "Choose a different CTA Shadow color and opacity.",
      }),
      controlPartCoverage: ["colorOpacity.hex", "colorOpacity.opacity"],
    },
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The apparent near-edge enlargement of the mirrored roller geometry changes.",
      id: "scene.perspective",
      target: "scene.perspective",
      userAction: "Drag the Perspective slider.",
    }),
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "Neighboring cards change overlap or separation in both Rows and Sphere gallery modes.",
      id: "cards.gap",
      target: "cards.gap",
      userAction: "Drag the Gap slider.",
    }),
    {
      automated: true,
      automatedTestName:
        "gallery.images maps runtime media order and transforms into the website",
      browser: true,
      browserTestName:
        "browser: gallery images preserve upload order, aspect and transforms",
      componentType: "fileDrop",
      evidence: "media-lifecycle",
      expectedObservable:
        "Uploaded images replace authored portraits in media order, retain their aspect, and reflect reorder, rotate, flip, remove and reset operations in gallery output.",
      fixture: "Two small portrait and landscape PNG gallery fixtures",
      id: heroGalleryTargets.images,
      interactionId: "panel-gallery-images",
      kind: "control",
      mediaLifecycleCoverage: [
        "upload",
        "remove",
        "reset",
        "rotate",
        "flip",
        "transform-output",
        "reorder",
        "order-output",
      ],
      target: heroGalleryTargets.images,
      userAction:
        "Upload, reorder, rotate, flip, remove and reset gallery images.",
    },
    rowImagesAcceptance(heroGalleryTargets.rowImages0, 1),
    rowImagesAcceptance(heroGalleryTargets.rowImages1, 2),
    rowImagesAcceptance(heroGalleryTargets.rowImages2, 3),
    rowImagesAcceptance(heroGalleryTargets.rowImages3, 4),
    rowImagesAcceptance(heroGalleryTargets.rowImages4, 5),
    rowImagesAcceptance(heroGalleryTargets.rowImages5, 6),
    {
      ...controlAcceptance({
        componentType: "segmented",
        expectedObservable:
          "The website switches between two mirrored cylinder rows and one retained sphere canvas.",
        id: heroGalleryTargets.type,
        target: heroGalleryTargets.type,
        userAction: "Select Rows, then Sphere.",
      }),
      optionCoverage: ["rows", "sphere"],
    },
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "Every card in Rows or every panel row in Sphere changes height while width follows the image aspect.",
      id: heroGalleryTargets.cardHeight,
      target: heroGalleryTargets.cardHeight,
      userAction: "Drag Card height.",
    }),
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "Every card uses the selected corner radius in both Rows and Sphere gallery modes.",
      id: heroGalleryTargets.cardRadius,
      target: heroGalleryTargets.cardRadius,
      userAction: "Drag Card radius.",
    }),
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The innermost left and right cards move equally away from or toward the center, creating the selected full-width clear corridor.",
      id: "cards.safetyWidth",
      target: "cards.safetyWidth",
      userAction: "Edit the Safety width value and enter 1040px.",
    }),
    {
      ...controlAcceptance({
        componentType: "slider",
        expectedObservable:
          "Each mirrored row follows one continuous cylinder from its nearly flat center-facing tangent to the viewport edge, reaches the selected Roll there regardless of offscreen cards, and reveals additional outer cards on wider viewports without restarting curvature.",
        id: "cards.roll",
        target: "cards.roll",
        userAction: "Drag the Roll slider.",
      }),
      referenceCoverage: "control-mapping",
    },
    {
      ...controlAcceptance({
        componentType: "collectionActions",
        expectedObservable:
          "Adding or removing row records changes row count above the required Row 1, while Offset and Speed change the row signature and animated panel output. The first upload into an empty higher-numbered Row Images drop complementarily adds rows through that row. Remove Row hides the last extra row without clearing its drop assets or growing it back. While the retained drop stays nonempty, Add Row is the canonical reactivation path; alternatively, clearing it before uploading a new first image creates a fresh empty-to-nonempty activation transition.",
        id: heroGalleryTargets.sphereRows,
        target: heroGalleryTargets.sphereRows,
        userAction:
          "Add a row, edit its Offset and Speed, then remove it; with its retained Row Images drop still filled, verify it stays hidden and returns only through Add Row. Remove it again, clear that drop, then upload a new first image and verify the fresh empty-to-nonempty transition reactivates it.",
      }),
      controlPartCoverage: [
        "collectionActions.add",
        "collectionActions.items",
        "collectionActions.remove",
      ],
      interactionId: "panel-sphere-rows",
    },
    ...[
      [
        heroGalleryTargets.rowGap,
        "Row gap",
        "slider",
        "Rows spread apart or overlap vertically on the image panel before lens projection.",
      ],
      [
        heroGalleryTargets.sphereWidth,
        "Width",
        "slider",
        "The fixed lens changes horizontal bend and how much of every row fits the frame.",
      ],
      [
        heroGalleryTargets.sphereHeight,
        "Height",
        "slider",
        "The fixed lens changes how much of the row stack fits the frame and how quickly rows above and below the centre bend.",
      ],
      [
        heroGalleryTargets.sphereDepth,
        "Depth",
        "slider",
        "The shared rim depth changes the magnification available to both signed lens profiles while Width and Height keep their on-screen bend rates.",
      ],
      [
        heroGalleryTargets.sphereBendX,
        "Bend X",
        "slider",
        "Positive values bow every row's sides toward the viewer and enlarge them, negative values make the sides recede and shrink like a classic fisheye, and zero flattens the horizontal profile.",
      ],
      [
        heroGalleryTargets.sphereBendY,
        "Bend Y",
        "slider",
        "Positive values bend rows above and below the centre toward the viewer and enlarge them, negative values push them away, and zero leaves a vertical cylinder.",
      ],
    ].map(([target, label, componentType, expectedObservable]) =>
      controlAcceptance({
        componentType,
        expectedObservable,
        id: target,
        target,
        userAction: `Drag ${label}.`,
      }),
    ),
    {
      ...controlAcceptance({
        componentType: "switch",
        expectedObservable:
          "The Sphere periodically jumps to a different row and horizontal spot; disabling the switch immediately restores the authored pan with zero automatic offset.",
        id: heroGalleryTargets.autoScrollEnabled,
        target: heroGalleryTargets.autoScrollEnabled,
        userAction: "Toggle Auto scroll.",
      }),
      browserTestName: "browser: auto scroll jumps the Sphere to another spot",
    },
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The next autonomous Sphere jump starts after the selected pause from the previous jump's completion.",
      id: heroGalleryTargets.autoScrollInterval,
      target: heroGalleryTargets.autoScrollInterval,
      userAction: "Drag the Interval slider.",
    }),
    controlAcceptance({
      componentType: "slider",
      expectedObservable:
        "The autonomous Sphere jump uses the selected ease-out duration, changing how quickly the visible gallery reaches its next spot.",
      id: heroGalleryTargets.autoScrollDuration,
      target: heroGalleryTargets.autoScrollDuration,
      userAction: "Drag the Jump time slider.",
    }),
    {
      ...controlAcceptance({
        componentType: "vector",
        expectedObservable:
          "Both pad axes slide the image panel through the fixed lens; data-hero-gallery-pan mirrors the value and rows keep equal spacing.",
        id: heroGalleryTargets.pan,
        target: heroGalleryTargets.pan,
        userAction: "Move Pan horizontally and vertically.",
      }),
      controlPartCoverage: ["vector.x", "vector.y"],
      interactionId: "panel-sphere-pan",
    },
    {
      automated: true,
      automatedTestName:
        "sphere.pan.handle converts pointer deltas into wrapped pan values",
      browser: true,
      browserTestName:
        "browser: dragging the gallery pan handle slides the panel",
      canvasHandle: {
        exportCleanTestName: "export excludes the gallery pan handle",
        outputObservable:
          "The panel follows the pointer: rows slide along the lens and cycle vertically while the lens stays fixed.",
        testId: "hero-gallery-pan-handle",
        writesTarget: heroGalleryTargets.pan,
      },
      componentType: "canvas-handle",
      evidence: "product-output",
      expectedObservable:
        "The panel follows the pointer: rows slide along the lens and cycle vertically while the lens stays fixed.",
      fixture:
        "Sphere gallery with authored portraits, frozen motion and default pan",
      id: "sphere.pan.handle",
      interactionId: "canvas-sphere-pan",
      kind: "canvas-handle",
      userAction: "Drag the preview with the primary button.",
    },
    {
      ...controlAcceptance({
        componentType: "vector",
        expectedObservable:
          "Both axes move the complete Rows or Sphere gallery while the heading keeps its position.",
        id: heroGalleryTargets.position,
        target: heroGalleryTargets.position,
        userAction: "Move Gallery Placement horizontally and vertically.",
      }),
      controlPartCoverage: ["vector.x", "vector.y"],
    },
    ...[
      [
        heroDispersionTargets.edgeWidth,
        "Edge width",
        "slider",
        "Sphere's treated side bands follow lens-surface curved columns and use the value as their width at the equator; Rows retain their existing per-card viewport band behavior.",
      ],
      [
        heroDispersionTargets.curve,
        "Falloff",
        "slider",
        "The transition from clean inner pixels to the treated-zone boundary steepens or softens.",
      ],
      [
        heroDispersionTargets.edgeFade,
        "Edge fade",
        "slider",
        "Card pixels nearest the treated-zone boundary dissolve further into transparency.",
      ],
      [
        heroDispersionTargets.turbulence,
        "Turbulence",
        "slider",
        "The treated-zone halo changes between a smooth envelope and an organic ragged contour.",
      ],
      [
        heroDispersionTargets.turbulenceScale,
        "Turbulence size",
        "slider",
        "The ragged halo contour becomes coarser or tighter along the treated-zone boundary.",
      ],
      [
        heroDispersionTargets.warp,
        "Warp",
        "slider",
        "Pixels bend more or less inside the treated bands.",
      ],
      [
        heroDispersionTargets.warpStyle,
        "Style",
        "segmented",
        "Stretch produces a gradual barrel while Prism creates a refractive kink.",
      ],
      [
        heroDispersionTargets.warpOffset,
        "Offset",
        "slider",
        "The warp band moves inward from the treated-zone boundary.",
      ],
      [
        heroDispersionTargets.warpWaveEnabled,
        "Wave",
        "switch",
        "Wave distortion appears or disappears without changing the base warp.",
      ],
      [
        heroDispersionTargets.warpWaveKind,
        "Kind",
        "segmented",
        "The active wave switches between Glass refraction and Ripple displacement.",
      ],
      [
        heroDispersionTargets.warpWave,
        "Strength",
        "slider",
        "The selected wave lenses or shifts card pixels more or less.",
      ],
      [
        heroDispersionTargets.warpWaveLength,
        "Length",
        "slider",
        "The active wave changes between tighter and slower folds.",
      ],
      [
        heroDispersionTargets.warpWaveBlur,
        "Wave Blur",
        "slider",
        "The active wave pattern and card pixels soften inside its band.",
      ],
      [
        heroDispersionTargets.warpFace,
        "Face width",
        "slider",
        "The Prism face visibly thickens or thins.",
      ],
      [
        heroDispersionTargets.warpSharpness,
        "Sharpness",
        "slider",
        "The Prism kink concentrates or softens at its face.",
      ],
      [
        heroDispersionTargets.amount,
        "Dispersion",
        "slider",
        "The spectral smear widens only where content enters the treated bands.",
      ],
      [
        heroDispersionTargets.count,
        "Samples",
        "slider",
        "The bounded spectral loop changes the smoothness of the smear.",
      ],
      [
        heroDispersionTargets.spectrum,
        "Spectrum",
        "slider",
        "The smear changes between neutral and fully spectral color separation.",
      ],
      [
        heroDispersionTargets.hue,
        "Hue",
        "slider",
        "The generated spectrum rotates through visibly different colors.",
      ],
      [
        heroDispersionTargets.blur,
        "Blur",
        "slider",
        "Defocus strengthens toward the treated-zone boundary while inner card pixels remain sharp.",
      ],
      [
        heroDispersionTargets.aura,
        "Aura",
        "slider",
        "The spectral halo bleeding outside the treated band visibly changes strength.",
      ],
      [
        heroDispersionTargets.velocity,
        "Motion boost",
        "slider",
        "Moving card stacks produce a stronger or weaker transient streak that settles at rest.",
      ],
      [
        heroDispersionTargets.gateOffset,
        "Edge offset",
        "slider",
        "The boundary light band moves inward or outward from the treated-zone boundary.",
      ],
      [
        heroDispersionTargets.gateWidth,
        "Band width",
        "slider",
        "The stationary boundary light band widens or narrows.",
      ],
      [
        heroDispersionTargets.gateGlow,
        "Glow",
        "slider",
        "Card pixels flare brighter or dimmer while crossing the boundary band.",
      ],
      [
        heroDispersionTargets.gateRefraction,
        "Refraction",
        "slider",
        "Pixels bend more or less through the boundary glass ridge.",
      ],
  ].map(([target, label, componentType, expectedObservable]) => ({
      ...controlAcceptance({
        componentType,
        expectedObservable,
        id: target,
        target,
        userAction:
          componentType === "segmented"
            ? `Select the other ${label} option.`
            : componentType === "switch"
              ? `Toggle ${label}.`
              : `Drag the ${label} slider.`,
      }),
      ...(target === heroDispersionTargets.warpStyle
        ? { optionCoverage: ["stretch", "prism"] }
        : target === heroDispersionTargets.warpWaveKind
          ? { optionCoverage: ["glass", "ripple"] }
          : {}),
      ...(target === heroDispersionTargets.edgeWidth ||
      target === heroDispersionTargets.warp ||
      target === heroDispersionTargets.amount ||
      target === heroDispersionTargets.gateGlow
        ? { referenceCoverage: "control-mapping" as const }
      : {}),
  })),
  ...heroEffectsControlAcceptance,
  {
      actionCoverage: ["website.reset"],
      automated: true,
      automatedTestName:
        "Website actions expose local Reset without publication",
      browser: true,
      browserTestName:
        "browser: Reset restores native Hero defaults without publication",
      componentType: "panelActions",
      evidence: "command-side-effect",
      expectedObservable:
        "Reset restores the native Hero controls and default media without publication or a settings API.",
      fixture:
        "Standalone native Hero example",
      id: "website.settings",
      interactionId: "panel-website-settings-sync",
      kind: "control",
      target: "website.settings",
      userAction:
        "Edit the hero, then use the sticky Reset.",
    },
  ];
