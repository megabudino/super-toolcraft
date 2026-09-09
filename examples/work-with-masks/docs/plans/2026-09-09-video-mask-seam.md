# Video mask seam correction

- Request: «чини», following the confirmed one-pixel video/mask seam diagnosis.
- Scope: Native Toolcraft hero on port 3005; later focused CSS fix.
- Source: Full-width video is hidden at the sides by white reveal masks whose top/bottom previously coincided exactly with the video edge. The supplied crop shows a one-pixel row leaking through that boundary; the live scene currently has a fractional video top of 701.6875px at 25% zoom/DPR 2.
- Change: Extend the existing masks two scene pixels above and below the video with `inset-block: -2px` in `src/section/components/pages/home/hero-video-reveal.module.css`. Preserve the video rectangle, horizontal reveal motion, mask widths and corner radius values.
- Preflight: Systematic-debugging and writing-plans skills; existing workflow, runtime boundary, renderer, component and verification documents read earlier in this conversation; decision-contract reread for this fix. No new schema or renderer work.
- Focused verification: Compare the same region in the embedded browser before/after; confirm masks overlap the video vertically and video geometry stays fixed. Run existing `pnpm exec vitest run src/app/hero-website-preview.test.tsx` only. Add the result to the editable worklog.
- Skip: Broad tests, build, delivery/performance gates, new tests mirroring the CSS, control resets and unrelated wave/zoom changes, per the user's minimal-check preference.
