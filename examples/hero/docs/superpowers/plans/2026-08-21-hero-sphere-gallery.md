# Hero Sphere Gallery — Design + Implementation Plan (single file)

> **For agentic workers:** план рассчитан на выполнение по задачам (checkbox `- [ ]`) с
> `superpowers:subagent-driven-development` или `superpowers:executing-plans`. Перед правками
> обязателен preflight из `AGENTS.md` → `docs/toolcraft/workflow.md` (маршруты: «Schema, controls…»,
> «Export, copy, media, background», «Renderer, canvas output…», «Timeline, keyframes, animation
> transport» — Plan-фаза до спеки, Implementation-фаза перед кодом, Verification-фаза перед пруфом).
> Этот файл одновременно является дизайн-спекой (§1–§3) и планом (§4–§10); отдельной спеки нет.
>
> **Параллельная работа.** В этом рабочем дереве в последние часы шли другие доставки (Delivery 12–15:
> prompt pad, canvas height, heading color/Ultra Italic, background pattern). Протокол моста сейчас
> **v8**, следующая запись worklog — **Delivery 16**. Перед правкой каждого файла перечитывай его
> актуальное состояние, не восстанавливай старые версии и сохраняй чужие незакоммиченные изменения.
> Не коммить без разрешения пользователя.
>
> **Режим проверки.** Delivery 15 выполнялась по standing-инструкции пользователя «не запускать
> тесты/lint/typecheck/build, отдать на ревью». Уточни у пользователя, действует ли она здесь; по
> умолчанию выполняй §9 (focused checks), если он не скажет иначе.

---

## 1. Цель и границы

**Goal.** Галерея хиро становится редактируемой «галереей на внутренней грани сферы»: пользователь
загружает свои картинки в Toolcraft; картинки сохраняют собственный аспект; композиция состоит из
**1–6 рядов**, у каждого ряда — своя высота, своё базовое положение по горизонтали и своя скорость
вращения; вертикальный гэп между рядами — один слайдер; все ряды лежат на внутренней поверхности
эллипсоида с настраиваемыми шириной и высотой; всю композицию можно **крутить по внутренней грани
(yaw/pitch)** и двигать по холсту; картинки изгибаются по геометрии поверхности; бесконечная
анимация; существующая обработка краёв (Edge Zone / Edge Warp / Dispersion & Aura / Boundary Aura)
остаётся без изменений.

**Архитектура (подтверждена пользователем — «менять не надо»).** Редактирование — в Toolcraft
(`recraft-tools/hero`), рендер — на сайте (`recraft-v4-styles`), который Toolcraft показывает в iframe
`http://localhost:3000/`; финальный вид сразу живёт на сайте. Toolcraft владеет контролами,
каноническими значениями, медиа (IndexedDB), persistence, history, settings transfer и
версионированным `postMessage`-протоколом (**v9**). Сайт владеет DOM/WebGL-рендером, шейдером
дисперсии, авторскими портретами, анимацией и своими standalone-дефолтами. Toolcraft не инспектирует
DOM iframe; сайт не содержит Toolcraft-кода.

**Tech Stack:** TypeScript, React 19, Toolcraft schema/runtime, Next.js 16.3, raw WebGL1 (как текущий
рендер), CSS Modules, Vitest (Toolcraft), Playwright (Toolcraft), oxfmt/oxlint/tsgo (сайт).

## 2. Принятые решения и допущения

| # | Решение / допущение | Почему так |
| --- | --- | --- |
| A1 | Текущий режим двух зеркальных строк остаётся как `gallery.type = "rows"`; новый — `"sphere"`; default в Toolcraft `"sphere"`. **Упрощение:** если пользователь скажет, что Rows больше не нужен — удалить селектор и rows-only контролы (`cards.height`, `cards.safetyWidth`, `cards.roll`), секция Gallery сокращается до 7 контролов без applicability-ветвлений, сайт теряет второй рендер. | Rows — результат 10 доставок; переключатель дешевле потери, но удваивает acceptance-кейсы. |
| A2 | Пока картинок не загружено, сайт показывает свои 8 авторских портретов (в обоих типах). | Standalone-сайт должен работать; `media.defaultAssets` с data URL на мегабайты неприемлем. |
| A3 | `cards.scale` (%) удаляется. В Sphere высота задаётся **на ряд** (`sphere.rows[i].height`, px); в Rows — одним `cards.height` (px). Ширина карточки = height × аспект картинки. | Пользователь просит регулировать высоту каждого ряда при сохранении аспекта. |
| A4 | Ряды — встроенный `collectionActions` (`sphere.rows`, 1–6 записей `{ height, offset, speed }`), `+`/`−` в заголовке, поля рендерит runtime. | Пользователь владеет количеством рядов ⇒ `collectionActions` по `core/control-selection.md`; три поля — одна атомарная запись ⇒ `itemControls`. |
| A5 | Вращение сферы — Vector-пад `sphere.rotation` (x → yaw ±180°, y → pitch ±90°) в панели; `viewInteraction` остаётся `fixed-camera`. Orientation Gizmo/драг невозможны: iframe pointer-transparent и кросс-origin, Toolcraft не рендерит геометрию. Это жёсткий поворот поверхности с нарисованной на ней композицией вокруг центра эллипсоида (не камера). | Пользователь редактирует только через панель Toolcraft; записать как evidence-backed решение в worklog. Наклон (roll) не запрошен — не делаем (лёгкое расширение: слайдер `sphere.tilt`). |
| A6 | Скорость ряда — угловая, °/s, со знаком (отрицательная = справа налево); базовое положение ряда — °. | «Скорость вращения ряда» — угловая величина; знак даёт направление без лишнего контрола. |
| A7 | Картинки раздаются по рядам round-robin: ряд r получает `images[i]` с `i % rows === r`; ряд без картинок (картинок меньше, чем рядов) показывает полный набор. | Разные ряды показывают разные картинки; ничего не пустует. Альтернатива («каждый ряд — весь набор со сдвигом») — одна строка в стор-функции. |
| A8 | Единицы — CSS px хиро-вьюпорта; смещение композиции — в тех же долях, что у Heading/Prompt (`x·36vw`, `y·28vh`). | Сохраняем договорённости протокола и падов. |
| A9 | Standalone-дефолты сайта получают `gallery.type: "rows"` и текущий вид (Delivery 9); переключение сайта на сферу по умолчанию — отдельная просьба (экспорт настроек). | Не менять продакшн-вид без запроса. |
| A10 | Без Toolcraft timeline и без видео-экспорта: `animationIntent.mode = "autonomous"`. | `core/timeline-animation.md`: декоративная самоходная анимация без транспорта; произвольные скорости рядов не дают общего периода для бесшовного таймлайн-лупа. |
| A11 | Рендер сферы — один полноэкранный retained WebGL1-канвас, переиспользующий текущий фрагментный шейдер дисперсии почти дословно; Rows-рендер (per-card канвасы) остаётся как есть. | Минимальный риск регрессий краевого эффекта; паритет между типами. |

**Отвергнутые альтернативы.** Камера строго в центре сферы (радиус ненаблюдаем — `sphere.width/height`
стали бы пустыми контролами; касательная модель покрывает центр как частный случай `f = Rx`);
передача картинок через `blob:`/`data:` URL (кросс-origin/раздувание) вместо `Blob` structured clone;
`media.defaultAssets` с портретами; Toolcraft timeline для анимации; per-card канвасы для сферы
(проекция карточки выходит за её DOM-прямоугольник, нужен общий z-порядок); отдельная секция
«Sphere» для sphere-контролов (валидатор `control-layout-dependency-rules.ts` отвергает секции,
повторяющие ветку селектора или его префикс — селектор и зависимые контролы живут в одной секции);
отдельный загрузчик на ряд (6 fileDrop, лавина тестов).

**Data flow.** `appSchema` values + `state.mediaAssets` → `createHeroPreviewSettingsFromValues(values,
images)` → `postMessage` v9 `settings` (+ `media` с Blob для новых `resourceRef`) →
`normalizeHeroSceneSettings` + `hero-gallery-media-store` → `HeroV4Styles` выбирает `HeroCardScene`
(rows) или `HeroSphereGallery` (sphere) → сайт отвечает `state` (порядок/готовность/сигнатура
картинок, ряды, вращение) → `HeroExternalPreview` зеркалит его в `data-hero-gallery-*` атрибуты
product-output обёртки для browser-proof.

## 3. Что проверено в исходниках (факты, на которые опирается план)

Сайт (`recraft-v4-styles/src/components/pages/home/`):

- `hero-v4-styles.tsx` (default export `HeroV4Styles`): секция `h-[calc(100svh-4rem)]` с grid
  `[minmax(0,1fr)_5rem]`; внутри `HeroCardScene` (`[data-hero-scene]`, `absolute inset-0 z-10`, CSS
  `perspective`/`perspective-origin` из settings) с двумя `CardStack` (`[data-hero-card-row=left|right]`,
  якоря `right|left: calc(50% + safetyWidth/2)`), карточки `div.aspect-[7/9]` с `data-hero-card`,
  `data-hero-card-edge`, `data-hero-card-index`, `width: clamp(7.5·s rem, 14·s vw, 18·s rem)`
  (`s = cardScale/100`), `margin = cardGap`, `zIndex = index+1`, внутри `<HeroDispersionCard>`;
  инвентарь `portraitImages` (8 PNG под `/images/recraft-hero/card-stack/`), `cardImagesBySide` по 8 на
  сторону; затем слой паттерна `[data-hero-background-pattern]`, группа заголовка
  `[data-hero-heading-group]` (`z-0`), промпт `[data-hero-prompt]` (`z-20`), `AnnouncementStrip`
  (`z-30`, тикер уже с `motion-reduce:animate-none`). Домашняя страница всегда рендерит
  `<HeroPreviewBoundary />` (`src/app/(website)/page.tsx`).
- `hero-dispersion-card.tsx` (`'use client'`): константы `HORIZONTAL_BLEED = 256` (только наружу),
  `VERTICAL_BLEED = 80`, `VELOCITY_GAIN = 1.6`, `VELOCITY_LIMIT = 140`, `VELOCITY_REST_THRESHOLD = 0.05`,
  `VELOCITY_SMOOTHING = 0.2`; `IntersectionObserver` (root — `[data-hero-scene]`) включает рендер только
  видимым карточкам; текстура берётся из `next/image` `<img fill sizes="(min-width: 1280px) 18rem, 14vw">`
  по `onLoad`; `ResizeObserver` → `syncRendererLayout` (измеряет `pathOffset/pathLength`, пишет
  `data-hero-card-roll-path-length/offset`); motion boost — сглаженная дельта
  `getBoundingClientRect().left` за кадр × `settings.velocity` × gain, clamp ±140; dataset
  `data-dispersion-lifecycle`, `data-dispersion-error`, `data-dispersion-ready`, `data-hero-card-roll`;
  канвас `[data-hero-dispersion-canvas=side]` размером `100% + 256px` × `100% + 160px`.
- `hero-card-dispersion-webgl.ts`: `createHeroCardDispersionRenderer(canvas, image, side)` — **WebGL1**
  (`alpha`, `premultipliedAlpha: true`, без depth/blend), `createRollerMesh(48, 8)` — единичная сетка
  `(u, v) ∈ [0,1]²`; `clampBacking` (DPR ≤ 2, ≤ 4096 px, ≤ 5 MP); `HeroCardRollLayout { canvasViewportX,
  pathLength, pathOffset, perspective, roll, viewportWidth }`; методы `setSize`, `setLayout`,
  `setUniforms(dispersion)`, `render(velocityPx)`, `dispose()`. Текстура: `UNPACK_FLIP_Y = false`,
  `LINEAR`, `CLAMP_TO_EDGE`, без мипмапов.
  - Вершинный шейдер: `point = aPosition · uViewSize` (CSS px канваса карточки), цилиндр по
    `pathOffset/pathLength/roll`, псевдоперспектива `clamp(P/(P − depth·2.4), 1, 2.4)`; `vPoint = point` —
    **неизогнутые** координаты авторской карточки.
  - Фрагментный шейдер работает в этом же card-space (px): `sampleCard(point)` → `uv = (point −
    uCardOrigin)/uCardSize`, вне `[0,1]` — прозрачно (так реализован bleed); маска края: `canvasX =
    gl_FragCoord.x / uBackingSize.x · uViewSize.x`, `viewportX = uCanvasViewportX + canvasX`,
    `edgeDistance = uSide < 0 ? viewportX : uViewportWidth − viewportX`, `zonePixels = uViewportWidth ·
    uEdgeWidth`; все смещения (warp, wave, prism, dispersion `uSide·span·spread`, blur, aura, gate) — в
    px card-space и направлены по `uSide`; выход premultiplied, `· (1 − fade)`.
- `hero-scene-settings.ts`: `interface HeroSceneSettings { background, backgroundEnabled, cardGap,
  cardRoll, cardSafetyWidth, cardScale, dispersion, heading{…,color,…}, pattern{…}, perspective,
  prompt{position}, vanishingPoint }`; `defaultHeroSceneSettings` = standalone-вид (gap 10, roll 85,
  safety 883, scale 98, perspective 600, свой `defaultHeroDispersionSettings`); таблица `numericBounds`
  + `clampNumber`/`normalizeColor`; `normalizeHeroSceneSettings(value): HeroSceneSettings | null`.
- `hero-preview-boundary.tsx` (`'use client'`): `previewProtocolVersion = 8`; trusted parent origin —
  `NEXT_PUBLIC_HERO_PREVIEW_PARENT_ORIGIN` или localhost-referrer в dev; принимает только `settings`
  от `window.parent` с нужным origin; шлёт `ready`; рендерит `<HeroV4Styles settings>`.
- Сайт: `pnpm` (10.11), Next 16.3.1, React 19.2.4, скрипты только `dev/build/lint(oxlint)/format(oxfmt
  --check)/typecheck(tsgo)`; `architecture`/`test:unit`/e2e-скриптов в `package.json` **нет** (не
  изобретать); стиль: одинарные кавычки, kebab-case файлы, `interface`, named exports (default — только
  для framework-конвенций), `'use client'` на минимальной границе, без `any`/`!`, файл ≤ 1000 строк
  (≈500 — сигнал разделить), форматировать тронутые файлы `pnpm exec oxfmt <files>`; общий `.git` — в
  корне `recraft-landing`.

Toolcraft (`recraft-tools/hero`):

- Протокол v8 (`hero-preview-protocol.ts`); секции Background, Pattern, Hero Heading (6 контролов,
  включая `heading.color`), Prompt, Projection, Cards, Edge Zone, Edge Warp, Dispersion & Aura,
  Boundary Aura; value-модули `hero-heading-values.ts`, `hero-prompt-values.ts`,
  `hero-background-pattern-values.ts`, `hero-dispersion-values.ts`; `HERO_PREVIEW_SCENE_BOUNDS`
  1920 × 1080; dev-сервер Toolcraft обычно `http://127.0.0.1:3003/`, сайт `http://localhost:3000/`.
- `collectionActions` (runtime `controls-panel-collection-renderer.tsx`): поддерживает `minItems`,
  `hardMaxItems`, `itemControls` (запись = объект по id полей, `+` добавляет `defaultValue` всех полей,
  `−` удаляет последнюю запись), `addLabel/removeLabel/itemLabel`; допустимые типы полей:
  `checkbox, color, colorOpacity, fontPicker, rangeInput, rangeSlider, segmented, select, slider,
  switch, text, vector`.
- `acceptance/control-layout-dependency-rules.ts`: контрол, гейтящийся селектором из **другой**
  секции, — ошибка, если делит с ним префикс target'а или если заголовок секции похож на ветку
  селектора («Sphere»). ⇒ селектор `gallery.type` и все зависимые контролы — в одной секции (≤ 10).
- `acceptance/media-upload.ts`: multiple image fileDrop без Layers требует
  `mediaLifecycleCoverage` upload/remove/reset/rotate/flip/transform-output/reorder/order-output и
  `evidence: "media-lifecycle"`.
- `acceptance/animation-intent.ts`: autonomous требует `reason` и шесть `behaviorCoverage`.
- Performance: каждый `performanceRole: "workload"` обязан иметь ровно одну numeric envelope dimension;
  не-числовые контролы (fileDrop, collectionActions) как источники workload не моделируем.
- `e2e/browser-state-evidence-helpers.ts`: `expectToolcraftMediaLifecycle` требует, чтобы между
  before/after менялись **и** `itemIds`, **и** `outputSignature`.

## 4. Модель галереи (математика)

Система координат хиро-вьюпорта `[data-hero-scene]`: ширина `W`, высота `H` (CSS px); точка схода
`(cx, cy) = (vanishingPoint.x% · W, vanishingPoint.y% · H)` (сейчас 50%/44%) плюс смещение композиции
`(+position.x · 0.36 · W, +position.y · 0.28 · H)` (Vector в screen-coords: вправо/вниз —
положительные). 3D-пространство: начало в точке схода на экранной плоскости, `x` вправо, `y` вверх,
`z` к зрителю; камера в `(0, 0, f)`, `f = scene.perspective` px, смотрит в `−z`. Проекция точки
`(x, y, z)`, `z < f`: `sx = cx + x · f/(f − z)`, `sy = cy − y · f/(f − z)` (совпадает с CSS `perspective`).

### 4.1 Поверхность

Эллипсоид вращения вокруг вертикальной оси, полуоси `Rx = sphere.width` (по `x` и по глубине) и
`Ry = sphere.height` (по `y`), центр `C = (0, 0, Rx)` — поверхность касается экранной плоскости в точке
схода. Параметризация внутренней поверхности и жёсткий поворот композиции:

```
S(θ, φ) = ( Rx · sinθ · cosφ,  Ry · sinφ,  Rx · (1 − cosθ · cosφ) )
θ — долгота (0 = дальняя стенка в точке схода, >0 вправо), φ — широта (0 = экватор, >0 вверх)
P(θ, φ) = C + R_x(pitch) · R_y(yaw) · (S(θ, φ) − C)       // sphere.rotation, градусы → радианы
```

- Центральная карточка экваториального ряда (`θ≈0, φ≈0`, без поворота) лежит в экранной плоскости ⇒ её
  экранная высота равна высоте ряда в px (при малых углах); к краям карточки уходят ближе к камере
  (`z` растёт) и увеличиваются — тот же «туннель», что у текущего роллера.
- Камера внутри поверхности при `f < 2·Rx`; `f = Rx` — камера в центре (классический «шар»). При
  `f ≥ 2·Rx` камера снаружи/на ближней стенке; невидимые грани отсекаются back-face culling'ом, точки
  с `z ≥ f − ε` — near-plane клиппингом.
- Для тела вращения yaw эквивалентен общему сдвигу долготы; pitch — настоящий наклон композиции (ряды
  становятся наклонёнными окружностями). Поворот применяется к поверхности вместе с нарисованной
  композицией; для `Ry ≠ Rx` поворачивается и сам эллипсоид — так и задумано («крутить сферу»).
- Внутренняя поверхность выпуклого тела не самоперекрывается для камеры внутри, поэтому depth test не
  нужен; для камеры снаружи достаточно back-face culling.

### 4.2 Ряды по меридиану

Ряды `r = 0..n−1` (сверху вниз, `n = sphere.rows.length ≤ 6`), высоты `h_r` px, вертикальный гэп
`g = sphere.rowGap` px (может быть отрицательным ⇒ перекрытие рядов). Стек центрируется на экваторе:

```
S_total = Σ h_r + (n − 1) · g
φ_r     = ( S_total/2 − Σ_{k<r} (h_k + g) − h_r/2 ) / Ry          // широта центра ряда (дуга ≈ Ry·φ)
Δφ_r    = h_r / Ry                                                 // угловая высота ряда
R_r     = max(Rx · cos(clamp(φ_r, −80°, 80°)), 1)                  // радиус параллели ряда, px
```

Карточка `i` ряда `r`: аспект `a_i = w/h` картинки (после rotate 90/270 — обратный), дуговая ширина
`w_i = h_r · a_i` px, угловая ширина `Δθ_i = w_i / R_r`, угловой гэп `γ_r = cards.gap / R_r`. UV линейны
по `(θ, φ)` — равная длина дуги на тексель; изгиб (включая естественное сужение к полюсам) даёт только
проекция.

### 4.3 Конвейер ряда и бесшовное кольцо

Лента ряда: слоты `α_i = Δθ_i + γ_r`, период `Λ_r = Σ α_i` (рад), фаза `ψ_r(t)`:
`ψ_r += speed_r (°/s → рад/с) · dt`, `dt ≤ 50 ms`. Долгота центра карточки в «координатах ленты»:
`θ_i = offset_r + ψ_r + start_i + Δθ_i/2 − Λ_r/2` (+ копии со сдвигом `j·Λ_r`).

**Окно в один оборот.** На каждом кадре рисуются только карточки, чьи долготы попадают в окно
`[θ_far − π, θ_far + π)`, где `θ_far` — долгота ленты, которая после yaw оказывается на дальней стенке
(`θ_far = −yaw`). Копии ленты перебираются `j ∈ [−K, K]`, `K = ceil(π / Λ_r) + 1` (суммарно ≤ 96
отрисовок за кадр на все ряды, иначе уменьшить K с логом). Следствия: при `Λ_r < 2π` лента повторяется
бесшовно по кругу; при `Λ_r > 2π` «шов» ленты всегда на ближней стенке за камерой (невидим при
камере внутри; при большом pitch может показаться у верхнего/нижнего края — задокументировать).
Никаких автоподгонок гэпа не делается; для `speed = 0` фаза не идёт. Фаза хранится по модулю `Λ_r` и
пересчитывается пропорционально при смене `Λ_r` (смена высоты/гэпа/набора не «прыгает»).
Положительная скорость — слева направо (рост `θ` ⇒ рост `sx`).

### 4.4 Card-space и шейдер

Каждая карточка рисуется в своём авторском card-space (px дуги), как сейчас per-card канвас:
`uViewSize = (w_i + 2·HORIZONTAL_BLEED, h_r + 2·VERTICAL_BLEED)`, `uCardOrigin = (HORIZONTAL_BLEED,
VERTICAL_BLEED)`, `uCardSize = (w_i, h_r)`; `vPoint = aPosition · uViewSize`. Новый вершинный шейдер:
`arc = point.x − uCardOrigin.x − uCardSize.x/2`, `θ = uThetaCenter + arc / uRowRadius`,
`φ = uPhiCenter − (point.y − uCardOrigin.y − uCardSize.y/2) / uRy`, `P = P(θ, φ)` (с `uRotation` mat3 и
`uCenter`), `gl_Position = uProjection · vec4(P.x, P.y, P.z − uFocal, 1) + NDC-сдвиг точки схода/композиции
· w`. Матрица перспективы: `fovY = 2·atan(H/(2f))`, `aspect = W/H`, `near = 4`, `far = 2·Rx + f + 16`.
Bleed входит в сетку через `uViewSize`, горизонтально с обеих сторон (карточка может смотреть на любой
край), вертикально сверху и снизу (`256`/`80` px дуги).

- `uSide` карточки = знак `(sx_center − W/2)` по спроецированному центру (после поворота знак долготы
  ненадёжен); `+1` при равенстве.
- Маска краевого эффекта: `canvasX` считается от размера всего канваса — добавить юниформ
  `uScreenSize` (CSS-размер канваса) и использовать его вместо `uViewSize.x` только в строке `canvasX =
  …`; per-card рендер Rows передаёт `uScreenSize = uViewSize`. Для сферы `uCanvasViewportX = 0`,
  `uViewportWidth = W`. Остальные уравнения без изменений.
- Порядок отрисовки — painter's: ряды сверху вниз, внутри ряда по возрастанию долготы (позже — сверху);
  без depth test, **с blending** `gl.blendFunc(ONE, ONE_MINUS_SRC_ALPHA)` (выход premultiplied),
  `clearColor(0,0,0,0)`; back-face culling так, что внутренняя грань — лицевая.
- Motion boost: для карточки `instantaneous = Δsx` центра за кадр (уже считается для отсечения),
  сглаживание/gain/limit — константы `HeroDispersionCard`; при `speed = 0` затухает.
- Отсечение: 8 опорных точек (4 угла + середины рёбер, с bleed), хотя бы одна внутри вьюпорта и с
  `z < f − 1`.
- DPR/backing через `clampBacking`, resize через `ResizeObserver` на `[data-hero-scene]`,
  `webglcontextlost/restored`, освобождение ресурсов — по образцу per-card рендера.

### 4.5 Rows (legacy, геометрия без изменений)

Зеркальные цилиндры сохраняются. Меняется только вход: карточки получают `style={{ height:
cards.height, aspectRatio: `${w} / ${h}` }}` (без `aspect-[7/9]` и `width: clamp`), источники картинок —
из общего реестра, раздача загруженных картинок по строкам — поочерёдно от центра наружу (`images[0]`
→ левая внутренняя, `images[1]` → правая внутренняя…), при нехватке — циклически, не более 8 на
сторону; DOM-порядок внутри строки «от внешней к внутренней» (внутренняя — последняя, как ждёт
`measureSharedRollPath`). Смещение `gallery.position` — `translate3d` обёртки вокруг обеих
`CardStack`; `sphere.*` в этом типе игнорируются.

### 4.6 Рекомендуемые дефолты

`sphere.width = 900`, `sphere.height = 900`, `sphere.rowGap = 24`, `sphere.rows = [{ height: 340,
offset: 0, speed: 3 }]`, `sphere.rotation = {0, 0}`, `cards.gap = −24` (существующий), `cards.height
= 340` (rows). Дизайнер подберёт; при необходимости опустить минимум `scene.perspective` с 600 до 200
(широкоугольный «туннель») синхронно в схеме и `numericBounds.perspective`.

## 5. Toolcraft: схема, значения, протокол

### 5.1 Targets и контролы

| Target | Тип | Диапазон / опции | Default | Applicability | `semanticGroup` | Роль |
| --- | --- | --- | --- | --- | --- | --- |
| `gallery.images` | `fileDrop`, `assetKind: "image"`, `multiple: true`, `recommendedMaxItems: 16`, `hardMaxItems: 24`, `defaultValue: []` | — | `[]` | always | — (своя секция) | responsiveness |
| `gallery.type` | `segmented` | `Rows` / `Sphere` (`"rows"`/`"sphere"`) | `"sphere"` | always | `gallery-mode` | responsiveness, `orderRole: "mode"` |
| `cards.gap` | `slider` (существующий), px | −240–160, step 1 | −24 | always | `card-spacing` | responsiveness, `orderRole: "primary"` |
| `cards.height` | `slider` continuous, px, label `Card height` | 80–1080, step 1 | 340 | `conditional: gallery.type == "rows"` | `rows-geometry` | responsiveness |
| `cards.safetyWidth` | `slider` (существующий), px | 320–1440 | 720 | `conditional: gallery.type == "rows"` | `rows-geometry` | responsiveness |
| `cards.roll` | `slider` (существующий), ° | 0–85 | 42 | `conditional: gallery.type == "rows"` | `rows-geometry` | responsiveness |
| `sphere.rows` | `collectionActions`, `minItems: 1`, `hardMaxItems: 6`, `itemLabel: "Row"`, label `Rows`, `itemControls`: `height` slider px 80–1080 step 1 default 340 (`Height`); `offset` slider ° −180–180 step 1 default 0 (`Offset`); `speed` slider °/s −45–45 step 0.5 default 3 (`Speed`) — все `sliderValueKind: "continuous"` | — | `[{height:340, offset:0, speed:3}]` | `conditional: gallery.type == "sphere"` | `sphere-rows` | responsiveness |
| `sphere.rowGap` | `slider` continuous, px, label `Row gap` | −200–400, step 1 | 24 | `conditional: gallery.type == "sphere"` | `sphere-rows` | responsiveness |
| `sphere.width` | `slider` continuous, px, label `Sphere width` | 200–6000, step 10 | 900 | `conditional: gallery.type == "sphere"` | `sphere-surface` | responsiveness |
| `sphere.height` | `slider` continuous, px, label `Sphere height` | 200–6000, step 10 | 900 | `conditional: gallery.type == "sphere"` | `sphere-surface` | responsiveness |
| `sphere.rotation` | `vector`, `coordinateMode: "screen"`, label `Rotation` | −1..1 (x → yaw ±180°, y → pitch ±90°) | `{x:0,y:0}` | `conditional: gallery.type == "sphere"` | `sphere-surface` | responsiveness, `orderRole: "spatial"` |
| `gallery.position` | `vector`, `coordinateMode: "screen"`, label `Position` | −1..1 | `{x:0,y:0}` | always | — (своя секция) | responsiveness |
| `cards.scale` | — | — | — | **удалить** | — | — |

`description` обязательна там, где добавляет смысл: `sphere.rows` — «Each row owns its card height,
base angle and signed angular speed; rows stack on the sphere from top to bottom.»; `sphere.rotation`
— «Spins the whole composition along the inner surface: X turns it around the vertical axis, Y tilts
it up or down.»; `sphere.rowGap` — «Vertical distance between rows along the sphere; negative values
overlap rows.»

Пояснения к performance-роли: число картинок ограничено `hardMaxItems` (24), число рядов — 6;
текстуры загружаются один раз и удерживаются; число одновременно видимых карточек ограничено
геометрией/вьюпортом, а стоимость фрагментов — пикселями вьюпорта с ограниченным overdraw (bleed,
отрицательные гэпы); единственные workload-измерения остаются `dispersion.count` и `dispersion.blur`
(без новых envelope dimensions). Причину записать в `performanceReason` и в `performanceRisks`.

Секции (Control Section Inventory):

- `gallery-images` — title `Gallery Images`, entity «Gallery image set», один контрол `gallery.images`
  (полная поверхность сущности: upload/порядок/удаление/rotate/flip внутри FileDrop — валидная
  односекционная сущность по `core/layout.md`). `label: "Images"`, `description`: «Uploaded images
  replace the website portraits in media order; an empty set keeps the authored portraits.»
  Rotate/flip-кнопки рендерит сам runtime FileDrop.
- `gallery` — title `Gallery` (вместо `Cards`), entity «Hero gallery surface», `entityId:
  "hero-gallery-surface"`, **10 контролов** (жёсткий максимум) ⇒ `semanticGroup` обязателен на каждом.
  Порядок: type → gap → cards.height → safetyWidth → roll → rows → rowGap → sphere.width → sphere.height
  → rotation. Селектор и все зависимые контролы — в одной секции (правило зависимостей, §3).
- `gallery-placement` — title `Gallery Placement`, entity «Gallery placement on the hero canvas»,
  `entityId: "hero-gallery-placement"`, один контрол `gallery.position` (полная поверхность сущности —
  прецедент: секция Prompt с одним Vector). Вынесена отдельно, чтобы не превысить 10 контролов в
  `Gallery`.
- Остальные секции (Background, Pattern, Hero Heading, Prompt, Projection, Edge Zone, Edge Warp,
  Dispersion & Aura, Boundary Aura) — без изменений.

Сегмент `Rows`/`Sphere`: 2 опции, ≤ 9 символов, суммарно 10 — в бюджете. Заголовок `Gallery
Placement` не содержит текста веток селектора — правило зависимостей не задевает (контрол не гейтится).

### 5.2 Протокол v9

`HERO_PREVIEW_PROTOCOL_VERSION = 9`. Типы (в `hero-gallery-values.ts`):

```ts
export type HeroGalleryImage = Readonly<{
  id: string;              // ToolcraftMediaAsset.id
  ref: string;             // resourceRef = "media:image:sha256:<hex>" — ключ кэша/ревизия байтов
  width: number;           // natural size hint (0, если неизвестно); сайт берёт размер из bitmap
  height: number;
  transform: Readonly<{ flipHorizontal: boolean; flipVertical: boolean; rotationDeg: 0 | 90 | 180 | 270 }>;
}>;

export type HeroSphereRow = Readonly<{ height: number; offset: number; speed: number }>; // px, °, °/s

export type HeroGallerySettings = Readonly<{
  type: "rows" | "sphere";
  cardGap: number;                                  // px
  position: Readonly<{ x: number; y: number }>;     // −1..1
  images: readonly HeroGalleryImage[];              // [] ⇒ авторский инвентарь сайта
  rows: Readonly<{ cardHeight: number; safetyWidth: number; roll: number }>;
  sphere: Readonly<{
    width: number; height: number; rowGap: number;
    rotation: Readonly<{ yaw: number; pitch: number }>;   // градусы, уже домноженные в Toolcraft
    rows: readonly HeroSphereRow[];                        // 1..6
  }>;
}>;
```

`HeroPreviewSettings` v9 = v8 (`background`, `backgroundEnabled`, `dispersion`, `heading`, `pattern`,
`perspective`, `prompt`, `vanishingPoint`) + `gallery: HeroGallerySettings`; верхнеуровневые `cardGap`,
`cardRoll`, `cardSafetyWidth`, `cardScale` удаляются (переезжают в `gallery`).

Сообщения (`channel: "recraft.hero-scene"`, `version: 9`):

- Toolcraft → сайт `settings` — как сейчас (payload `HeroPreviewSettings`).
- Toolcraft → сайт `media` — `{ type: "media", images: Array<{ id, ref, mimeType, blob: Blob }> }`; `Blob`
  проходит structured clone между origin'ами. Отправляются только `ref`, ещё не отправленные в текущую
  сессию iframe (сессия = последнее `ready`).
- сайт → Toolcraft `ready` — как сейчас, сбрасывает сессию медиа.
- сайт → Toolcraft `state` — `{ type: "state", payload: { galleryType, renderer: "webgl" | "fallback",
  imageOrder: string[] /* id в порядке рендера (ряд за рядом) */, readyImageIds: string[], imageSignature:
  string /* "id:ref:rot:fh:fv|…", для пустого набора "authored-portraits" */, rows: number, rowSignature:
  string /* "h:o:s|…" */, rotation: { yaw, pitch } } }` — после каждого применённого `settings`/`media`.

Сайт принимает **только** v9; Toolcraft шлёт только v9. Оба репозитория меняются в одной доставке.

### 5.3 Toolcraft-файлы

- `src/app/hero-gallery-values.ts` (новый): `heroGalleryTargets` (`images`, `type`, `gap`, `cardHeight`,
  `safetyWidth`, `roll`, `sphereRows`, `rowGap`, `sphereWidth`, `sphereHeight`, `rotation`, `position` —
  строки из §5.1), типы, `HERO_GALLERY_DEFAULTS`, `HERO_SPHERE_ROW_DEFAULT`,
  `createHeroGallerySettingsFromValues(values, images)` (clamp каждого поля; `sphere.rows` — валидный
  массив записей 1..6, иначе default; `rotation = { yaw: x·180, pitch: y·90 }`),
  `createHeroGalleryImagesFromMediaAssets(mediaAssets)` — фильтр `assetKind === "image" && sourceTarget ===
  heroGalleryTargets.images && lifecycle !== "unavailable"`, порядок = порядок `state.mediaAssets`,
  `transform` нормализован, `size` → width/height или 0.
- `src/app/hero-preview-protocol.ts`: v9, `gallery` в payload, `HeroPreviewMediaMessage`,
  `HeroPreviewStateMessage`, `isHeroPreviewStateMessage`, `createHeroPreviewMediaMessage`. Сигнатура
  `createHeroPreviewSettingsFromValues(values, images = [])`. Блоки `heading`/`pattern`/`prompt` не трогать.
- `src/app/app-schema.ts`: секции из §5.1 (вместо секции `cards`); удалить `cards.scale`; опционально
  `min` у `scene.perspective` = 200.
- `src/app/hero-preview-pipeline.ts`: в `HERO_PREVIEW_CONTROL_DRAG_TARGETS` добавить `cards.height`,
  `sphere.rows`, `sphere.rowGap`, `sphere.width`, `sphere.height`, `sphere.rotation`, `gallery.position`;
  в `HERO_PREVIEW_CONTROL_CHANGE_TARGETS` — `gallery.type`; удалить `cards.scale`; пасс `media-sync`
  (`kind: "preprocess"`, `runsOn: "main"`, `output: "source"`, `quality: "full"`, `cost: { dimensions: [],
  frequency: "discrete", relationship: "constant" }`, `lifecycle: { cache: "none", resourceScope: "call" }`,
  `inputs: ["gallery.images", …]`, `invalidatedBy: ["gallery.images"]`) и invalidation `{ interaction:
  "media-import", invalidates: ["media-sync", "preview-sync"], targets: ["gallery.images"] }`;
  viewport-drag/zoom получают `mustNotInvalidate: ["preview-sync", "media-sync"]`; описательную строку в
  `inputs` `preview-sync` обновить. `runtimeId` → `hero-external-preview-v9`. Прогнать
  `assessToolcraftRenderPlan` через существующие performance-тесты.
- `src/app/hero-preview.tsx`: (1) `useHeroPreviewSettings` берёт `state.values` и `state.mediaAssets`
  (`useToolcraftSelector`), строит `images` и settings; (2) новый `PreviewMediaSync` —
  `useToolcraftMediaPresentationUrls(galleryAssets)` (экспорт `@/toolcraft/runtime/react`) → Map<id,
  blob-url>; по образцу `PreviewSyncPass` перемонтируется через `key={`${revision}:${pendingRefsKey}`}`
  и внутри `useToolcraftPipelinePass(heroPreviewMediaPass, undefined, async () => { для ref ∉ sentRefs:
  fetch(url) → blob; postMessage(media, previewOrigin); sentRefs.add(ref) })`; `sentRefs`
  (`useRef<Set<string>>`) сбрасывается при каждом `ready` (`revision`); `AbortController` на unmount;
  несколько картинок — одним сообщением; (3) слушатель `message` принимает `state`; (4) обёртка
  `.preview` получает `data-hero-gallery-type`, `data-hero-gallery-order`, `data-hero-gallery-ready`
  (`"true"` когда `readyImageIds ⊇ imageOrder`), `data-hero-gallery-signature`, `data-hero-gallery-renderer`,
  `data-hero-gallery-rows`, `data-hero-gallery-row-signature`, `data-hero-gallery-rotation`.
- `src/app/app-composition.tsx`: `renderDefaultCanvasMedia: false` (иначе runtime нарисует загруженные
  картинки поверх iframe как canvas-media слои). `canvas.upload` оставить выключенным.
- `hero-heading-values.ts`, `hero-prompt-values.ts`, `hero-background-pattern-values.ts`,
  `hero-dispersion-*` — без изменений.

### 5.4 Acceptance / readiness / performance

`src/app/app-acceptance-data.ts`:

- `appTransferMode.animationIntent = { mode: "autonomous", reason: "Each sphere row spins at its own
  signed angular speed inside the website; there is no transport, scrub, duration, loop control, or
  video export.", behaviorCoverage: ["no-user-facing-transport","no-play-pause","no-scrub",
  "no-duration-control","no-loop-control","no-export-at-time"] }`. Добавить запись
  `referenceFeatureInventory` `requested.hero-sphere-gallery` (status по образцу
  `requested.hero-card-roller`) с описанием эллипсоида/рядов/конвейера/поворота.
- `interactionOwnership`: в общий `.map` добавить `cards.height`, `gallery.type`, `gallery.position`,
  `sphere.rowGap`, `sphere.width`, `sphere.height`, `sphere.rotation` (`property-edit`, global); удалить
  `cards.scale`; отдельные записи: `gallery.images` — `capability: "collection-edit"` (без
  `selectionScope`), `id: "panel-gallery-images"`; `sphere.rows` — `capability: "collection-edit"`,
  `id: "panel-sphere-rows"` (поля записей — часть той же операции). Для `sphere.rotation` в `reason`
  зафиксировать: «panel-owned surface rotation because the cross-origin, pointer-transparent iframe
  cannot host the Orientation Gizmo or direct drag» (evidence `user-request`).
- `productSummary`/`requestedBehavior`/`fixture` — обновить формулировки («sixteen-card row» →
  «uploaded or authored images in mirrored rows or a rotatable multi-row sphere gallery»).
- Строки acceptance:
  - `gallery.images` — `componentType: "fileDrop"`, `evidence: "media-lifecycle"`,
    `mediaLifecycleCoverage: ["upload","remove","reset","rotate","flip","transform-output","reorder","order-output"]`,
    `interactionId: "panel-gallery-images"`.
  - `gallery.type` — segmented, `optionCoverage: ["rows","sphere"]`.
  - `cards.height` — slider (rows-ветка), observable: все карточки строк меняют высоту, ширина следует аспекту.
  - `sphere.rows` — `componentType: "collectionActions"`, `controlPartCoverage:
    ["collectionActions.add","collectionActions.items","collectionActions.remove"]`, `interactionId:
    "panel-sphere-rows"`, observable: `+` добавляет ряд (`data-hero-gallery-rows` растёт), правка поля
    `Height/Offset/Speed` меняет `data-hero-gallery-row-signature` и пиксели, `−` удаляет последний ряд.
  - `sphere.rowGap`, `sphere.width`, `sphere.height` — slider.
  - `sphere.rotation` — vector, `controlPartCoverage: ["vector.x","vector.y"]`, observable:
    `data-hero-gallery-rotation` и пиксели меняются по обеим осям.
  - `gallery.position` — vector, `controlPartCoverage: ["vector.x","vector.y"]`.
  - удалить `cards.scale`; `cards.safetyWidth`/`cards.roll` остаются (applicability-кейсы появятся
    автоматически из селектора `gallery.type`).
- Inventory: записи `gallery-images`, `gallery` (entityId `hero-gallery-surface`, 10 targets),
  `gallery-placement` (вместо `cards`/`hero-card-row`).

`src/app/app-performance.ts`: без новых envelope dimensions; обновить `fidelityRisks`,
`performanceRisks` (один полноэкранный retained WebGL-канвас сферы; ≤ 6 рядов × ≤ 24 POT-текстур
≤ 2048 px с мипмапами; конвейерная анимация внутри iframe; bleed/overlap overdraw с blending),
`expectedObservable` — ветка `"media-import"`; сценарии по-прежнему выводятся из
`deriveToolcraftPerformancePaths`.

Unit-тесты (`src/app/hero-preview.product.test.ts` + новый `src/app/hero-gallery-values.test.ts`):

- previewCases: заменить `cards.scale` на `cards.height` (`read: s => s.gallery.rows.cardHeight`),
  перевести `cards.gap/roll/safetyWidth` на `s.gallery.*`; добавить `gallery.type` (`"rows"`),
  `gallery.position` (`{x:0.5,y:-0.4}`), `sphere.rows` (`[{height:420,offset:30,speed:-6},{height:200,
  offset:0,speed:3}]`), `sphere.rowGap` (80), `sphere.width` (1800), `sphere.height` (500),
  `sphere.rotation` (`{x:0.25,y:-0.5}` → `{yaw:45,pitch:-45}`); имена `it(...)` = `automatedTestName`.
- `gallery.images maps runtime media assets into the hero preview payload` — порядок, фильтр по
  `sourceTarget`, пропуск `unavailable`, transform/size нормализация, пустой список.
- `hero-gallery-values.test.ts`: clamp рядов (7 записей → 6, пустой → default, NaN-поля → default поля),
  rotation-маппинг, `isHeroPreviewStateMessage`, `createHeroPreviewMediaMessage`, версия 9.

## 6. Сайт (`recraft-v4-styles/src/components/pages/home/`)

### 6.1 `hero-scene-settings.ts`

- [ ] `interface HeroGalleryImage`, `interface HeroSphereRow`, `interface HeroGallerySettings` (зеркало
      §5.2), `gallery` в `HeroSceneSettings`; удалить верхнеуровневые `cardGap/cardRoll/cardSafetyWidth/cardScale`.
- [ ] `numericBounds`: `galleryGap: [-240, 160]`, `galleryPosition: [-1, 1]`, `rowsCardHeight: [80, 1080]`,
      `rowsSafetyWidth: [320, 1440]`, `rowsRoll: [0, 85]`, `sphereSize: [200, 6000]`, `sphereRowGap:
      [-200, 400]`, `sphereRowHeight: [80, 1080]`, `sphereRowOffset: [-180, 180]`, `sphereRowSpeed: [-45, 45]`,
      `sphereYaw: [-180, 180]`, `spherePitch: [-90, 90]`; `normalizeHeroSceneSettings`: `type` ∈ {rows,
      sphere} (иначе default), `images` ≤ 24 валидных записей, `sphere.rows` — 1..6 записей (невалидные
      отбрасываются, пустой список → default), остальное через `clampNumber`.
- [ ] `defaultHeroSceneSettings.gallery`: `{ type: 'rows', cardGap: 10, position: {0,0}, images: [],
      rows: { cardHeight: 330, safetyWidth: 883, roll: 85 }, sphere: { width: 900, height: 900, rowGap: 24,
      rotation: { yaw: 0, pitch: 0 }, rows: [{ height: 340, offset: 0, speed: 3 }] } }` (330 px ≈ прежние
      98 % × clamp при 1920 px для 7:9).

### 6.2 `hero-preview-boundary.tsx`

- [ ] `previewProtocolVersion = 9`; принимать `settings` и `media` (тот же origin/source-check); `media` →
      `ingestHeroGalleryMedia(images)` стора; слать `ready` с v9.
- [ ] Колбэк `onState` из галереи → `window.parent.postMessage({ channel, version: 9, type: 'state',
      payload }, trustedParentOrigin)`; не слать, если не embedded.

### 6.3 Общий шейдер дисперсии

- [ ] Вынести `FRAGMENT_SHADER`, `compileShader`, `clampBacking`, `createRollerMesh` и функцию установки
      юниформов дисперсии из `hero-card-dispersion-webgl.ts` в новый `hero-dispersion-shader.ts` (без
      изменения уравнений); добавить юниформ `uScreenSize` и использовать его в строке `canvasX =
      gl_FragCoord.x / uBackingSize.x * uScreenSize.x`; per-card рендер передаёт `uScreenSize = (cssWidth,
      cssHeight)`. Файлы ≤ 1000 строк.
- [ ] Rows рендерит побайтно так же (сравнить скриншоты до/после при одинаковых настройках).

### 6.4 `hero-gallery-media-store.ts` + `hero-gallery-sources.ts` (новые, вне React)

- [ ] Вынести `portraitImages` в `hero-gallery-sources.ts` (используется Rows, стором и fallback'ом).
- [ ] Map<ref, { blob, objectUrl, bitmap: ImageBitmap | null, width, height, status: 'decoding' | 'ready'
      | 'error', lastUsed }>; `ingestHeroGalleryMedia(images)` → `createImageBitmap(blob)` для размеров,
      затем `createImageBitmap(blob, { resizeWidth: potW, resizeHeight: potH, resizeQuality: 'high' })` —
      степени двойки ≤ 2048 по каждой стороне (аспект хранится отдельно, UV нормализованы) — чтобы WebGL1
      строил мипмапы; `objectUrl` для Rows `<img>` и DOM-fallback.
- [ ] Авторские портреты: для WebGL грузить оптимизированный вариант через `getImageProps({ src, width:
      1080, height: 1389, quality: 75 }).props.src` из `next/image` (не сырой 1792×2304 PNG), далее тот же
      POT-ресайз; ключ кэша — URL.
- [ ] `resolveHeroGallerySources(gallery)` → `HeroGalleryImageSource[]` `{ key, id, ready, width, height,
      transform, bitmap?, url }` (пустой набор ⇒ 8 портретов, `id` = имя файла) и
      `splitHeroGallerySourcesByRow(sources, rowCount)` → round-robin по A7 (ряд без картинок получает
      полный набор).
- [ ] `subscribe`/`getSnapshot` для `useSyncExternalStore`; GC записей, не упомянутых в последних settings
      > 5 с (`URL.revokeObjectURL`, `bitmap.close()`, колбэк рендеру на удаление текстуры).

### 6.5 `hero-sphere-layout.ts` (новый, чистый)

- [ ] `layoutHeroSphereRows({ rows, rowGap, ry })` → `Array<{ phiCenter, deltaPhi, radius, height }>` по §4.2.
- [ ] `layoutHeroSphereGallery({ rowSources, rowLayouts, gap, rx, ry, focal, viewport, principal,
      rotation, phases, bleed })` → `{ cards: Array<{ rowIndex, sourceIndex, copy, thetaCenter, phiCenter,
      arcWidth, side, order, centerX }>, periods: number[] }` по §4.3–§4.4 (окно в один оборот, копии,
      отсечение по 8 опорным точкам, painter's порядок).
- [ ] `projectHeroSpherePoint(theta, phi, params)` → `{ x, y, z }` (с поворотом) и
      `advanceHeroSpherePhase(phase, speedDegPerSecond, dtMs, period, previousPeriod)`.
- [ ] Проверка математики: на сайте нет test-runner'а — не добавлять зависимости. Опционально
      `node --test src/components/pages/home/hero-sphere-layout.test.ts` (Node ≥ 22.18 исполняет erasable
      TS нативно; файл не попадает в Next-сборку, если не импортируется) или проверка через Toolcraft
      browser-спеку по `data-hero-gallery-*`.

### 6.6 `hero-sphere-gallery-webgl.ts` (новый)

- [ ] `createHeroSphereGalleryRenderer(canvas)` — WebGL1 с теми же атрибутами контекста, что у per-card
      рендера, плюс `gl.enable(gl.BLEND)`, `blendFunc(ONE, ONE_MINUS_SRC_ALPHA)`, `enable(CULL_FACE)`.
- [ ] Одна программа: новый `SPHERE_VERTEX_SHADER` (§4.4) + общий фрагментный шейдер (§6.3). Юниформы
      вершинного: `uViewSize`, `uCardOrigin`, `uCardSize`, `uThetaCenter`, `uPhiCenter`, `uRowRadius`, `uRy`,
      `uCenter`, `uRotation` (mat3), `uFocal`, `uProjection` (mat4), `uNdcOffset`; фрагментного — как
      сейчас + `uScreenSize`, `uSide` per card, `uCanvasViewportX = 0`, `uViewportWidth = W`, `uVelocity` per card.
- [ ] Сетка: `createRollerMesh(48, 12)` — одна VBO; bleed через `uViewSize/uCardOrigin`.
- [ ] Кэш текстур по `key` (`ref` или URL) + transform: `texImage2D(bitmap)`, `generateMipmap`,
      `LINEAR_MIPMAP_LINEAR`/`LINEAR`, `CLAMP_TO_EDGE`; rotate/flip **запекаются** при загрузке (bitmap
      рисуется в 2D-канвас с поворотом/отражением, затем `texImage2D(canvas)`) — шейдер не меняется.
- [ ] Цикл: `requestAnimationFrame` только когда хотя бы у одного ряда `speed ≠ 0`, или затухает motion
      boost, или есть «грязные» юниформы/размер; пауза при `document.hidden` и когда канвас не пересекает
      вьюпорт (`IntersectionObserver`); `matchMedia('(prefers-reduced-motion: reduce)')` ⇒ фазы не идут
      (статичный кадр), `data-hero-gallery-row-signature` при этом отражает настроенные скорости.
- [ ] `ResizeObserver` на `[data-hero-scene]` → `clampBacking` + перерисовка; `webglcontextlost` ⇒
      `preventDefault`, `renderer: 'fallback'`; `webglcontextrestored` ⇒ пересоздать программу/текстуры.
- [ ] API: `setSettings(settings)`, `setSources(rowSources)`, `getState(): { renderer, readyIds, phases }`,
      `dispose()`. Файл ≤ 1000 строк; при росте вынести текстурный кэш в `hero-sphere-gallery-textures.ts`.

### 6.7 `hero-sphere-gallery.tsx` (новый, `'use client'`)

- [ ] Монтирует `<div data-hero-gallery="sphere" data-hero-gallery-type="sphere" data-hero-gallery-ready
      data-hero-gallery-order data-hero-gallery-signature data-hero-gallery-rows data-hero-gallery-row-signature
      data-hero-gallery-rotation data-hero-gallery-renderer className="absolute inset-0">` с `<canvas
      data-hero-gallery-canvas data-dispersion-ready aria-hidden className="pointer-events-none absolute
      inset-0">` и скрытым DOM-fallback (`<div data-hero-gallery-fallback hidden>` — ряды плоских `<img
      alt="">` по `objectUrl`/авторским URL — только без WebGL).
- [ ] Подписан на settings (проп) и на media store (`useSyncExternalStore`); обновляет атрибуты (фазу
      первого ряда — не чаще 4 раз/с, диагностика: `data-hero-gallery-phase`), вызывает `onState`.
- [ ] Никакого текста/UI внутри канваса.

### 6.8 `hero-v4-styles.tsx`, `hero-dispersion-card.tsx` (Rows)

- [ ] `HeroV4Styles` по `settings.gallery.type` рендерит `HeroCardScene` (rows) или `HeroSphereGallery`;
      `HeroCardScene` получает обёртку с `translate3d(x·36vw, y·28vh, 0)` вокруг обеих `CardStack` (для
      Sphere сдвиг внутри проекции). Порядок слоёв сохраняется для обоих типов.
- [ ] `CardStack`: карточки из `resolveHeroGallerySources` по правилу §4.5; `style={{ height:
      rows.cardHeight, aspectRatio }}`, без `aspect-[7/9]`/`width: clamp`; `motionKey` включает
      `cardHeight`, `position`, сигнатуру источников; атрибуты `data-hero-card*` сохраняются.
- [ ] `HeroDispersionCard` принимает `source: HeroGalleryImageSource` вместо `src`: авторский — `next/image`
      как сейчас (`sizes` вычислять из `cardHeight × аспект`); загруженный — `<img src={source.url} alt="">`
      (blob URL same-origin; `next/image` с `blob:` не работает без `unoptimized`); `onLoad`/`ref` без
      изменений; transform — CSS `transform` на `<img>` fallback и запекание в текстуру при создании рендера.
- [ ] `HeroCardScene` выставляет `data-hero-gallery="rows"` + `data-hero-gallery-*` (order = порядок
      источников по слотам, signature, `rows="2"`) и шлёт `state` через тот же `onState`.

### 6.9 Проверки сайта

- [ ] `pnpm exec oxfmt <тронутые файлы>`, `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm build`,
      `git diff --check` из корня `recraft-landing`.
- [ ] Ручной визуальный контроль standalone `http://localhost:3000/` (rows, дефолты Delivery 9 не
      изменились) и embedded в Toolcraft (sphere по умолчанию, 1 → 3 → 6 рядов, разные высоты/скорости/
      смещения, отрицательный row gap, yaw 360°, pitch ±90°, смена типа).

## 7. Toolcraft browser-проверки (`e2e/`, app-owned файлы)

- [ ] `hero-preview-browser-helpers.ts`: `waitForWebsitePreview` ждёт заголовок и
      `[data-hero-gallery][data-hero-gallery-ready="true"]` в iframe (вместо 16 карточек); добавить
      prerequisite «остановить ряды» — через UI установить `speed = 0` у каждого ряда (редактируемое
      числовое значение слайдера поля `Speed` в записи коллекции) перед кейсами в sphere-ветке — иначе
      `expectToolcraftProductObservableToChange` со `stabilitySamples` не стабилизируется на анимирующемся
      превью. Альтернатива — `page.emulateMedia({ reducedMotion: "reduce" })` до `goto` (проверить, что
      эмуляция доходит до OOPIF-iframe; если да — использовать её и оставить prerequisite как страховку).
- [ ] Кейс `sphere.rows`: отдельная спека `e2e/app-gallery-rows.spec.ts` —
      `expectToolcraftCompoundControlPartOutcome` (или generic product-observable) для `collectionActions.add`
      (`data-hero-gallery-rows` 1 → 2 и пиксели), `collectionActions.items` (правка `Height` второй
      записи: `data-hero-gallery-row-signature` и пиксели), `collectionActions.remove` (2 → 1); скорость
      проверять по продвижению `data-hero-gallery-phase` при `speed = 12` и замиранию при 0 (без
      пиксельной стабильности).
- [ ] Кейсы `gallery.type` (segmented, обе опции), `cards.height` (rows-ветка), `sphere.rowGap`,
      `sphere.width`, `sphere.height`, `sphere.rotation` (обе оси, `data-hero-gallery-rotation`),
      `gallery.position` (обе оси) — через `registerHeroPreviewControlTests`; для `cards.safetyWidth`/
      `cards.roll` applicability-кейсы добавятся автоматически (`getToolcraftControlApplicabilityCases`),
      проверить, что `selectApplicabilityBranch` умеет выбирать `Rows`, а `expectCenteredSafetyCorridor`
      вызывается только в rows-ветке.
- [ ] Новый `e2e/app-gallery-media.spec.ts` (требование `media-lifecycle` для `gallery.images`):
      `session.observe(root => ({ itemIds: dataset.heroGalleryOrder.split(","), outputSignature:
      dataset.heroGallerySignature }))` с обёртки `[data-toolcraft-product-output="hero-external-preview"]`;
      шаги через реальный UI FileDrop (`input[type=file]` → `setInputFiles` двумя PNG-фикстурами разного
      аспекта; drag-reorder миниатюр; выбор миниатюры → `90°` → `Flip H`; удаление; section reset / `Reset
      controls`). upload/reorder/remove/reset — через `expectToolcraftMediaLifecycle` (`itemIds` = порядок
      id, `outputSignature` = `data-hero-gallery-signature`, для пустого набора — `"authored-portraits"`);
      rotate/flip — либо тоже через него с `itemIds` вида `${id}:${rot}:${fh}:${fv}`, либо через
      `expectToolcraftProductObservableToChange(session, session.controlAction("gallery.images", …),
      { requirementId: "gallery.images", selector: heroPreviewSelector })`. Перед выбором прочитать
      `e2e/browser-runtime-evidence-requirements.ts` и `e2e/toolcraft-feature-verification-reporter.ts`.
      Reorder миниатюр — dnd-kit: мышиный drag с `steps` или клавиатурный сенсор, если включён.
- [ ] `app-controls.spec.ts`: тест «supplied portrait cards» разделить — sphere-smoke (default: один
      канвас, `data-hero-gallery-ready`, 8 авторских id в order, `rows="1"`) и rows-smoke (выбрать `Rows`,
      затем существующие проверки 16 карточек/path; `aspect-ratio: 7 / 9` → равенство высоты
      `cards.height`); в тесте «out of scope» убрать ожидание `input[type="file"]` = 0 и заменить `Cards`
      на `Gallery`; проверить отсутствие transport-кнопок (autonomous).
- [ ] `app-persistence.spec.ts` — без изменений, если persistence-мета-тест не потребует
      media-доказательства; иначе добавить загрузку одной картинки и её восстановление после reload.
- [ ] Playwright-фикстуры: 2 небольших PNG (300×400 и 400×300) в `e2e/fixtures/gallery/`, без правок
      `playwright.config.ts` (signed).

## 8. Порядок задач

### Task 1 — Toolcraft значения и протокол

**Files:** create `src/app/hero-gallery-values.ts`, `src/app/hero-gallery-values.test.ts`; modify
`src/app/hero-preview-protocol.ts`, `src/app/hero-preview.product.test.ts`.

- [ ] Перечитать актуальные `hero-preview-protocol.ts`/`hero-preview.product.test.ts` (v8, 40+ кейсов).
- [ ] Targets/defaults/типы из §5.1–§5.2, чистые `createHeroGalleryImagesFromMediaAssets` и
      `createHeroGallerySettingsFromValues` (включая валидацию `sphere.rows` и rotation-маппинг).
- [ ] Протокол v9: `gallery` в payload, `media`/`state` сообщения и guard'ы; удалить `cardScale` и
      верхнеуровневые card-поля.
- [ ] Unit-тесты §5.4 зелёные (`npm exec vitest run src/app/hero-gallery-values.test.ts
      src/app/hero-preview.product.test.ts`).

### Task 2 — Схема, инвентарь, readiness, performance

**Files:** modify `src/app/app-schema.ts`, `src/app/app-acceptance-data.ts`, `src/app/app-performance.ts`,
`src/app/hero-preview-pipeline.ts`.

- [ ] Секции `Gallery Images`, `Gallery` (10 контролов с `semanticGroup`, условная applicability,
      `collectionActions` с `itemControls`), `Gallery Placement`; удаление `cards.scale`; Pattern/Prompt/
      Heading не трогать.
- [ ] `animationIntent: autonomous`, ownership, acceptance-строки, inventory (§5.4).
- [ ] Пасс `media-sync` + invalidation `media-import`; `runtimeId` v9; риски в performance.
- [ ] `npm run typecheck`, `pnpm ai:check`, `npm exec vitest run src/app` — все мета-тесты (section
      size/semanticGroup, dependency grouping, applicability, compound-part coverage, media-upload
      coverage, animation intent, performance envelope/pipeline) зелёные.

### Task 3 — Мост медиа и state в `hero-preview.tsx`

**Files:** modify `src/app/hero-preview.tsx`, `src/app/app-composition.tsx`.

- [ ] `renderDefaultCanvasMedia: false`.
- [ ] `images` из `state.mediaAssets`; `PreviewMediaSync` с `useToolcraftMediaPresentationUrls` +
      `fetch(url).blob()` + `postMessage(media)`; сброс отправленных `ref` по `ready`.
- [ ] Приём `state`, атрибуты `data-hero-gallery-*` на product-output обёртке.
- [ ] Ручная проверка, пока сайт ещё на v8: Toolcraft не падает (сайт игнорирует v9) — затем Task 4.

### Task 4 — Сайт: протокол, стор медиа, общий шейдер

**Files (site):** modify `hero-scene-settings.ts`, `hero-preview-boundary.tsx`,
`hero-card-dispersion-webgl.ts`; create `hero-dispersion-shader.ts`, `hero-gallery-media-store.ts`,
`hero-gallery-sources.ts`.

- [ ] §6.1–§6.4. Rows продолжает работать с авторскими картинками (скриншотная регрессия до/после).
- [ ] `pnpm exec oxfmt <files>`, `pnpm typecheck`, `pnpm lint`.

### Task 5 — Сайт: сферический рендер с рядами и поворотом

**Files (site):** create `hero-sphere-layout.ts`, `hero-sphere-gallery-webgl.ts`, `hero-sphere-gallery.tsx`;
modify `hero-v4-styles.tsx` (+ `hero-v4-styles.module.css` при необходимости).

- [ ] §4.1–§4.4, §6.5–§6.7. Проверить вручную: центральная карточка экваториального ряда плоская и ≈ высоте
      ряда; боковые увеличиваются и изгибаются; ряды стекаются сверху вниз с `rowGap`, верхние/нижние
      ряды сужаются к полюсам; у каждого ряда своя высота/смещение/скорость (в т.ч. отрицательная);
      `sphere.width` меняет кривизну, `sphere.height` — вертикальный изгиб; yaw крутит композицию по
      кругу без видимого шва, pitch наклоняет; гэп/перекрытие; бесшовный повтор при 2–3 картинках; маска
      дисперсии у краёв вьюпорта; `gallery.position` сдвигает композицию, эффект остаётся у краёв экрана.
- [ ] Контекст-лосс и отсутствие WebGL показывают fallback.

### Task 6 — Сайт: Rows с загруженными картинками и высотой

**Files (site):** modify `hero-v4-styles.tsx`, `hero-dispersion-card.tsx`.

- [ ] §4.5, §6.8. Rows-геометрия (path/safety) не изменилась при `type = rows`.
- [ ] Полный набор проверок сайта (§6.9).

### Task 7 — Browser-проверки Toolcraft и worklog

**Files:** modify `e2e/hero-preview-browser-helpers.ts`, `e2e/app-controls.spec.ts`; create
`e2e/app-gallery-media.spec.ts`, `e2e/app-gallery-rows.spec.ts`, `e2e/fixtures/gallery/*.png`; modify
`docs/toolcraft/agent-worklog.md`.

- [ ] §7 целиком.
- [ ] `npm run test:feature -- gallery.images gallery.type cards.height sphere.rows sphere.rowGap
      sphere.width sphere.height sphere.rotation gallery.position cards.safetyWidth cards.roll cards.gap`
      (при необходимости разбить на несколько вызовов).
- [ ] Worklog: запись `Delivery 16 — Uploadable images, multi-row rotatable sphere gallery` по шаблону
      (request, task type, user-visible result, source checked, docs read, rules applied, view interaction
      `fixed-camera` unchanged + evidence для panel-owned rotation, interaction ownership, decision,
      alternatives, state/output mapping, performance intent `ordinary-product-work`, verification, risks);
      обновить блоки Status (v9), Decisions (Renderer, Timeline → autonomous animation, Layers — по-прежнему
      нет, Controls, Performance), Verification и Risks.

## 9. Verification note

Предусловие для всех browser-проверок Toolcraft: сайт должен работать на `http://localhost:3000/` (`pnpm
dev` в `recraft-v4-styles`) — `playwright.config.ts` поднимает только Vite-сервер Toolcraft. Toolcraft dev
— `npm run dev` (сохранённый порт, сейчас 3003). Если действует standing-инструкция пользователя «без
проверок» — пропустить `Run`, но оставить список в worklog как «не запускалось».

```md
Verification tier: Tier 3
Reason: Later feature edit adds media upload, a collection of up to six sphere rows, surface rotation, and a new website-owned WebGL renderer; changes the versioned bridge (v9), replaces one control, adds seven controls with conditional applicability, and introduces autonomous animation; Toolcraft runtime internals are unchanged.
Run: npm run typecheck; pnpm ai:check; npm exec vitest run src/app (product, schema, acceptance, performance meta-tests); npm run test:feature -- <acceptance ids above>; focused Playwright media-lifecycle and rows specs; website oxfmt/format/lint/typecheck/build + git diff --check; live visual checks of both gallery types embedded and standalone.
Skip: repeated npm run verify:delivery (initial receipt exists); measured performance and verify:perf (not requested); export matrices (no artifact export).
```

## 10. Риски и открытые вопросы

- Параллельные правки в этом дереве: перед каждой задачей перечитывать файлы; конфликтующие доставки
  (Pattern/Prompt/Heading) не откатывать.
- Два dev-сервера обязаны идти на одной версии протокола; порядок выкладки — Toolcraft v9 раньше сайта
  допустим (сайт игнорирует), наоборот — превью пустое до обновления Toolcraft.
- Секция `Gallery` ровно на пределе (10 контролов). Любой новый контрол сферы потребует либо удаления
  Rows-режима (A1-упрощение), либо выделения новой сущности с собственным workflow-обоснованием.
- Вращение через Vector — сознательное отступление от «Vector не для orbit» из `component-rules.md`,
  обоснованное невозможностью гизмо над кросс-origin iframe; записать в worklog как evidence-backed.
- При большом pitch «шов» ленты ряда (для `Λ_r > 2π`) может войти в кадр у верхнего/нижнего края; ряды с
  |φ| → 80° сильно сжимаются по долготе — это геометрия сферы, но стоит ограничить подсказкой в
  `description` и визуально проверить.
- Анимация внутри iframe не знает о pan/zoom Toolcraft (`AGENTS.md` п.9). Для v1 принимаем; при жалобе
  на плавность — отдельная доставка с паузой анимации на время жеста.
- Браузерные пруфы на анимирующемся превью требуют `speed = 0` у всех рядов / reduced-motion (§7).
- Память GPU: до 24 текстур POT ≤ 2048 px + мипмапы (~450 MB в худшем случае); при жалобах снизить cap до
  1024 или `hardMaxItems` до 16.
- Большие загрузки едут через structured clone один раз на сессию iframe; при HMR сайта пересылаются
  заново — только dev-эффект.
- `persistence`: слайс `media` добавится автоматически; если `app-acceptance.persistence-coverage`
  потребует доказательства восстановления медиа после reload — расширить спек (§7).
- Если протектед-репортер не принимает несколько `media-lifecycle` вложений на один requirementId —
  объединить шаги; если не хватает prerequisite'ов в app-owned helper — добавить (он не signed).
- `scene.perspective` min 200 — поведенческое изменение диапазона; если оставить 600, сильный «туннель»
  достигается меньшим `sphere.width`.
- Запекание transform в текстуру дублирует bitmap для разных трансформаций одной картинки (редко,
  ограничено 24 элементами) — приемлемо.
