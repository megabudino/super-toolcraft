# Logo Sphere

Arrange SVG logos and uploaded images on a rotating perspective sphere. Includes Fibonacci, Rings and Grid distributions, depth and fade controls, card styling and PNG/JPEG export.

Standalone copy of `toolcraft-apps/logos-grid` with its existing renderer, controls, supplied SVG assets and defaults preserved. The published app uses the `logo-sphere` identity.

```sh
npm ci
npm run dev
npm run build -- --base /demos/logo-sphere/
```

Vercel builds from this folder through the `pixel-point/primeui-v2` Git integration. Output is `dist`; the website proxies `/demos/logo-sphere` to the app deployment using the shared demo registry.
