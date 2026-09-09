import type {
  ToolcraftControlSectionSchema,
  ToolcraftFontPickerValueSchema,
} from "@/toolcraft/runtime";

export const heroPreviewTargets = {
  bodyTypography: "hero.body.typography",
  copyToLogos: "hero.layout.copyToLogos",
  headingTypography: "hero.heading.typography",
  leadTypography: "hero.lead.typography",
  logosToMedia: "hero.layout.logosToMedia",
  offsetY: "hero.rightLayout.offsetY",
  paragraphGap: "hero.rightLayout.paragraphGap",
  topInset: "hero.layout.topInset",
} as const;

const headingTypography = {
  color: "#040406",
  fontId: "figtree",
  fontSize: 102,
  fontWeight: "500",
  letterSpacing: "tight",
  lineHeight: "none",
  opacity: 100,
  textCase: "original",
} as const satisfies ToolcraftFontPickerValueSchema;

const leadTypography = {
  color: "#040406",
  fontId: "inter",
  fontSize: 30,
  fontWeight: "500",
  letterSpacing: "tight",
  lineHeight: "tight",
  opacity: 100,
  textCase: "original",
} as const satisfies ToolcraftFontPickerValueSchema;

const bodyTypography = {
  color: "#4B4B4E",
  fontId: "inter",
  fontSize: 26,
  fontWeight: "400",
  letterSpacing: "tight",
  lineHeight: "tight",
  opacity: 100,
  textCase: "original",
} as const satisfies ToolcraftFontPickerValueSchema;

export const heroPreviewDefaults = {
  bodyTypography,
  copyToLogos: 180,
  headingTypography,
  leadTypography,
  logosToMedia: 52,
  offsetY: 19.5,
  paragraphGap: 36,
  topInset: 220,
} as const;

const always = { mode: "always" } as const;
const nativeResponsivenessReason =
  "This value updates constant-size CSS state in the native preview preview without changing workload cardinality.";

export const heroPreviewControlSections = [
  {
    controls: {
      headingTypography: {
        applicability: always,
        defaultValue: heroPreviewDefaults.headingTypography,
        label: "Heading type",
        orderRole: "primary",
        performanceReason: nativeResponsivenessReason,
        performanceRole: "responsiveness",
        target: heroPreviewTargets.headingTypography,
        type: "fontPicker",
      },
    },
    id: "hero-heading",
    title: "Hero heading",
  },
  {
    controls: {
      topInset: {
        applicability: always,
        defaultValue: heroPreviewDefaults.topInset,
        label: "Top inset",
        max: 320,
        min: 0,
        orderRole: "spatial",
        performanceReason: nativeResponsivenessReason,
        performanceRole: "responsiveness",
        sliderValueKind: "continuous",
        step: 4,
        target: heroPreviewTargets.topInset,
        type: "slider",
        unit: "px",
      },
      copyToLogos: {
        applicability: always,
        defaultValue: heroPreviewDefaults.copyToLogos,
        label: "Copy to logos",
        max: 480,
        min: 0,
        orderRole: "spatial",
        performanceReason: nativeResponsivenessReason,
        performanceRole: "responsiveness",
        sliderValueKind: "continuous",
        step: 4,
        target: heroPreviewTargets.copyToLogos,
        type: "slider",
        unit: "px",
      },
      logosToMedia: {
        applicability: always,
        defaultValue: heroPreviewDefaults.logosToMedia,
        label: "Logos to media",
        max: 240,
        min: 0,
        orderRole: "spatial",
        performanceReason: nativeResponsivenessReason,
        performanceRole: "responsiveness",
        sliderValueKind: "continuous",
        step: 4,
        target: heroPreviewTargets.logosToMedia,
        type: "slider",
        unit: "px",
      },
    },
    id: "hero-spacing",
    title: "Hero spacing",
  },
  {
    controls: {
      leadTypography: {
        applicability: always,
        defaultValue: heroPreviewDefaults.leadTypography,
        label: "Lead type",
        orderRole: "primary",
        performanceReason: nativeResponsivenessReason,
        performanceRole: "responsiveness",
        target: heroPreviewTargets.leadTypography,
        type: "fontPicker",
      },
    },
    id: "right-lead",
    title: "Right lead",
  },
  {
    controls: {
      bodyTypography: {
        applicability: always,
        defaultValue: heroPreviewDefaults.bodyTypography,
        label: "Body type",
        orderRole: "detail",
        performanceReason: nativeResponsivenessReason,
        performanceRole: "responsiveness",
        target: heroPreviewTargets.bodyTypography,
        type: "fontPicker",
      },
    },
    id: "right-body",
    title: "Right body",
  },
  {
    controls: {
      offsetY: {
        applicability: always,
        defaultValue: heroPreviewDefaults.offsetY,
        label: "Block offset Y",
        max: 240,
        min: -120,
        orderRole: "spatial",
        performanceReason: nativeResponsivenessReason,
        performanceRole: "responsiveness",
        sliderValueKind: "continuous",
        step: 0.5,
        target: heroPreviewTargets.offsetY,
        type: "slider",
        unit: "px",
      },
      paragraphGap: {
        applicability: always,
        defaultValue: heroPreviewDefaults.paragraphGap,
        label: "Paragraph gap",
        max: 160,
        min: 0,
        orderRole: "spatial",
        performanceReason: nativeResponsivenessReason,
        performanceRole: "responsiveness",
        sliderValueKind: "continuous",
        step: 1,
        target: heroPreviewTargets.paragraphGap,
        type: "slider",
        unit: "px",
      },
    },
    id: "right-copy-layout",
    title: "Right copy layout",
  },
] as const satisfies readonly ToolcraftControlSectionSchema[];
