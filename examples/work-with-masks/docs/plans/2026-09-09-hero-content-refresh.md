# Hero content refresh

Request: replace all hero content with new copy of similar word counts and a thematically similar video.

Keep the English language, payment/retail theme, two-line heading, paragraph hierarchy and current typography/layout values. Rewrite the CTA and brand-grid caption. Brand-name/logo replacement was asked as a non-blocking clarification; absent further direction, replace those too with explicitly fictional demo identities rather than inventing real partnerships. Keep the existing logo grid cardinality and rotation.

Use an appropriately licensed local stock clip about online shopping/card payment. Preserve the current preview-only freeze, reveal frame and background wave; no new playback controls, timeline behavior, schema targets, layers, exports or persistence changes. This clip is shipping media, not a supplied motion reference to reconstruct.

Implementation: update `src/section` content/header/logo assets and hero video sources; update the exact local asset manifest, relevant content tests and native hero browser assertions. Move replaced local assets to a documented recoverable backup, not delete source-project files. Record media provenance and license.

Verification tier: Tier 3, focused later media/copy edit.
Run: exact content/asset unit tests; `pnpm test:feature -- hero.native-section` for new content, desktop/mobile fit and decoding the local replacement video; embedded visual check. If using production-preview mode, build once to include the new asset bytes and source text (prior dev verification was navigation-sensitive).
Skip: all typography/control suites, reload matrix, renderer/export tests, delivery gate and performance audit; those behaviors are unchanged.

Route: media/default asset replacement. Plan docs: workflow, core/setup-export, core/media-upload. Implementation: schema-reference, component-rules. Verification: acceptance-testing, performance. Existing signed framework remains untouched.

## Completed

- Replaced the identity with fictional Looplane, including the header wordmark, compact mark and 24 rotating concept-brand logos. Copy retains exactly 4 / 11 / 19 / 10 words in the heading, lead, body and grid caption; the CTA remains three words.
- Replaced the external booking CTA with “See the story”, linking to the local `#hero-media` section. Keyboard activation in the embedded editor reaches the new video. Pointer gestures remain owned by the existing editor canvas; no runtime interaction changes were made.
- Added the licensed Kindel Media online-shopping clip, encoded locally as a silent 10-second 1920×1080 MP4. Namespaced its existing layout classes so video width follows the product viewport on desktop and mobile.
- Retired 24 former logos and two former video files to `/Users/kusnizza/.Trash/percent-hero-content.2fOJAz`. The current public asset manifest covers exactly 27 files. Source projects were not modified.
- Passed six focused unit tests, one production build and `TOOLCRAFT_BROWSER_SERVER_MODE=preview pnpm test:feature -- hero.native-section` (one browser case). Embedded visual inspection covered the heading/copy/logos and replacement video; the preview was returned to the first screen.
