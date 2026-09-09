# Fine Details Prompt Flight Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add visible Run and Reset actions to the Toolcraft Prompt Flight section. Run replays the current prompt-flight settings; Reset cancels the flight, removes ghosts, and restores the prompt to its base position without changing settings.

**Architecture:** Send nonce-bearing one-shot commands over the existing trusted Toolcraft-to-website preview channel. The website flight engine handles commands independently from persistent settings and Images mode transitions.

**Tech Stack:** React, TypeScript, postMessage protocol, Toolcraft schema/actions, focused Node/Vitest tests.

---

## Task 1: Add the v10 prompt-flight command protocol

- [x] Bump Fine Details preview messages from v9 to v10 on Toolcraft and website.
- [x] Add validated `prompt-flight-command` messages for `run` and `reset` with a nonblank bounded nonce.
- [x] Add focused protocol assertions for valid and invalid commands.

## Task 2: Execute Run and Reset in the website flight engine

- [x] Thread the latest validated command from the trusted preview boundary to `FineDetailsSection` and the prompt-flight hook.
- [x] Run: cancel the previous trajectory/ghosts and start a fresh outbound flight using current settings without changing Images mode.
- [x] Reset: flush/cancel current motion, remove ghosts, clear landing state, and snap the flight layer to base while preserving settings and authored drag state.
- [x] Cover command replay and reset semantics with focused helper/structure tests.

## Task 3: Add Toolcraft action buttons and command sender

- [x] Add a built-in actions row inside Prompt Flight with `Run` and `Reset`.
- [x] Register the active preview sender and route both actions through `handleFineDetailsPanelAction` without mutating controls or saving settings.
- [x] Report concise unavailable-preview feedback if a command cannot be delivered.
- [x] Add focused schema/action routing assertions.

## Task 4: Minimal verification and documentation

- [x] Format only touched website files and preserve existing Toolcraft formatting.
- [x] Run focused prompt-flight/protocol tests only.
- [x] Run scoped TypeScript compilation required by the touched boundary.
- [x] Update the implementation checkboxes and record verification limits; browser, build, delivery, performance, and broad suites were not run.

Verification note: Toolcraft focused prompt-flight/bridge tests pass 24/24 and Toolcraft typecheck passes. Website focused command coverage passes; one unrelated pre-existing drag-geometry assertion remains red, and website typecheck reports only existing missing-asset/dependency and unrelated baseline diagnostics.
