import { describe, expect, it } from "vitest";

import {
  clearPerformanceSignalError,
  createPerformanceIterationWorklogFixture,
} from "./app-acceptance.worklog-performance-intent-test-utils";
import {
  createAgentWorklogFixture,
  getAgentWorklogValidationErrors,
} from "./app-acceptance.worklog-test-utils";

describe("starter acceptance worklog performance intent", () => {
  it("requires exactly one performance intent in every decision-trail iteration", () => {
    const missing = createAgentWorklogFixture({
      omitDecisionTrailFields: ["Performance intent"],
    });
    const duplicate = createAgentWorklogFixture().replace(
      "- Performance intent: ordinary-product-work",
      "- Performance intent: ordinary-product-work\n- Performance intent: ordinary-product-work",
    );

    expect(getAgentWorklogValidationErrors(missing)).toContain(
      'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" must include exactly one "Performance intent:".',
    );
    expect(getAgentWorklogValidationErrors(duplicate)).toContain(
      'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" must include exactly one "Performance intent:".',
    );
  });

  it("requires exactly one performance delivery command per complaint", () => {
    const command =
      '- Run: pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test="browser perf: control-drag:composite"';
    const worklog = createPerformanceIterationWorklogFixture({
      request: "The app lags while dragging.",
      verificationLines: [command, command],
    });

    expect(getAgentWorklogValidationErrors(worklog)).toContain(
      'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" must include exactly one performance-iteration delivery command.',
    );
  });

  it("accepts only canonical ordinary or concrete performance iteration intent", () => {
    const unknown = createAgentWorklogFixture({
      trailFields: { "Performance intent": "full-performance" },
    });
    const missingSignal = createAgentWorklogFixture({
      trailFields: { "Performance intent": "performance-iteration" },
    });
    const vagueSignal = createAgentWorklogFixture({
      trailFields: {
        "Performance intent": "performance-iteration — user requested work",
      },
    });
    const iteration = createPerformanceIterationWorklogFixture({
      evidence: "The canvas is delayed and unresponsive.",
      request: "Please fix this. The canvas is delayed and unresponsive.",
    });

    expect(getAgentWorklogValidationErrors(unknown)).toContain(
      'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" has an unknown Performance intent.',
    );
    expect(getAgentWorklogValidationErrors(missingSignal)).toContain(
      'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" performance-iteration must use \'Request evidence: "<verbatim request quote>"\' after an em dash.',
    );
    expect(getAgentWorklogValidationErrors(vagueSignal)).toContain(
      'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" performance-iteration must use \'Request evidence: "<verbatim request quote>"\' after an em dash.',
    );
    expect(getAgentWorklogValidationErrors(iteration)).toEqual([]);
  });

  it.each([
    ["Build a poster.", 'performance-iteration — Request evidence: "It lags."'],
    [
      "The app lags.",
      'performance-iteration — Request evidence: "The app freezes."',
    ],
    [
      "THE APP LAGS.",
      'performance-iteration — Request evidence: "The app lags."',
    ],
    [
      "The app lags. Increase animation speed.",
      'performance-iteration — Request evidence: "Increase animation speed."',
    ],
    [
      "Increase animation speed.",
      'performance-iteration — Request evidence: "Increase animation speed."',
    ],
  ])("rejects iteration authority not proven by Request: %s", (request, intent) => {
    const worklog = createAgentWorklogFixture({
      trailFields: {
        "Performance intent": intent,
        Request: request,
        Verification:
          'pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test="browser perf: control-drag:composite".',
      },
      verificationLines: [
        '- Run: pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test="browser perf: control-drag:composite"',
      ],
    });

    expect(getAgentWorklogValidationErrors(worklog)).not.toEqual([]);
  });

  it("accepts exact ambiguous Request evidence under agent semantic judgment", () => {
    const worklog = createPerformanceIterationWorklogFixture({
      request: "The controls feel sticky.",
    });

    expect(getAgentWorklogValidationErrors(worklog)).toEqual([]);
  });

  it("does not force an ambiguous Request out of ordinary agent judgment", () => {
    const worklog = createAgentWorklogFixture({
      trailFields: { Request: "The controls feel sticky." },
    });

    expect(getAgentWorklogValidationErrors(worklog)).toEqual([]);
  });

  it("accepts ordinary narrative verification that cites the protected delivery command", () => {
    const worklog = createAgentWorklogFixture({
      trailFields: {
        Verification:
          "Focused checks passed during development and one protected `pnpm verify:delivery` result covered the coherent delivery batch.",
      },
    });

    expect(getAgentWorklogValidationErrors(worklog)).toEqual([]);
  });

  it.each([
    "The app is not slow or unresponsive.",
    "The app isn’t slow or unresponsive.",
    "The app does not lag and does not freeze.",
    "No lag and no freezing.",
    "Приложение не тормозит и не зависает.",
    "Нет лагов и нет зависаний.",
  ])("keeps coordinated performance negation ordinary: %s", (request) => {
    expect(
      getAgentWorklogValidationErrors(
        createAgentWorklogFixture({ trailFields: { Request: request } }),
      ),
    ).toEqual([]);
  });

  it.each([
    "The app does not lag but it freezes.",
    "The app is not slow, but the editor hangs.",
    "Приложение не тормозит, но редактор зависает.",
  ])("still requires performance iteration intent for an independent complaint: %s", (request) => {
    expect(
      getAgentWorklogValidationErrors(
        createAgentWorklogFixture({ trailFields: { Request: request } }),
      ),
    ).toContain(clearPerformanceSignalError);
  });

  it("maps clear semantic user performance requests to one performance iteration", () => {
    const signals = [
      "Improve application performance under normal use.",
      "Optimize performance and fix the performance regression.",
      "Optimise application responsiveness and reduce hanging.",
      "Optimize the runtime so interactions execute faster.",
      "Speed up rendering because the preview is slow.",
      "Reduce input latency and delayed control updates.",
      "Controls have poor responsiveness and input is delayed.",
      "Fix the unresponsive canvas and restore responsiveness.",
      "The app is laggy, janky, and stutters.",
      "The preview freezes, stays frozen, and sometimes hangs.",
      "Fix low FPS and unstable frame rate.",
      "The app hangs and frame rate is low.",
      "Reduce high CPU, GPU, memory, and resource use.",
      "Исправить проблемы с перфом и производительностью приложения.",
      "Производительность приложения плохая и нужна оптимизация производительности.",
      "Оптимизировать и ускорить медленный рендер.",
      "Уменьшить задержку и улучшить отклик интерфейса.",
      "Интерфейс должен работать быстрее и быть отзывчивее.",
      "Приложение лагает, тормозит, фризит, зависает и работает рывками.",
      "Исправить низкий фпс, частоту кадров, расход памяти и процессора/GPU.",
    ];

    for (const signal of signals) {
      const ordinary = createAgentWorklogFixture({
        trailFields: { Request: signal },
      });
      const iteration = createPerformanceIterationWorklogFixture({ request: signal });

      expect(
        getAgentWorklogValidationErrors(ordinary),
        `ordinary intent should reject: ${signal}`,
      ).toContain(clearPerformanceSignalError);
      expect(
        getAgentWorklogValidationErrors(iteration),
        `performance iteration should accept: ${signal}`,
      ).toEqual([]);
    }
  });

  it("keeps non-performance uses of similar words as ordinary product work", () => {
    const ordinaryRequests = [
      "Rename the preset to Frozen and the mode to Performance.",
      "Make the animation play faster and add a Slow timing option.",
      "Make the canvas animation play faster.",
      "Increase animation speed.",
      "Move the object faster.",
      "Сделай анимацию канваса быстрее.",
      "Увеличь скорость анимации.",
      "Пусть объект двигается быстрее.",
      "Smooth the gradient and optimize its color-stop distribution.",
      "Add CPU, GPU, and Memory labels to the hardware legend.",
      "Назвать пресеты Быстрый, Медленный и Фриз.",
      "Сделать плавный градиент и добавить подпись Память.",
    ];

    for (const request of ordinaryRequests) {
      expect(
        getAgentWorklogValidationErrors(
          createAgentWorklogFixture({ trailFields: { Request: request } }),
        ),
        `ordinary product wording should stay ordinary: ${request}`,
      ).toEqual([]);
    }
  });

  it("accepts a targeted performance iteration through the same delivery boundary", () => {
    const worklog = createPerformanceIterationWorklogFixture({
      decisions: {
        Performance: {
          decision: "Measure one affected performance path through protected delivery.",
          evidence:
            'pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test="browser perf: control-drag:composite".',
          reason: "The user reported a performance problem.",
        },
      },
      request: "Please optimize application performance.",
    });

    expect(getAgentWorklogValidationErrors(worklog)).toEqual([]);
  });

  it("rejects a performance complaint paired with ordinary verification", () => {
    const worklog = createAgentWorklogFixture({
      trailFields: { Request: "The app lags while dragging." },
    });

    expect(getAgentWorklogValidationErrors(worklog)).toContain(
      clearPerformanceSignalError,
    );
  });

  it("rejects the full operator command in the Decision Trail Verification field", () => {
    const worklog = createAgentWorklogFixture({
      trailFields: { Verification: "pnpm run verify:perf." },
    });

    expect(getAgentWorklogValidationErrors(worklog)).toContain(
      'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" cannot use request wording or worklog evidence to authorize full performance certification.',
    );
  });

  it.each([
    [
      "missing selector",
      "pnpm verify:delivery -- --reason=performance-iteration --tier=3",
    ],
    [
      "inadequate tier",
      'pnpm verify:delivery -- --reason=performance-iteration --tier=2 --performance-test="browser perf: control-drag:composite"',
    ],
    [
      "invalid tier",
      'pnpm verify:delivery -- --reason=performance-iteration --tier=fast --performance-test="browser perf: control-drag:composite"',
    ],
  ])("rejects performance iteration verification with %s", (_case, command) => {
    const worklog = createPerformanceIterationWorklogFixture({
      request: "The app lags while dragging.",
      trailFields: { Verification: `${command}.` },
      verificationLines: [`- Run: ${command}`],
    });

    expect(getAgentWorklogValidationErrors(worklog)).not.toEqual([]);
  });

  it("does not let request wording select or claim full certification", () => {
    const worklog = createAgentWorklogFixture({
      trailFields: {
        "Performance intent":
          'full-performance-certification — Request evidence: "Run a full performance certification."',
        Request: "Run a full performance certification.",
        Verification: "pnpm verify:perf.",
      },
      verificationLines: ["- Run: pnpm verify:perf"],
    });

    expect(getAgentWorklogValidationErrors(worklog)).toContain(
      'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" has an unknown Performance intent.',
    );
  });

  it("rejects an operator certification command as conversational worklog authority", () => {
    const worklog = createAgentWorklogFixture({
      trailFields: {
        Request: "Run a full performance certification.",
        Verification: "pnpm verify:delivery; pnpm verify:perf.",
      },
      verificationLines: [
        "- Run: pnpm verify:delivery",
        "- Run: pnpm verify:perf",
      ],
    });

    expect(getAgentWorklogValidationErrors(worklog)).toContain(
      'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" cannot use request wording or worklog evidence to authorize full performance certification.',
    );
  });

  it("rejects the removed explicit performance worklog authority", () => {
    const worklog = createAgentWorklogFixture({
      trailFields: {
        "Performance intent":
          'explicit-performance-work — Request evidence: "The app lags."',
        Request: "The app lags.",
        Verification:
          "pnpm verify:delivery -- --reason=explicit-performance-work.",
      },
      verificationLines: [
        "- Run: pnpm verify:delivery -- --reason=explicit-performance-work",
      ],
    });

    expect(getAgentWorklogValidationErrors(worklog)).toContain(
      'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" has an unknown Performance intent.',
    );
  });

  it.each([
    ["duplicate", "The app lags while dragging."],
    ["conflicting", "A different request."],
  ])("rejects %s Request fields on an authority-bearing iteration", (_case, extra) => {
    const worklog = createPerformanceIterationWorklogFixture({
      request: "The app lags while dragging.",
    }).replace(
      "- Request: The app lags while dragging.",
      `- Request: The app lags while dragging.\n- Request: ${extra}`,
    );

    expect(getAgentWorklogValidationErrors(worklog)).toContain(
      'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" must include exactly one "Request:" before performance authority can be evaluated.',
    );
  });

  it("rejects duplicate Request text for ordinary work before classification", () => {
    const worklog = createAgentWorklogFixture().replace(
      "- Request: Build a still vector poster app.",
      "- Request: Build a still vector poster app.\n- Request: Record the same ordinary product context.",
    );

    expect(getAgentWorklogValidationErrors(worklog)).toContain(
      'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" must include exactly one "Request:" before performance authority can be evaluated.',
    );
  });

  it("rejects an ordinary first Request followed by a performance complaint", () => {
    const worklog = createAgentWorklogFixture().replace(
      "- Request: Build a still vector poster app.",
      "- Request: Build a still vector poster app.\n- Request: The canvas lags while dragging.",
    );

    expect(getAgentWorklogValidationErrors(worklog)).toContain(
      'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" must include exactly one "Request:" before performance authority can be evaluated.',
    );
  });

  it("requires one Request when an ordinary iteration executes performance authority", () => {
    const command =
      'pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test="browser perf: control-drag:composite"';
    const worklog = createAgentWorklogFixture({
      trailFields: { Verification: command },
      verificationLines: [`- Run: ${command}`],
    }).replace(
      "- Request: Build a still vector poster app.",
      "- Request: Build a still vector poster app.\n- Request: A conflicting performance request.",
    );

    expect(getAgentWorklogValidationErrors(worklog)).toContain(
      'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" must include exactly one "Request:" before performance authority can be evaluated.',
    );
  });
});
