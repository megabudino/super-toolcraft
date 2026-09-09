import assert from "node:assert/strict";
import test from "node:test";

import {
  createToolcraftPerformanceRequestAuthority,
} from "./toolcraft-performance-request-authority.mjs";

const command =
  'pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test="browser perf: control-drag:composite"';

function createWorklog({
  evidence = "The canvas lags while dragging.",
  heading = "Delivery 1 - Product build",
  request = "The canvas lags while dragging.",
  runs = [command],
  verification = command,
} = {}) {
  return `# Worklog

## Decision Trail

### ${heading}
- Request: ${request}
- Performance intent: performance-iteration — Request evidence: "${evidence}"
- Verification: ${verification}.

## Verification
${runs.map((run) => `- Run: ${run}`).join("\n")}
`;
}

test("binds one executed performance iteration to its latest request evidence", () => {
  const first = createToolcraftPerformanceRequestAuthority(createWorklog());
  const second = createToolcraftPerformanceRequestAuthority(createWorklog());

  assert.match(first.hash, /^[a-f0-9]{64}$/u);
  assert.equal(first.hash, second.hash);
  assert.equal(first.heading, "Delivery 1 - Product build");
  assert.equal(first.request, "The canvas lags while dragging.");
  assert.equal(first.requestEvidence, "The canvas lags while dragging.");
});

test("changes authority when the user request evidence changes", () => {
  const first = createToolcraftPerformanceRequestAuthority(createWorklog());
  const second = createToolcraftPerformanceRequestAuthority(
    createWorklog({
      evidence: "The export now freezes.",
      request: "The export now freezes.",
    }),
  );

  assert.notEqual(first.hash, second.hash);
});

test("treats a repeated complaint in a new Decision Trail iteration as new authority", () => {
  const first = createToolcraftPerformanceRequestAuthority(createWorklog());
  const second = createToolcraftPerformanceRequestAuthority(
    createWorklog({ heading: "Delivery 2 - Repeated performance complaint" }),
  );

  assert.notEqual(first.hash, second.hash);
});

test("rejects duplicate executions of one complaint", () => {
  assert.throws(
    () =>
      createToolcraftPerformanceRequestAuthority(
        createWorklog({ runs: [command, command] }),
      ),
    /exactly one matching executed performance-iteration command/iu,
  );
});

test("rejects a command that differs from the Decision Trail", () => {
  assert.throws(
    () =>
      createToolcraftPerformanceRequestAuthority(
        createWorklog({
          runs: [
            'pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test="browser perf: viewport-zoom:composite"',
          ],
        }),
      ),
    /exactly one matching executed performance-iteration command/iu,
  );
});

test("requires the latest Decision Trail entry to own the performance request", () => {
  const worklog = createWorklog().replace(
    "\n## Verification",
    `
### Delivery 2 - Copy update
- Request: Rename the title.
- Performance intent: ordinary-product-work
- Verification: pnpm verify:delivery.

## Verification`,
  );

  assert.throws(
    () => createToolcraftPerformanceRequestAuthority(worklog),
    /latest Decision Trail iteration must declare performance-iteration/iu,
  );
});
