# Styles Ultra Italic and Heading Color Design

## Goal

Render only the `STYLES` line with the user-supplied `ABC Gravity Wide Trial Ultra Italic` face, self-host that exact face as WOFF2, and let the Hero Heading section set one shared color for the `RECRAFT` and `STYLES` text.

## Font asset

The supplied source is `/Users/kusnizza/Desktop/ABCGravityWideTrial-UltraItalic.otf`. It is a valid OpenType font whose metadata identifies `ABC Gravity Wide Trial Ultra Italic`. Convert the complete font to WOFF2 with FontTools in a temporary isolated Python environment; do not subset glyphs and do not add FontTools to either project's dependencies. Commit only the generated `abc-gravity-wide-trial-ultra-italic.woff2` under `recraft-v4-styles/src/fonts/abc-gravity`.

Add a provenance entry to `sources.json` using the generated filename, detected family/style/weight, a user-supplied source marker, and the generated WOFF2 SHA-256. Register the WOFF2 once in `theme-fonts.ts` with `next/font/local`, expose its CSS variable through the existing body-level font-variable class, and map a dedicated Tailwind font alias in `globals.css`. The `STYLES` span receives that alias and italic style; `RECRAFT` keeps the existing Expanded face.

## Heading color

Add `heading.color` to the existing Hero Heading value module with default `#D8FB5B`, the hex equivalent of the current primary lime. Expose one built-in `color` control labeled `Text color` in the existing Hero Heading section. A general `fontPicker` is not used because the two line families are intentionally fixed, the existing independent line-size controls must remain independent, and exposing family, weight, case, opacity, tracking, and line-height would broaden the requested surface.

The color is shared by both title lines and does not recolor the `V4` badge. It participates in runtime reset, persistence, history, settings transfer, the preview-sync `control-change` path, and acceptance coverage like the existing heading fields.

## Preview protocol and website renderer

Bump the iframe protocol to version 7. Add the color to `HeroPreviewSettings.heading`, validate it when values are converted to a message, and add the same field/default/normalization to the website `HeroSceneSettings`. The website supplies a `--hero-heading-color` property to the heading group, removes the old `text-primary` utility from the `<h1>`, and applies the variable to the title text while the badge keeps its explicit gray color.

## Alternatives rejected

- Reusing the existing `abc-gravity-wide-italic.woff2` because its binary and family metadata differ from the exact user-supplied Ultra Italic face.
- Shipping OTF directly because the user explicitly requires WOFF2 and the existing project font inventory uses web-compressed assets.
- Registering the font inside `HeroV4Styles` because the project centralizes all `next/font` calls in `theme-fonts.ts`.
- Separate colors for the two lines because the user confirmed one shared heading color.

## Verification

Verify the converted WOFF2 can be reopened by FontTools and preserves the source font's names, glyph count, and weight. Run the focused Toolcraft preview-mapping test, both project typechecks, formatting on touched website files, and `git diff --check`. Broad browser, delivery, build, and measured-performance suites remain outside this focused later edit.

## Risks

ABC Gravity is commercial. The user supplied the font and requested project inclusion; repository owners remain responsible for ensuring their license permits redistribution and self-hosting. WOFF2 conversion changes the container/compression, not the outlines or licensing terms.
