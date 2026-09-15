# Neon Globe Website Module

The website module contains the globe only. It does not load React, the Toolcraft
editor, fonts, a UI framework, external logo files, or remote services. The four
logos and the Three.js math used for projection are bundled. The editor and the
module use the same drawing functions and motion curve. The website's initial
composition is the supplied settings snapshot, not a live read of editor storage.

## Build

Run `npm run build:embed`. Deliver `dist-embed/` to the website team. Its ESM entry
is `neon-globe.js`, with TypeScript declarations in `neon-globe.d.ts`. Serve the
directory over HTTP to view `index.html`; module scripts do not work from a
double-clicked `file://` URL. Keep `THREE-LICENSE.txt` with the distribution.

## Plain JavaScript

```html
<div id="globe" style="position: relative; width: 100%; height: 600px;"></div>
<script type="module">
  import { createNeonGlobe } from '/assets/neon-globe.js';

  const globe = createNeonGlobe(document.getElementById('globe'));
  // On SPA navigation or component unmount:
  // globe.destroy();
</script>
```

Give the container an explicit responsive height, `position: relative`, and no
padding. The globe fits inside both dimensions without distortion or cropping.
The canvas is pointer-transparent and hidden from assistive technology because
this is decorative output. Place any meaningful partner names in accessible
page content. The module does not modify the container or the document's styles.

## React

```tsx
import { useEffect, useRef } from 'react';
import { createNeonGlobe } from './neon-globe.js';

export function GlobeBackground() {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const globe = createNeonGlobe(container.current!);
    return () => globe.destroy();
  }, []);
  return <div ref={container} style={{ position: 'relative', width: '100%', height: 600 }} />;
}
```

Importing is SSR-safe; mounting must happen on the client. Cleanup supports
React Strict Mode remounts. Only one instance may own a given container, while
different containers have independent clocks and lifecycle controls.

## Configuration

`createNeonGlobe(container, { values, renderScale: 2, motion: 'auto' })` uses the
saved composition in `src/embed/landing-preset.json` unless overridden. This is
the supplied editor export from 2026-08-27, including its exact orientation and
logo scales: easyJet 114%, Ubisoft 108%, Novo Nordisk 121%, and Prada 100%.
Final positions remain 60%, 68%, 71%, and 76% in that order; hold is 3 seconds
and speed is 2.5. `values` is a flat dictionary of
canonical editor targets, not the entire settings-export document. The same
validation and value limits as the editor apply. Values are copied; no editor
storage is read or written.

```js
const globe = createNeonGlobe(container, {
  values: {
    'logos.speed': 2.5,
    'logos.holdSeconds': 3,
    'effects.crtIntensity': 100,
  },
});
globe.update({ 'logos.holdSeconds': 4 }); // Merge; does not restart the loop.
globe.pause();                         // Freeze the current frame.
globe.resume();                        // Resume from the same phase.
globe.restart();                       // Restart this instance; respects pause.
globe.destroy();                       // Idempotent cleanup; methods then do nothing.
```

Legacy target identities are preserved: easyJet is `logos.dxc`, Ubisoft is
`logos.zillow`, Novo Nordisk is `logos.meta`, and Prada is `logos.prada`.
Use `.finalPosition` or `.scale` under those prefixes. Band IDs in top-to-bottom
order are `band1`, `band4`, `band2`, `band3`. The example uses the shipped preset,
not any unsaved or locally persisted editor changes.

`renderScale` is 1 to 2, default 2. Actual backing size is container CSS size
times device pixel ratio times render scale, with no hidden quality cap. Large
containers on high-DPI screens can therefore use substantial memory; size the
website container deliberately. It follows container and device-pixel-ratio
changes, including a container that starts at zero size.

## Motion And Resources

Offscreen, hidden-tab and page-cache suspension stop requesting animation frames.
Returning continues the saved phase without fast-forwarding through hidden time.
Manual pause is never undone by visibility changes. `motion: 'still'` renders
the final positions. `prefers-reduced-motion: reduce` also renders the final
positions with a fixed CRT phase, with no animation or flicker; preference changes
are observed live. Resize and value changes still update a visible static frame.

Always call `destroy()` before removing an SPA component. It cancels frame work,
disconnects both observers, removes event listeners and the canvas, and releases
its backing pixels. Shared logo paths are a bounded cache of the four fixed logos.

## Integration Verification

Functional checks cover real output, responsive framing, full-resolution backing,
pause/resume/restart, live reduced motion, visibility suspension, multiple
instances, repeated destroy/remount, and equivalence to the shared renderer.
This is not full performance certification of the final website. Test the actual
page with its other scripts and CSS, including real mobile Safari, long sessions,
page navigation and accessibility preferences. Modern browsers must provide
Canvas 2D, Path2D, ResizeObserver, IntersectionObserver and matchMedia.
