import importedDefaultSettings from "./default-settings.snapshot.json" with {
  type: "json",
};

export const defaultMicrographicsValues = {
  "composition.count": importedDefaultSettings.values["composition.count"],
  "composition.kit": importedDefaultSettings.values["composition.kit"],
  "composition.layout": importedDefaultSettings.values["composition.layout"],
  "composition.seed": importedDefaultSettings.values["composition.seed"],
  "elements.scale": importedDefaultSettings.values["elements.scale"],
  "source.preset": importedDefaultSettings.values["source.preset"],
} as const;
