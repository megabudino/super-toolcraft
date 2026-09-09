import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";
import { heroBackgroundPatternTargets } from "./hero-background-pattern-values";
import { heroDispersionTargets } from "./hero-dispersion-values";
import { heroEffectsTargets } from "./hero-effects-values";
import {
  heroGalleryMediaTargets,
  heroGalleryTargets,
} from "./hero-gallery-values";
import { heroHeadingTargets } from "./hero-heading-values";
import { heroHeadingCtaTargets } from "./hero-heading-cta-values";
import { heroHeadingSubtitleTargets } from "./hero-heading-subtitle-values";

export const HERO_DISPERSION_CONTROL_DRAG_TARGETS = [
  heroDispersionTargets.edgeWidth,
  heroDispersionTargets.curve,
  heroDispersionTargets.edgeFade,
  heroDispersionTargets.turbulence,
  heroDispersionTargets.turbulenceScale,
  heroDispersionTargets.warp,
  heroDispersionTargets.warpOffset,
  heroDispersionTargets.warpWave,
  heroDispersionTargets.warpWaveLength,
  heroDispersionTargets.warpWaveBlur,
  heroDispersionTargets.warpFace,
  heroDispersionTargets.warpSharpness,
  heroDispersionTargets.amount,
  heroDispersionTargets.count,
  heroDispersionTargets.spectrum,
  heroDispersionTargets.hue,
  heroDispersionTargets.blur,
  heroDispersionTargets.aura,
  heroDispersionTargets.velocity,
  heroDispersionTargets.gateOffset,
  heroDispersionTargets.gateWidth,
  heroDispersionTargets.gateGlow,
  heroDispersionTargets.gateRefraction,
] as const;

export const HERO_DISPERSION_CONTROL_CHANGE_TARGETS = [
  heroDispersionTargets.warpStyle,
  heroDispersionTargets.warpWaveEnabled,
  heroDispersionTargets.warpWaveKind,
] as const;

export const HERO_PREVIEW_CONTROL_DRAG_TARGETS = [
  "scene.perspective",
  "cards.gap",
  heroGalleryTargets.cardHeight,
  heroGalleryTargets.cardRadius,
  "cards.roll",
  "cards.safetyWidth",
  heroGalleryTargets.sphereRows,
  heroGalleryTargets.rowGap,
  heroGalleryTargets.sphereWidth,
  heroGalleryTargets.sphereHeight,
  heroGalleryTargets.sphereDepth,
  heroGalleryTargets.sphereBendX,
  heroGalleryTargets.sphereBendY,
  heroGalleryTargets.autoScrollInterval,
  heroGalleryTargets.autoScrollDuration,
  heroGalleryTargets.pan,
  heroGalleryTargets.position,
  heroHeadingTargets.badgeGap,
  heroHeadingTargets.badgeScale,
  heroHeadingTargets.badgeShadowBlur,
  heroHeadingTargets.badgeShadowOffset,
  heroHeadingTargets.badgeShadowSpread,
  heroHeadingTargets.lineGap,
  heroHeadingTargets.shadowBlur,
  heroHeadingTargets.shadowOffset,
  heroHeadingTargets.shadowSpread,
  heroHeadingTargets.position,
  heroHeadingTargets.recraftSize,
  heroHeadingTargets.stylesSize,
  heroHeadingCtaTargets.fontSize,
  heroHeadingCtaTargets.gap,
  heroHeadingCtaTargets.horizontalPadding,
  heroHeadingCtaTargets.shadowBlur,
  heroHeadingCtaTargets.shadowOffset,
  heroHeadingCtaTargets.shadowSpread,
  heroHeadingCtaTargets.verticalPadding,
  heroHeadingSubtitleTargets.fontSize,
  heroHeadingSubtitleTargets.gap,
  heroHeadingSubtitleTargets.shadowBlur,
  heroHeadingSubtitleTargets.shadowOffset,
  heroHeadingSubtitleTargets.shadowSpread,
  heroBackgroundPatternTargets.squareSize,
  heroEffectsTargets.grainAmount,
  heroEffectsTargets.grainSize,
  heroEffectsTargets.crtScanlines,
  heroEffectsTargets.crtPitch,
  heroEffectsTargets.crtChroma,
  heroEffectsTargets.crtFlicker,
  heroEffectsTargets.crtFade,
  ...HERO_DISPERSION_CONTROL_DRAG_TARGETS,
] as const;

export const HERO_PREVIEW_CONTROL_CHANGE_TARGETS = [
  "export.includeBackground",
  "appearance.background",
  heroGalleryTargets.type,
  heroGalleryTargets.autoScrollEnabled,
  heroBackgroundPatternTargets.colorOpacity,
  heroBackgroundPatternTargets.enabled,
  heroEffectsTargets.grainEnabled,
  heroEffectsTargets.crtEnabled,
  heroHeadingTargets.badgeVisible,
  heroHeadingTargets.badgeColor,
  heroHeadingTargets.badgeShadowColorOpacity,
  heroHeadingTargets.badgeShadowEnabled,
  heroHeadingTargets.color,
  heroHeadingTargets.shadowColorOpacity,
  heroHeadingTargets.shadowEnabled,
  heroHeadingCtaTargets.backgroundColor,
  heroHeadingCtaTargets.shadowColorOpacity,
  heroHeadingCtaTargets.shadowEnabled,
  heroHeadingCtaTargets.text,
  heroHeadingCtaTargets.textColor,
  heroHeadingSubtitleTargets.shadowColorOpacity,
  heroHeadingSubtitleTargets.shadowEnabled,
  ...HERO_DISPERSION_CONTROL_CHANGE_TARGETS,
] as const;

type HeroPreviewPipelinePasses = {
  "media-sync": ToolcraftRendererPipelinePassContract<void>;
  "preview-sync": ToolcraftRendererPipelinePassContract<void>;
};

export const heroPreviewPipelineRegistration =
  registerToolcraftRendererPipeline<HeroPreviewPipelinePasses>()({
    interactionInvalidation: [
      {
        interaction: "initial-render",
        invalidates: ["preview-sync"],
        targets: ["canvas.initial-render"],
      },
      {
        interaction: "control-drag",
        invalidates: ["preview-sync"],
        targets: HERO_PREVIEW_CONTROL_DRAG_TARGETS,
      },
      {
        interaction: "control-change",
        invalidates: ["preview-sync"],
        targets: HERO_PREVIEW_CONTROL_CHANGE_TARGETS,
      },
      {
        interaction: "media-import",
        invalidates: ["media-sync", "preview-sync"],
        targets: heroGalleryMediaTargets,
      },
      {
        interaction: "viewport-drag",
        invalidates: [],
        mustNotInvalidate: ["media-sync", "preview-sync"],
        targets: ["canvas.viewport"],
      },
      {
        interaction: "viewport-zoom",
        invalidates: [],
        mustNotInvalidate: ["media-sync", "preview-sync"],
        targets: ["canvas.viewport"],
      },
    ],
    passes: [
      {
        cost: {
          dimensions: [],
          frequency: "discrete",
          relationship: "constant",
        },
        id: "media-sync",
        inputs: [
          ...heroGalleryMediaTargets,
          "runtime-owned binary presentation URLs for the bounded hero gallery image set",
        ],
        invalidatedBy: heroGalleryMediaTargets,
        kind: "preprocess",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "source",
        quality: "full",
        runsOn: "main",
      },
      {
        cost: {
          dimensions: ["edge-blur-radius", "lens-samples"],
          frequency: "interaction",
          relationship: "product",
        },
        id: "preview-sync",
        inputs: [
          ...HERO_PREVIEW_CONTROL_DRAG_TARGETS,
          ...HERO_PREVIEW_CONTROL_CHANGE_TARGETS,
          "website-owned mirrored rows or retained panel-through-lens WebGL output with a signed bowl/ball profile; Sphere composites one scene buffer through one lens-surface dispersion post pass",
        ],
        invalidatedBy: [
          ...HERO_PREVIEW_CONTROL_DRAG_TARGETS,
          ...HERO_PREVIEW_CONTROL_CHANGE_TARGETS,
        ],
        kind: "composite",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "preview",
        quality: "full",
        runsOn: "main",
      },
    ],
    runtimeId: "hero-native-preview-v23",
  });

export const heroPreviewMediaPass =
  heroPreviewPipelineRegistration.getPass("media-sync");

export const heroPreviewSyncPass =
  heroPreviewPipelineRegistration.getPass("preview-sync");
