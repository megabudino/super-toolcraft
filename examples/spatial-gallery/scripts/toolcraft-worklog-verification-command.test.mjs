import assert from "node:assert/strict";
import test from "node:test";

import {
  parseToolcraftWorklogVerificationCommand,
} from "./toolcraft-worklog-verification-command.mjs";

const performanceCommand =
  'pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test="browser perf: control-drag:composite"';

test("parses one strict performance iteration command through canonical delivery arguments", () => {
  assert.deepEqual(parseToolcraftWorklogVerificationCommand(performanceCommand), {
    kind: "delivery",
    requestedReason: "performance-iteration",
    targetedArguments: [
      "--tier=3",
      "--performance-test=browser perf: control-drag:composite",
    ],
  });

  for (const command of [
    performanceCommand.replace("pnpm ", "pnpm run "),
    performanceCommand.replace("pnpm ", "npm run "),
    `\`${performanceCommand}\`.`,
  ]) {
    assert.deepEqual(
      parseToolcraftWorklogVerificationCommand(command),
      parseToolcraftWorklogVerificationCommand(performanceCommand),
    );
  }
});

test("classifies the single public full operator command without granting delivery authority", () => {
  for (const packageManager of [
    "pnpm",
    "pnpm run",
    "npm run",
    "pnpm --dir .",
    "pnpm -C .",
    "pnpm -s",
    "npm --prefix . run",
    "/opt/homebrew/bin/pnpm",
  ]) {
    assert.deepEqual(
      parseToolcraftWorklogVerificationCommand(`${packageManager} verify:perf`),
      { kind: "full-performance", script: "verify:perf" },
    );
  }
});

test("supports bounded benign options in direct package-script invocations", () => {
  for (const [command, script] of [
    ["pnpm run --silent verify:perf", "verify:perf"],
    ["pnpm run --if-present verify:perf", "verify:perf"],
    ["pnpm --silent run verify:perf", "verify:perf"],
    ["npm run --silent verify:perf", "verify:perf"],
    ["npm --silent run verify:perf", "verify:perf"],
  ]) {
    assert.deepEqual(parseToolcraftWorklogVerificationCommand(command), {
      kind: "full-performance",
      script,
    });
  }
});

test("keeps the targeted compatibility command outside full certification authority", () => {
  assert.deepEqual(
    parseToolcraftWorklogVerificationCommand(
      "pnpm verify:perf:record-iteration -- --tier=3",
    ),
    { kind: "other" },
  );
});

test("leaves plain unrelated commands outside worklog authority", () => {
  for (const command of [
    "echo diagnostic",
    "rg documentation docs",
    'node -e "console.log(\'diagnostic\')"',
    "pnpm test",
  ]) {
    assert.deepEqual(parseToolcraftWorklogVerificationCommand(command), {
      kind: "other",
    });
  }
});

test("rejects command wrappers before performance classification", () => {
  for (const command of [
    'sh -c "pnpm verify:perf"',
    'bash -lc "pnpm run verify:perf"',
    "pnpm exec pnpm verify:perf",
    "npm exec pnpm verify:perf",
    "env pnpm verify:perf",
    "TOOLCRAFT_MODE=full pnpm verify:perf",
    "corepack pnpm verify:perf",
    "npx pnpm verify:perf",
    "node scripts/run-browser-performance.mjs",
    "node --trace-warnings scripts/run-browser-performance.mjs",
    "node -- scripts/run-browser-performance.mjs",
    "env -i node scripts/run-browser-performance.mjs",
    "(pnpm verify:perf)",
    "eval 'pnpm verify:perf'",
    "pnpm verify\\:perf",
    "echo verify:perf",
    "rg verify:perf docs",
    'node -e "console.log(\'verify:perf\')"',
  ]) {
    assert.throws(
      () => parseToolcraftWorklogVerificationCommand(command),
      /shell|unsupported/iu,
    );
  }
});

test("rejects unrecognized package-manager option shapes around authority", () => {
  for (const command of [
    "pnpm --filter app verify:perf",
    "pnpm --workspace-root verify:perf",
    "npm --workspace app run verify:perf",
  ]) {
    assert.throws(
      () => parseToolcraftWorklogVerificationCommand(command),
      /unsupported package-script invocation/iu,
    );
  }
});

test("keeps protected script words literal inside a valid targeted selector", () => {
  assert.deepEqual(
    parseToolcraftWorklogVerificationCommand(
      'pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test="verify:perf authority remains isolated"',
    ),
    {
      kind: "delivery",
      requestedReason: "performance-iteration",
      targetedArguments: [
        "--tier=3",
        "--performance-test=verify:perf authority remains isolated",
      ],
    },
  );
});

test("rejects shell composition and malformed tokenization", () => {
  for (const command of [
    `${performanceCommand} && pnpm verify:perf`,
    `${performanceCommand}; pnpm verify:perf`,
    `${performanceCommand} | tee result.txt`,
    `${performanceCommand} > result.txt`,
    'pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test="browser perf: unfinished',
    'pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test="   "',
    "pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test=''",
  ]) {
    assert.throws(
      () => parseToolcraftWorklogVerificationCommand(command),
      /malformed|shell|empty|whitespace|quote/iu,
    );
  }
});

test("delegates duplicate and unsupported delivery argv to the canonical parser", () => {
  assert.throws(
    () =>
      parseToolcraftWorklogVerificationCommand(
        "pnpm verify:delivery -- --reason=performance-iteration --reason=performance-iteration --tier=3 --performance-test=one",
      ),
    /accepts one --reason/iu,
  );
  assert.throws(
    () =>
      parseToolcraftWorklogVerificationCommand(
        "pnpm verify:delivery -- --reason=performance-iteration --tier=3 --unknown=value --performance-test=one",
      ),
    /unsupported Toolcraft delivery argument/iu,
  );
});

test("rejects every shell expansion form in delivery authority", () => {
  for (const selector of [
    "$TEST",
    "${TEST}",
    "$(printf test)",
    "`printf test`",
    "browser\\ perf",
    "'$TEST'",
  ]) {
    assert.throws(
      () =>
        parseToolcraftWorklogVerificationCommand(
          `pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test=${selector}`,
        ),
      /shell expansion/iu,
    );
  }

});

test("leaves unrelated executed commands outside performance authority", () => {
  assert.deepEqual(parseToolcraftWorklogVerificationCommand("pnpm test"), {
    kind: "other",
  });
});

test("rejects shell composition when any segment invokes protected authority", () => {
  for (const command of [
    "pnpm test && pnpm run verify:perf",
    "pnpm test || pnpm run verify:perf",
    "pnpm test; pnpm run verify:perf",
    "pnpm test | pnpm run verify:perf",
  ]) {
    assert.throws(
      () => parseToolcraftWorklogVerificationCommand(command),
      /malformed|shell|quote/iu,
    );
  }
});

test("rejects shell grammar in every executed verification entry", () => {
  for (const command of [
    "pnpm test > result.txt",
    "pnpm test < input.txt",
    "echo $HOME",
    'echo "unfinished',
  ]) {
    assert.throws(
      () => parseToolcraftWorklogVerificationCommand(command),
      /malformed|shell|quote/iu,
    );
  }
});
