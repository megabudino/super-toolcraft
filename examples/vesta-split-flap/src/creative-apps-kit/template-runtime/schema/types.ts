import type {
  CreativeAppsKitControlLayoutGroupColumns,
  CreativeAppsKitControlLayoutGroupLayout,
  CreativeAppsKitSectionLayout,
} from "../contracts/types";

export type CreativeAppsKitCanvasSize = {
  height: number;
  unit: "px";
  width: number;
};

export type CreativeAppsKitCanvasSizeSource = "app" | "runtime-default";

export type CreativeAppsKitCanvasSizingMode =
  | "editable-output"
  | "fixed-output"
  | "intrinsic-media";

export type CreativeAppsKitCanvasSizingSchema = {
  mode: CreativeAppsKitCanvasSizingMode;
};

export type CreativeAppsKitPngExportBackground = "include" | "transparent";

export type CreativeAppsKitPngExportSchema = {
  background?: CreativeAppsKitPngExportBackground;
};

export type CreativeAppsKitExportSchema = {
  png?: CreativeAppsKitPngExportSchema;
};

export type ResolvedCreativeAppsKitExportSchema = {
  png: Required<CreativeAppsKitPngExportSchema>;
};

export type CreativeAppsKitAssemblyComponentId =
  | "canvas"
  | "controlsPanel"
  | "layersPanel"
  | "timelinePanel"
  | "toolbar";

export type CreativeAppsKitAssemblyCapability =
  | "canvas.draggable"
  | "canvas.editableSize"
  | "canvas.upload"
  | "controls.defaults"
  | "controls.panel"
  | "history.undoRedo"
  | "layers.groups"
  | "layers.panel"
  | "layers.selection"
  | "layers.visibility"
  | "panels.doubleClickReset"
  | "panels.draggable"
  | "panels.snap"
  | "timeline.duration"
  | "timeline.keyframes"
  | "timeline.panel"
  | "timeline.playback"
  | "toolbar.history"
  | "toolbar.radar"
  | "toolbar.theme"
  | "toolbar.zoom";

export type CreativeAppsKitAssemblyCommand =
  | "canvas.center"
  | "canvas.panBy"
  | "canvas.setOffset"
  | "canvas.setSize"
  | "canvas.setViewport"
  | "canvas.zoomIn"
  | "canvas.zoomOut"
  | "canvas.zoomReset"
  | "controls.apply"
  | "controls.reset"
  | "controls.setValue"
  | "history.redo"
  | "history.undo"
  | "layers.add"
  | "layers.delete"
  | "layers.moveToGroup"
  | "layers.rename"
  | "layers.reorder"
  | "layers.select"
  | "layers.toggleCollapsed"
  | "layers.toggleVisibility"
  | "media.delete"
  | "media.import"
  | "panels.resetOffset"
  | "panels.setOffset"
  | "timeline.changeKeyframeEasing"
  | "timeline.deleteControlKeyframes"
  | "timeline.deleteKeyframe"
  | "timeline.moveKeyframe"
  | "timeline.selectKeyframe"
  | "timeline.setCurrentTime"
  | "timeline.setDuration"
  | "timeline.setExpanded"
  | "timeline.setPlaying"
  | "timeline.toggleControlKeyframes"
  | "timeline.toggleExpanded"
  | "timeline.toggleLoop"
  | "timeline.togglePlayback";

export type CreativeAppsKitAssemblyPanelContract = {
  capabilities: readonly CreativeAppsKitAssemblyCapability[];
  commands: readonly CreativeAppsKitAssemblyCommand[];
  defaultPlacement: "bottom" | "left" | "right" | "top";
  dragMode: "handle" | "panel";
  enabled: boolean;
  requiredWrapper: "PanelHost";
  snapEdges: readonly ("bottom" | "left" | "right" | "top")[];
  visualComponent: string;
};

export type CreativeAppsKitAssemblyCanvasContract = {
  capabilities: readonly CreativeAppsKitAssemblyCapability[];
  commands: readonly CreativeAppsKitAssemblyCommand[];
  enabled: boolean;
  visualComponent: "CanvasShell";
};

export type CreativeAppsKitAssemblyContract = {
  capabilities: readonly CreativeAppsKitAssemblyCapability[];
  commands: readonly CreativeAppsKitAssemblyCommand[];
  components: readonly CreativeAppsKitAssemblyComponentId[];
  surfaces: {
    canvas: CreativeAppsKitAssemblyCanvasContract;
    panels: {
      controls?: CreativeAppsKitAssemblyPanelContract;
      layers?: CreativeAppsKitAssemblyPanelContract;
      timeline?: CreativeAppsKitAssemblyPanelContract;
      toolbar: CreativeAppsKitAssemblyPanelContract;
    };
  };
};

export type CreativeAppsKitCanvasSchema = {
  draggable?: boolean;
  enabled: boolean;
  size?: CreativeAppsKitCanvasSize;
  sizing?: CreativeAppsKitCanvasSizingSchema;
  upload?: boolean;
};

export type CreativeAppsKitToolbarSchema = {
  history?: boolean;
  radar?: boolean;
  theme?: boolean;
  zoom?: boolean;
};

export type CreativeAppsKitTimelineMode = "keyframes" | "playback";

export type CreativeAppsKitTimelinePanelSchema =
  | boolean
  | {
      enabled?: boolean;
      mode?: CreativeAppsKitTimelineMode;
    };

export type ResolvedCreativeAppsKitTimelinePanelSchema = {
  enabled: boolean;
  mode: CreativeAppsKitTimelineMode;
};

export type CreativeAppsKitPersistableStateSlice =
  | "canvas"
  | "layers"
  | "panels"
  | "timeline"
  | "values";

export type CreativeAppsKitNoPersistenceSchema = {
  storage?: "none";
};

export type CreativeAppsKitLocalStoragePersistenceSchema = {
  include: readonly CreativeAppsKitPersistableStateSlice[];
  key: `creative-apps-kit:${string}:state:v${number}`;
  storage: "localStorage";
  version: number;
};

export type CreativeAppsKitPersistenceSchema =
  | CreativeAppsKitNoPersistenceSchema
  | CreativeAppsKitLocalStoragePersistenceSchema;

export type ResolvedCreativeAppsKitPersistenceSchema =
  | { storage: "none" }
  | CreativeAppsKitLocalStoragePersistenceSchema;

export type CreativeAppsKitSettingsTransferMode = boolean | "auto";

export type CreativeAppsKitSettingsTransferObjectSchema = {
  appId?: string;
  enabled?: CreativeAppsKitSettingsTransferMode;
  fileName?: string;
};

export type CreativeAppsKitSettingsTransferSchema =
  | CreativeAppsKitSettingsTransferMode
  | CreativeAppsKitSettingsTransferObjectSchema;

export type ResolvedCreativeAppsKitSettingsTransferSchema = {
  appId: string;
  enabled: boolean;
  fileName: string;
  mode: CreativeAppsKitSettingsTransferMode;
};

export type CreativeAppsKitActionCommand = "controls.apply" | "controls.reset";

export type CreativeAppsKitActionSchema = {
  command?: CreativeAppsKitActionCommand;
  icon?:
    | "check"
    | "copy"
    | "download"
    | "eraser"
    | "export"
    | "rotate-ccw"
    | "shuffle"
    | "wand-sparkles";
  label?: string;
  value: string;
  variant?: "default" | "destructive" | "ghost" | "link" | "outline" | "secondary";
};

export type CreativeAppsKitImagePickerItemSchema = {
  alt?: string;
  src: string;
  value: string;
};

export type CreativeAppsKitControlOrderRole =
  | "action"
  | "advanced"
  | "color"
  | "detail"
  | "input"
  | "mode"
  | "primary"
  | "spatial"
  | "strength";

export type CreativeAppsKitControlPerformanceRole =
  | "responsiveness"
  | "workload";

export type CreativeAppsKitControlConditionSchema = {
  equals?: unknown;
  notEquals?: unknown;
  target: string;
};

export type CreativeAppsKitControlDisabledConditionSchema =
  CreativeAppsKitControlConditionSchema;

export type CreativeAppsKitColorOpacityValueSchema = {
  hex: string;
  opacity?: number;
};

export type CreativeAppsKitFontPickerValueSchema = {
  fontId: string;
  fontSize?: number;
  fontWeight?: string;
  letterSpacing?: "tight" | "tighter" | "normal" | "wide" | "wider" | "widest";
  lineHeight?: "loose" | "none" | "normal" | "relaxed" | "snug" | "tight";
};

export type CreativeAppsKitControlSchema = {
  accept?: string;
  actions?: readonly (CreativeAppsKitActionSchema | string)[];
  defaultValue?: unknown;
  disabled?: boolean;
  disabledWhen?: CreativeAppsKitControlDisabledConditionSchema;
  items?: readonly CreativeAppsKitImagePickerItemSchema[];
  keyframeable?: boolean;
  label?: boolean | string;
  markerCount?: number;
  max?: number;
  min?: number;
  orderRole?: CreativeAppsKitControlOrderRole;
  performanceReason?: string;
  performanceRole?: CreativeAppsKitControlPerformanceRole;
  options?: readonly { label: string; value: string }[];
  step?: number;
  target: string;
  type: string;
  unit?: string;
  valueLabel?: string;
  variant?: string;
  visibleWhen?: CreativeAppsKitControlConditionSchema;
  xLabel?: string;
  yLabel?: string;
};

export type CreativeAppsKitControlLayoutGroupSchema = {
  columns?: CreativeAppsKitControlLayoutGroupColumns;
  controls: readonly string[];
  layout: CreativeAppsKitControlLayoutGroupLayout;
};

export type CreativeAppsKitControlSectionSchema = {
  actionGroup?: "primary" | "secondary";
  controls: Record<string, CreativeAppsKitControlSchema>;
  layout?: CreativeAppsKitSectionLayout;
  layoutGroups?: readonly CreativeAppsKitControlLayoutGroupSchema[];
  title?: string;
  visibleWhen?: CreativeAppsKitControlConditionSchema;
};

export type CreativeAppsKitControlsPanelSchema = {
  sections: readonly CreativeAppsKitControlSectionSchema[];
  title: string;
};

export type CreativeAppsKitPanelsSchema = {
  controls?: CreativeAppsKitControlsPanelSchema;
  layers?: boolean;
  timeline?: CreativeAppsKitTimelinePanelSchema;
};

export type ResolvedCreativeAppsKitPanelsSchema = {
  controls?: CreativeAppsKitControlsPanelSchema;
  layers?: boolean;
  timeline?: ResolvedCreativeAppsKitTimelinePanelSchema;
};

export type CreativeAppsKitAppSchema = {
  canvas: CreativeAppsKitCanvasSchema;
  export?: CreativeAppsKitExportSchema;
  panels: CreativeAppsKitPanelsSchema;
  persistence?: CreativeAppsKitPersistenceSchema;
  settingsTransfer?: CreativeAppsKitSettingsTransferSchema;
  toolbar?: CreativeAppsKitToolbarSchema;
};

export type ResolvedCreativeAppsKitAppSchema = {
  assembly: CreativeAppsKitAssemblyContract;
  canvas: Required<CreativeAppsKitCanvasSchema> & {
    size: CreativeAppsKitCanvasSize;
    sizeSource: CreativeAppsKitCanvasSizeSource;
  };
  export: ResolvedCreativeAppsKitExportSchema;
  panels: ResolvedCreativeAppsKitPanelsSchema;
  persistence: ResolvedCreativeAppsKitPersistenceSchema;
  settingsTransfer: ResolvedCreativeAppsKitSettingsTransferSchema;
  toolbar: Required<CreativeAppsKitToolbarSchema>;
};
