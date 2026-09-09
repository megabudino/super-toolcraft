import { describe, expect, it } from "vitest";
import {
  defineToolcraft,
  type ToolcraftAppSchema,
} from "@/toolcraft/runtime";

import {
  defineContractSchemaFixture,
  validateContractAcceptance,
} from "./app-acceptance.contract-fixtures";

const schema = {
  canvas: { enabled: true },
  panels: {
    controls: {
      sections: [],
      title: "Controls",
    },
  },
} satisfies ToolcraftAppSchema;

describe("Toolcraft acceptance contract schema fixtures", () => {
  it("opts unrelated unit fixtures out without changing the production default", () => {
    const productionDefault = defineToolcraft(schema);
    const contractFixture = defineContractSchemaFixture(schema);

    expect(productionDefault.persistence.storage).toBe("localStorage");
    expect(contractFixture.persistence).toEqual({
      storage: "none",
    });
    expect(
      validateContractAcceptance({ acceptance: [], schema: productionDefault }),
    ).toContain(
      'persistence.storage "localStorage" requires a runtime acceptance entry with persistenceCoverage "reload" proving user-edited persisted state restores after a real browser reload. Settings import/export is not a substitute for persistence.',
    );
    expect(
      validateContractAcceptance({ acceptance: [], schema: contractFixture }),
    ).toEqual([]);
  });
});
