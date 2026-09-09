import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  collectToolcraftProductVerificationSources,
  readToolcraftVerificationImpactInventory,
  validateToolcraftVerificationImpactInventory,
} from "./toolcraft-verification-impact.mjs";

const catalog = {
  acceptance: [
    {
      acceptanceId: "appearance.background",
      file: "e2e/app-controls.spec.ts",
      testName: "browser: background",
    },
    {
      acceptanceId: "persistence.reload",
      file: "e2e/app-controls.spec.ts",
      testName: "browser: persistence",
    },
  ],
  performance: [
    {
      passIds: ["preview-composite"],
      pathId:
        "performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22preview-composite%22%5D%2C%5B%22main%22%5D%2C%5B%5D%5D",
      testName:
        "browser perf: toolcraft path performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22preview-composite%22%5D%2C%5B%22main%22%5D%2C%5B%5D%5D",
    },
  ],
  version: 1,
};
const productPaths = [
  "src/app/app-schema.ts",
  "src/features/product-output.tsx",
];
const validInventory = {
  owners: [
    {
      acceptanceIds: ["persistence.reload"],
      kind: "functional",
      path: "src/app/app-schema.ts",
    },
    {
      acceptanceIds: ["appearance.background"],
      kind: "performance",
      passIds: ["preview-composite"],
      path: "src/features/product-output.tsx",
    },
  ],
  version: 2,
};
const resourceCatalog = {
  acceptance: [
    {
      acceptanceId: "appearance.background",
      file: "e2e/app-controls.spec.ts",
      testName: "browser: background",
    },
  ],
  performance: [],
  version: 1,
};
const resourceModuleOwner = {
  acceptanceIds: ["appearance.background"],
  kind: "functional",
  path: "src/app/app-schema.ts",
};

test("collects canonical required product modules and known product resources", async (t) => {
  const rootDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "toolcraft-product-verification-sources-"),
  );
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const files = {
    "e2e/app-controls.spec.ts": "export const acceptance = true;\n",
    "e2e/framework-helper.ts": "export const helper = true;\n",
    "public/product-pulse.svg":
      "<svg xmlns=\"http://www.w3.org/2000/svg\"/>\n",
    "public/product-pulse.custom-resource": "product pulse\n",
    "src/app/app-schema.ts": "export const schema = true;\n",
    "src/app/internal-framework.ts": "export const internal = true;\n",
    "src/features/product-output.tsx": "export const output = null;\n",
    "src/features/product.css": ".product { color: white; }\n",
    "src/toolcraft/runtime.ts": "export const runtime = true;\n",
  };
  for (const [relativePath, source] of Object.entries(files)) {
    const filePath = path.join(rootDir, relativePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, source);
  }
  const localPolicyPath = path.join(
    rootDir,
    "scripts",
    "toolcraft-source-ownership.mjs",
  );
  await fs.mkdir(path.dirname(localPolicyPath), { recursive: true });
  try {
    await fs.symlink(
      fileURLToPath(
        new URL("./toolcraft-source-ownership.mjs", import.meta.url),
      ),
      localPolicyPath,
    );
  } catch (error) {
    if (["EACCES", "ENOSYS", "EPERM"].includes(error?.code)) {
      t.skip(`symbolic links are unavailable: ${error.code}`);
      return;
    }
    throw error;
  }

  const result = await collectToolcraftProductVerificationSources(rootDir);
  const entries = new Map(
    result.sourceInventory.entries.map((entry) => [entry.repoPath, entry]),
  );

  assert.deepEqual(Object.keys(result).sort(), [
    "knownProductResourcePaths",
    "requiredProductModulePaths",
    "sourceInventory",
  ]);
  assert.deepEqual(result.requiredProductModulePaths, [
    "src/app/app-schema.ts",
    "src/features/product-output.tsx",
  ]);
  assert.deepEqual(result.knownProductResourcePaths, [
    "public/product-pulse.custom-resource",
    "public/product-pulse.svg",
    "src/features/product.css",
  ]);
  assert.equal(entries.get("src/app/app-schema.ts")?.owner, "product");
  assert.equal(entries.get("src/app/internal-framework.ts")?.owner, "platform");
  assert.equal(entries.get("src/toolcraft/runtime.ts")?.owner, "framework");
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.requiredProductModulePaths), true);
  assert.equal(Object.isFrozen(result.knownProductResourcePaths), true);
});

test("accepts a live public presentation resource owner", () => {
  const resourceOwner = {
    acceptanceIds: ["appearance.background"],
    kind: "presentation",
    path: "public/product-pulse.svg",
  };
  const result = validateToolcraftVerificationImpactInventory(
    {
      owners: [resourceModuleOwner, resourceOwner],
      version: 2,
    },
    {
      catalog: resourceCatalog,
      requiredProductModulePaths: ["src/app/app-schema.ts"],
      knownProductResourcePaths: [
        "public/product-pulse.svg",
        "public/unowned-texture.svg",
      ],
    },
  );

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.inventory?.owners, [resourceOwner, resourceModuleOwner]);
});

test("rejects an owner for an unknown or deleted product resource", () => {
  const result = validateToolcraftVerificationImpactInventory(
    {
      owners: [
        resourceModuleOwner,
        {
          acceptanceIds: ["appearance.background"],
          kind: "presentation",
          path: "public/dead-pulse.svg",
        },
      ],
      version: 2,
    },
    {
      catalog: resourceCatalog,
      requiredProductModulePaths: ["src/app/app-schema.ts"],
      knownProductResourcePaths: ["public/product-pulse.svg"],
    },
  );

  assert.match(
    result.errors.join("\n"),
    /public\/dead-pulse\.svg.*not a current product production module or resource/iu,
  );
});

test("does not require every live product resource to declare an owner", () => {
  const result = validateToolcraftVerificationImpactInventory(
    {
      owners: [resourceModuleOwner],
      version: 2,
    },
    {
      catalog: resourceCatalog,
      requiredProductModulePaths: ["src/app/app-schema.ts"],
      knownProductResourcePaths: [
        "public/product-pulse.svg",
        "public/unowned-texture.svg",
      ],
    },
  );

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.inventory?.owners, [resourceModuleOwner]);
});

test("validates, sorts, and deeply freezes complete verification ownership", () => {
  const result = validateToolcraftVerificationImpactInventory(
    {
      owners: [...validInventory.owners].reverse(),
      version: 2,
    },
    { catalog, requiredProductModulePaths: [...productPaths].reverse() },
  );

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.inventory, validInventory);
  assert.equal(Object.isFrozen(result.inventory), true);
  assert.equal(Object.isFrozen(result.inventory.owners), true);
  assert.equal(Object.isFrozen(result.inventory.owners[0]), true);
  assert.equal(Object.isFrozen(result.inventory.owners[0].acceptanceIds), true);
  assert.equal(Object.isFrozen(result.inventory.owners[1].passIds), true);
});

test("normalizes unsorted acceptance and pass ids without weakening uniqueness", () => {
  const twoPassPath =
    "performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22preview-composite%22%2C%22source-decode%22%5D%2C%5B%22main%22%5D%2C%5B%5D%5D";
  const sortingCatalog = {
    acceptance: catalog.acceptance,
    performance: [
      {
        passIds: ["preview-composite", "source-decode"],
        pathId: twoPassPath,
        testName: `browser perf: toolcraft path ${twoPassPath}`,
      },
    ],
    version: 1,
  };
  const result = validateToolcraftVerificationImpactInventory(
    {
      owners: [
        {
          acceptanceIds: ["persistence.reload"],
          kind: "functional",
          path: "src/app/app-schema.ts",
        },
        {
          acceptanceIds: ["persistence.reload", "appearance.background"],
          kind: "performance",
          passIds: ["source-decode", "preview-composite"],
          path: "src/features/product-output.tsx",
        },
      ],
      version: 2,
    },
    { catalog: sortingCatalog, requiredProductModulePaths: productPaths },
  );

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.inventory, {
    owners: [
      {
        acceptanceIds: ["persistence.reload"],
        kind: "functional",
        path: "src/app/app-schema.ts",
      },
      {
        acceptanceIds: ["appearance.background", "persistence.reload"],
        kind: "performance",
        passIds: ["preview-composite", "source-decode"],
        path: "src/features/product-output.tsx",
      },
    ],
    version: 2,
  });
  assert.equal(Object.isFrozen(result.inventory.owners[1].acceptanceIds), true);
  assert.equal(Object.isFrozen(result.inventory.owners[1].passIds), true);
});

test("rejects missing, stale, duplicate paths and stale acceptance or pass ids", () => {
  const result = validateToolcraftVerificationImpactInventory(
    {
      owners: [
        {
          acceptanceIds: ["missing.acceptance"],
          kind: "functional",
          path: "src/app/app-schema.ts",
        },
        {
          acceptanceIds: ["persistence.reload"],
          kind: "functional",
          path: "src/app/app-schema.ts",
        },
        {
          acceptanceIds: ["appearance.background"],
          kind: "performance",
          passIds: ["missing-pass"],
          path: "src/app/stale.ts",
        },
      ],
      version: 2,
    },
    { catalog, requiredProductModulePaths: productPaths },
  );

  const errors = result.errors.join("\n");
  assert.match(errors, /path "src\/app\/app-schema\.ts" must be unique/iu);
  assert.match(errors, /product-output\.tsx.*missing/iu);
  assert.match(errors, /stale\.ts.*not a current/iu);
  assert.match(errors, /unknown acceptance id "missing\.acceptance"/iu);
  assert.match(errors, /unknown renderer pass "missing-pass"/iu);
  assert.match(errors, /acceptance id "appearance\.background" has no product/iu);
  assert.match(errors, /renderer pass "preview-composite" has no product/iu);
});

test("rejects malformed ownership, empty arrays, and duplicate owners", () => {
  const result = validateToolcraftVerificationImpactInventory(
    {
      owners: [
        {
          acceptanceIds: [],
          kind: "presentation",
          path: "src/app/app-schema.ts",
        },
        {
          acceptanceIds: ["appearance.background"],
          kind: "performance",
          passIds: [],
          path: "src/features/product-output.tsx",
        },
      ],
      version: 2,
    },
    { catalog, requiredProductModulePaths: productPaths },
  );

  assert.match(result.errors.join("\n"), /acceptanceIds.*at least one/iu);
  assert.match(result.errors.join("\n"), /passIds.*at least one/iu);
});

test("rejects blanket every-module ownership of every acceptance and pass", () => {
  const owner = (ownerPath) => ({
    acceptanceIds: ["appearance.background", "persistence.reload"],
    kind: "performance",
    passIds: ["preview-composite"],
    path: ownerPath,
  });
  const result = validateToolcraftVerificationImpactInventory(
    { owners: productPaths.map(owner), version: 2 },
    { catalog, requiredProductModulePaths: productPaths },
  );

  assert.match(result.errors.join("\n"), /ownership is overbroad/iu);
});

test("reads only the new app or neutral starter filename without old fallback", async (t) => {
  const rootDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "toolcraft-verification-impact-"),
  );
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await fs.mkdir(path.join(rootDir, "src/app"), { recursive: true });
  await fs.writeFile(
    path.join(rootDir, "src/app/app-performance-impact.json"),
    JSON.stringify(validInventory),
  );
  await assert.rejects(
    readToolcraftVerificationImpactInventory(rootDir, {
      catalog,
      requiredProductModulePaths: productPaths,
    }),
    /ENOENT/u,
  );

  await fs.writeFile(
    path.join(rootDir, "src/app/starter-verification-impact.json"),
    JSON.stringify(validInventory),
  );
  const loaded = await readToolcraftVerificationImpactInventory(rootDir, {
    catalog,
    requiredProductModulePaths: productPaths,
  });
  assert.equal(
    loaded.path,
    path.join(rootDir, "src/app/starter-verification-impact.json"),
  );
  assert.equal(Object.isFrozen(loaded), true);
});
