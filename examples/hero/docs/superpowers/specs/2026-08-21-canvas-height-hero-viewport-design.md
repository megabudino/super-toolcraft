# Canvas Height Hero Viewport Design

## Goal

Make the existing runtime-owned `Canvas height` setting control the visible height of the Recraft hero screen, with the announcement ticker always occupying the bottom edge of that screen.

## Current behavior

Toolcraft already renders the website iframe at the finite canvas dimensions, so changing `canvas.size.height` resizes the iframe. The website hero does not always follow that viewport because it adds `min-h-160` and `max-h-[63.5rem]` around `h-[calc(100svh-4rem)]`. Tall canvases leave content below the hero, while short canvases can crop a hero held above the available height.

## Design

Keep `canvas.size.height` as the only height owner. Do not add a product control or a new preview-protocol field. The website hero will use exactly the iframe viewport height remaining below the fixed 4rem site header: `height: calc(100svh - 4rem)`. Remove the hero's minimum and maximum height constraints.

The hero remains a two-row grid: the flexible visual area is the first row and the existing 5rem announcement ticker is the second row. Because the section exactly fills the available viewport, the ticker remains attached to its bottom edge for every valid canvas height.

## Alternatives rejected

- Sending `canvas.size.height` through the iframe protocol duplicates a dimension that the browser already exposes through the iframe viewport and risks drift between DOM size and payload.
- Scaling a fixed 1080px hero preserves neither readable typography nor the meaning of a visible-height control.
- Moving the ticker to `position: absolute` is unnecessary and would require reserving overlap space manually; the current grid already expresses the intended layout.

## Data flow

`Canvas height` → Toolcraft finite canvas size → iframe element height → iframe `100svh` → hero height minus the 4rem header → grid ticker at the final 5rem row.

## Verification

Use a focused source-level product test for the responsive height contract, website typecheck, Toolcraft typecheck, and `git diff --check`. Do not run broad browser, delivery, build, or performance suites.

## Risks

Very small canvas heights can leave little or no room for the flexible hero-content row after the 4rem header and 5rem ticker. The ticker still remains inside the hero grid; this change intentionally avoids inventing a second minimum that would break the requested height ownership.
