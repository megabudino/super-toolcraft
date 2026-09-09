import { test } from "@playwright/test";

import { deriveToolcraftModelPerformancePaths } from "@/toolcraft/runtime";

import { appSchema } from "../src/app/app-schema";
import {
  createToolcraftModelCompatibilityFixtures,
  createToolcraftModelPressureFixture,
} from "./performance-model-import-fixtures";
import {
  importToolcraftModelFixture,
  measureToolcraftModelImport,
  measureToolcraftModelOrbit,
  measureToolcraftModelRepair,
  prepareToolcraftModelPerformancePage,
} from "./performance-model-import-helpers";

const modelPaths = deriveToolcraftModelPerformancePaths(appSchema);
const importPaths = modelPaths.filter((path) => path.kind === "import");

test.setTimeout(180_000);

for (const path of importPaths) {
  for (const { encoding, format } of createToolcraftModelCompatibilityFixtures(
    path.formats,
  )) {
    test(`browser perf: model ${path.target} imports ${format} ${encoding}`, async ({ page }) => {
      await prepareToolcraftModelPerformancePage(page, path.target);
      const fixture = createToolcraftModelCompatibilityFixtures(path.formats).find(
        (candidate) =>
          candidate.format === format && candidate.encoding === encoding,
      );
      if (!fixture) throw new Error(`Missing ${format} ${encoding} fixture.`);
      await measureToolcraftModelImport(page, path, fixture);
    });
  }
}

for (const path of modelPaths) {
  for (const dimension of path.dimensions) {
    test(`browser perf: model ${path.target} ${path.kind} ${dimension.id} at development pressure`, async ({ page }) => {
      await prepareToolcraftModelPerformancePage(page, path.target);
      const fixture = createToolcraftModelPressureFixture(path, dimension.id);

      if (path.kind === "import") {
        await measureToolcraftModelImport(page, path, fixture);
        return;
      }

      await importToolcraftModelFixture(page, path, fixture);
      if (path.kind === "analysis-repair") {
        await measureToolcraftModelRepair(page, path);
        return;
      }

      await measureToolcraftModelOrbit(page, path);
    });
  }
}
