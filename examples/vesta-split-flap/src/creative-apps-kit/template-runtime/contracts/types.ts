export type CreativeAppsKitContractKind =
  | "canvas"
  | "command"
  | "composition"
  | "control"
  | "panel"
  | "persistence"
  | "settings"
  | "toolbar";

export type CreativeAppsKitStateMode = "command-only" | "controlled" | "runtime-owned";

export type CreativeAppsKitSectionLayout = "grouped" | "standalone";

export type CreativeAppsKitControlLayoutGroupColumns = 2;

export type CreativeAppsKitControlLayoutGroupLayout = "inline";

export type CreativeAppsKitLabelPolicy = "component-owned" | "hidden" | "optional" | "required";

export type CreativeAppsKitPanelPlacement = "bottom" | "left" | "right" | "top";

export type CreativeAppsKitPanelSnapEdge = "bottom" | "left" | "right" | "top";

export type CreativeAppsKitComponentContract = {
  aiUsageRules?: readonly string[];
  capabilities?: readonly string[];
  commands?: readonly string[];
  defaultPlacement?: CreativeAppsKitPanelPlacement;
  defaultSectionLayout?: CreativeAppsKitSectionLayout;
  historyPolicy?: "never" | "optional" | "patch";
  id: string;
  kind: CreativeAppsKitContractKind;
  labelPolicy?: CreativeAppsKitLabelPolicy;
  requiredWrapper?: "PanelHost";
  schemaType?: string;
  snapEdges?: readonly CreativeAppsKitPanelSnapEdge[];
  stateMode: CreativeAppsKitStateMode;
  visualComponent: string;
};
