import { describe, expect, it } from "vitest";
import { appSchema } from "./app-schema";

describe("Studio Room gallery deployment", () => {
  it("keeps settings transfer without Apply or artifact export actions", () => {
    const controls = appSchema.panels.controls?.sections.flatMap(
      (section) => Object.values(section.controls),
    ) ?? [];
    expect(controls.some((control) => control.type === "settingsTransfer")).toBe(true);
    expect(controls.filter((control) => control.type === "panelActions")).toEqual([]);
    expect(appSchema.settingsTransfer.enabled).toBe(true);
    expect(appSchema.identity).toMatchObject({ id: "studio-room", title: "Recraft Studio Room" });
  });
});
