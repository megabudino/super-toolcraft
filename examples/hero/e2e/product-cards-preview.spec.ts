import { registerHeroPreviewControlTests } from "./hero-preview-browser-helpers";

registerHeroPreviewControlTests([
  { acceptanceId: "cards.gap", action: "slider" },
  { acceptanceId: "cards.height", action: "slider" },
  { acceptanceId: "cards.radius", action: "slider" },
  { acceptanceId: "cards.roll", action: "slider" },
  { acceptanceId: "sphere.rowGap", action: "slider" },
  { acceptanceId: "sphere.width", action: "slider" },
  { acceptanceId: "sphere.height", action: "slider" },
  { acceptanceId: "sphere.depth", action: "slider" },
  { acceptanceId: "sphere.bendX", action: "slider" },
  { acceptanceId: "sphere.bendY", action: "slider" },
  {
    acceptanceId: "cards.safetyWidth",
    action: "numeric-input",
    value: "1040",
  },
]);
