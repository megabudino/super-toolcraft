# Hero Pan Marker Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Remove the visible Pan crosshair while preserving full-canvas gallery dragging.

**Architecture:** Keep `HeroGalleryPanHandle` as the interaction owner and remove only its decorative SVG presentation. Delete marker-only position calculations and CSS so no dead presentation code remains.

**Tech Stack:** React 19, TypeScript, CSS Modules.

---

### Task 1: Remove the decorative marker

**Files:**
- Modify: `recraft-tools/hero/src/app/hero-gallery-pan-handle.tsx`
- Modify: `recraft-tools/hero/src/app/hero-preview.module.css`

- [x] Remove `PanHandleStyle`, the gallery-position read, marker CSS variables, and the SVG child.
- [x] Preserve the parent overlay, Pan target, pointer capture, drag calculations, history grouping, accessibility label, test id, and cursor state.
- [x] Remove the now-unused `.panPin` rule.
- [x] Review the edited source only; do not run verification commands and do not commit or push.
