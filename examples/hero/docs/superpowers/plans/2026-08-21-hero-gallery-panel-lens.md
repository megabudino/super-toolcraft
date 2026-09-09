# Hero Gallery — «панно сквозь линзу»: единое полотно рядов и пан по холсту (план)

> **For agentic workers:** план рассчитан на выполнение по задачам (checkbox `- [ ]`) с
> `superpowers:subagent-driven-development` или `superpowers:executing-plans`. Перед правками
> обязателен preflight из `AGENTS.md` → `docs/toolcraft/workflow.md` (маршруты «Schema, controls…»,
> «Renderer, canvas output…», «Timeline, keyframes, animation transport», «Export, copy, media,
> background»; Plan-фаза до спеки, Implementation-фаза перед кодом, Verification-фаза перед пруфом).
> Этот файл — единственный документ доставки (дизайн §1–§4 + план §5–§10); отдельной спеки нет.
>
> **Контекст.** Delivery 20 (`docs/toolcraft/agent-worklog.md`) реализовала план
> `2026-08-21-hero-sphere-gallery.md`: загрузка картинок, Rows/Sphere, 1–6 рядов с **собственной
> высотой**, жёсткий поворот поверхности yaw/pitch (`sphere.rotation`), протокол **v9**. Пользователь
> настроил первый экран (`herosettings.json`: 3 ряда 278/747/279 px, perspective 1580, sphere 610 × 640,
> rowGap 17, gap 35) и принял, **как деформируется средний ряд**. Остальное меняется этой доставкой.
> Номер следующей записи worklog — **Delivery 21** (перепроверить перед записью), протокол моста →
> **v10**.
>
> **Параллельная работа.** В этом дереве параллельно идут другие доставки (в т.ч. план
> `2026-08-21-pre-footer-toolcraft-bridge.md` — отдельное приложение `recraft-tools/pre-footer` и новый
> preview-маршрут сайта). Перед правкой каждого файла перечитывай его актуальное состояние, не
> откатывай чужие изменения, не коммить без разрешения пользователя.
>
> **Режим проверки.** Delivery 20 сдавалась по standing-инструкции пользователя «без тестов / lint /
> typecheck / build — отдать на ревью». Уточни, действует ли она; по умолчанию выполняй §9. В любом
> случае browser-спеки галереи из Delivery 20 **не были написаны** (см. §7 «долг») — не считай их
> существующими.
>
> **Одно решение на стороне пользователя (дефолт принят, см. D6):** горизонтальный пан по холсту
> бесконечный — значение заворачивается на ±180°, а сайт хранит «обороты» (`pan.turns`), чтобы картинка
> не прыгала и Apply воспроизводил композицию точно. Если пользователь предпочтёт ограничить драг
> ±180° без оборотов — заменить `wrap` на `clamp` в одной функции (§3.5) и убрать `turns` (§6.1).

---

## 1. Цель и поведение

Пользователь описал механику так: «все ряды должны деформироваться как одно полотно… мы задаём размер
только среднего ряда, а остальные ряды скейлим относительно него… мы можем перемещаться по этому канвасу
с изображениями… когда тянем верхний ряд ниже, он постепенно деформируется под дефолтный средний…
панно бесконечное, условно 3 ряда крутятся друг за другом… я кручу не сферу, а проекцию картинок».

Это означает замену модели: вместо «ряды разной высоты на вращаемой сфере» — **неподвижная линза
(искажение экрана) + бесконечное плоское панно картинок, которое протягивается сквозь линзу**.

Поведение, которое должно получиться (проверяется вручную и browser-пруфами):

- **B1 — одно полотно.** Все ряды имеют одну высоту карточки (`cards.height`) и один вертикальный гэп
  (`sphere.rowGap`) в координатах панно. Деформацию задаёт только положение на экране: ряд, оказавшийся
  в центре линзы, выглядит ровно так, как сейчас выглядит средний ряд; ряды выше/ниже — так, как
  выглядел бы средний ряд, сдвинутый туда же. Расстояния между рядами следуют той же деформации.
- **B2 — пан по холсту.** В Toolcraft над превью (режим Sphere) плоский драг первичной кнопкой без
  модификаторов тянет панно: картинки следуют за курсором (точно в центре линзы, с усилением линзы —
  к краям). Alt/Shift/Ctrl/Cmd + драг, колесо и пинч по-прежнему управляют холстом Toolcraft;
  не-первичные кнопки хэндл игнорирует (холст их тоже не использует). Тот же пан доступен
  пад-контролом `Pan` в панели (точные значения, reset двойным кликом, persistence, history, Apply).
- **B3 — бесконечность по вертикали.** Стек из `n` рядов повторяется с периодом `V = n·шаг`: тянем
  вниз — сверху приходит последний ряд, и так без конца. Полный период — ровно то же изображение.
- **B4 — бесконечность по горизонтали.** Каждый ряд — бесконечная лента (как сейчас); пан сдвигает все
  ленты на одинаковое число px; за ±180° линзы значение заворачивается без визуального скачка (D6).
- **B5 — морфинг.** Тянем верхний ряд вниз — он непрерывно превращается в «средний» вид; ничего не
  «встаёт» скачком, нет шапок у полюсов от жёсткого наклона.
- **B6 — линза настраивается по всем трём осям.** `sphere.width` (Rx) — горизонтальная кривизна (то,
  что понравилось в среднем ряду), `sphere.height` (Ry) — вертикальная кривизна/спад к верхним и нижним
  рядам, **`sphere.depth` (Rz, новый)** — глубина туннеля: насколько края наезжают на зрителя независимо
  от изгиба в плоскости экрана. `scene.perspective` — как сейчас (камера в `z = f`; при `f > 2·Rz` камера
  снаружи смотрит на дальнюю внутреннюю стенку — текущий любимый вид пользователя сохраняется, потому что
  дефолт `depth = width`).
- **B7 — анимация.** Каждая лента едет со своей знаковой скоростью (`°/s` долготы линзы) и имеет своё
  базовое смещение (`°`); autonomous-режим без транспорта остаётся.
- **B8 — края.** Edge Zone / Edge Warp / Dispersion & Aura / Boundary Aura и motion boost работают как
  сейчас (фрагментный шейдер не меняется); драг по холсту даёт тот же «streak», что и анимация.

Не меняется: архитектура (редактирование в Toolcraft, рендер на сайте в iframe, единственный источник
финала — сайт), режим Rows (кроме общего `cards.height`), загрузка картинок, Apply/Reset, Position-пад
композиции, секции Background/Pattern/Heading/Prompt/Projection/эффектов. **Функционал не сокращается**:
Rows остаётся; чтобы уместить контролы линзы, секция Gallery разносится на три секции — `Gallery`
(контент), `Lens` (линза) и `Gallery Placement` (Position + Pan), см. §5.1.

## 2. Что проверено в коде (факты, на которые опирается план)

Сайт (`recraft-v4-styles/src/components/pages/home/`), состояние после Delivery 20:

- `hero-sphere-layout.ts`: `layoutHeroSphereRows` — стек рядов по высотам, `radius = rx·cos(clamp(φ,
  ±80°))` **на ряд**; `projectHeroSpherePoint` — локальная точка `(Rx sinθ cosφ, Ry sinφ, −Rx cosθ cosφ)`,
  затем yaw→pitch повороты, `+Rx` по z, `scale = f / max(f − z, 1)`; `layoutHeroSphereGallery` — окно
  долготы `[−yaw − π, −yaw + π)`, копии ленты `±(ceil(π/period)+1)` (≤ 48), отсечение по 8 опорным
  точкам (достаточно одной внутри вьюпорта и `z < f − 1`), сортировка `depth → row → θ`, лимит 96;
  `advanceHeroSpherePhase` в радианах с пропорциональным пересчётом при смене периода. Именно
  `cos φ`-радиус на ряд + жёсткий pitch дают «шапку» сверху и огромный средний ряд на скриншоте
  пользователя; в модели панно радиус постоянный, поворота нет.
- `hero-sphere-gallery-webgl.ts`: один WebGL1-канвас, `SPHERE_VERTEX_SHADER` с `uThetaCenter`,
  `uPhiCenter`, `uRowRadius`, `uRx`, `uRy`, `uYaw`, `uPitch`, `uFocal`, `uPrincipal`, `uScreenSize`,
  `vPoint = point` (card-space px); общий `HERO_DISPERSION_FRAGMENT_SHADER`; per-card uniforms
  `uViewSize = (arcWidth + 512, height + 160)`, `uCardOrigin = (256, 80)`, `uSide`; velocity по
  сглаженной Δ `centerX` с ключом `${row}:${source.key}:${copy}`; текстуры POT ≤ 2048 с запечённым
  rotate/flip; blend ONE/ONE_MINUS_SRC_ALPHA, `CULL_FACE` (front = CW); `setActive/setReducedMotion/
  setSettings/setSize/setSources/getState/dispose`; `requestAnimationFrame` только при `speed ≠ 0`.
- `hero-sphere-gallery.tsx`: принимает `sources` пропом, `splitHeroGallerySourcesByRow` round-robin,
  атрибуты `data-hero-gallery-*` (в т.ч. `-rotation`, `-row-signature = h:o:s|…`, `-phase`),
  `onState` → `HeroGalleryRenderState`, DOM-fallback.
- `hero-scene-settings.ts`: `HeroSphereRow { height, offset, speed }`, `sphere.rotation {pitch, yaw}`,
  `rows.cardHeight`, `numericBounds` (`sphereRowHeight`, `sphereYaw`, `spherePitch`…),
  `normalizeSphereRows`; `HeroGalleryRenderState.rotation`; дефолт сайта `gallery.type: 'rows'`.
- `hero-v4-styles.tsx`: `HeroGalleryScene` выбирает `HeroSphereGallery`/`HeroCardScene`;
  `CardStack` берёт `settings.gallery.rows.cardHeight`; `HeroCardScene` тоже отдаёт `rotation`.
- `hero-preview-boundary.tsx`: `previewProtocolVersion = 9`; принимает `settings`, `media`,
  `save-settings` только от `window.parent` с trusted origin (`getTrustedParentOrigin()`); отвечает
  `ready`, `state`, `save-result`; `saveSettings` нормализует payload и пишет через `/api/hero-settings`
  (dev-only), рассылает BroadcastChannel; `intent: 'apply' | 'reset'`.
- `hero-applied-settings.json` (tracked) содержит `sphere.rows[0].height` и `sphere.rotation` — после
  смены типов эти ключи должны игнорироваться нормализатором.

Toolcraft (`recraft-tools/hero`):

- `src/app/hero-gallery-values.ts`: `heroGalleryTargets` (`cardHeight: "cards.height"`, `rotation:
  "sphere.rotation"`, `sphereRows: "sphere.rows"`, …), `HeroSphereRow {height, offset, speed}`,
  `HERO_SPHERE_ROW_DEFAULT {340, 0, 3}`, `HERO_GALLERY_DEFAULTS` (`rows.cardHeight 340`, `sphere
  {height 900, rotation {0,0}, rowGap 24, rows [default], width 900}`, `type "sphere"`),
  `sphereRowsValue` (height 80–1080), `createHeroGallerySettingsFromValues` (rotation → `{pitch: y·90,
  yaw: x·180}`).
- `src/app/app-schema.ts`: секция `gallery` — ровно **10 контролов** (`type`, `gap`, `cardHeight`
  [rows], `safetyWidth` [rows], `roll` [rows], `sphereRows` collection {height, offset, speed} [sphere],
  `rowGap`, `sphereWidth`, `sphereHeight`, `rotation` vector [sphere]); `gallery-placement` — `position`;
  `website-actions` — Reset/Apply (Delivery 17/19). `semanticGroup` на каждом контроле секции.
- `src/app/app-acceptance-data.ts`: `animationIntent: autonomous`; `referenceFeatureInventory`
  `requested.hero-sphere-gallery`; `interactionOwnership` — `panel-sphere-rotation` (property-edit,
  evidence «iframe cannot host gizmo or direct drag»), общий `.map` panel/property-edit для остальных
  target'ов; строки acceptance для `sphere.rows` (collectionActions, parts add/items/remove),
  `sphere.rotation` (vector.x/vector.y), `gallery.position`; `viewInteraction: fixed-camera`;
  `appControlSectionInventory.gallery` перечисляет 10 target'ов.
- `src/app/hero-preview.tsx`: `HeroExternalPreview` — обёртка `.preview` с
  `data-toolcraft-product-output="hero-external-preview"` и `data-hero-gallery-*` (в т.ч. `-rotation`),
  iframe `pointer-events: none` (CSS-модуль; у `.preview` нет `position`), `PreviewSyncPass`,
  `PreviewMediaSync`, приём `ready`/`state`/`save-result`, Reset-хук через history source.
- `src/app/hero-preview-pipeline.ts`: `HERO_PREVIEW_CONTROL_DRAG_TARGETS` содержит `sphere.rotation`;
  пассы `media-sync`, `preview-sync`; `runtimeId: "hero-external-preview-v9"`; допустимые interaction:
  `control-drag`, `control-change`, `media-import`, `mask-drag`, `viewport-*`, … (канвас-хэндл,
  пишущий control-target, — это `control-drag`).
- Протокол `hero-preview-protocol.ts` v9: `settings`, `media`, `ready`, `state` (payload с `rotation`),
  `save-settings`/`save-result`; `HERO_PREVIEW_DEFAULTS.vanishingPoint = {50, 44}`.
- Канвас-хэндлы в runtime: viewport-драг — bubbling `onPointerDown` (button 0 или touch) на
  CanvasShell (`use-canvas-viewport-interactions.ts`); product-элемент, вызвавший
  `event.stopPropagation()` в своём `onPointerDown`, владеет жестом; пинч двумя пальцами перехватывается
  в capture-фазе и забирает pointer capture (`lostpointercapture` у нашего элемента); колесо (пан) и
  Ctrl/Cmd+колесо (зум) обрабатываются capture-слушателем на workspace независимо от target'а.
  Эталон — `runtime/react/orientation-gizmo/orientation-gizmo.tsx`: `data-toolcraft-canvas-handle`,
  `data-testid`, `role="application"`, `aria-label`, предикат `button === 0 && !alt/ctrl/meta/shift`,
  `setPointerCapture`, запись через `dispatch({ type: "controls.setValue", target, value, history:
  "merge", historyGroup, label })` (один `historyGroup` на жест), rAF-коалесценция дельт в
  `use-toolcraft-model-orbit-interaction.ts`. Публичный API для product-кода: `useToolcraftDispatch`,
  `useToolcraftSelector` из `@/toolcraft/runtime/react` (`useToolcraftStore` не экспортируется;
  `@/toolcraft/ui/components/controls/**` импортировать нельзя — `createControlHistoryGroupId` не брать,
  id группы формировать самим).
- Валидаторы (`src/app/acceptance/`, signed): `canvas-handle-acceptance.ts` — строка `kind:
  "canvas-handle"` обязана иметь `canvasHandle { testId, writesTarget (schema target), outputObservable,
  exportCleanTestName }`, `browser + browserTestName`, `automated + automatedTestName`;
  `interaction-ownership.ts` — канвас-хэндл обязан ссылаться на `interactionId`; panel-контрол,
  делящий target с хэндлом, тоже; на пару `target + capability` — одна поверхность (canvas
  `direct-spatial-edit` + panel `property-edit` на одном target допустимы); `property-edit` требует
  `selectionScope: { mode: "global" }`, `direct-spatial-edit` — без `selectionScope`; `reason`/
  `evidence.detail`/`alternative.reason` ≥ 24 символов. Generic canvas-handle строка не считается
  acceptance самого контрола — у `sphere.pan` остаётся своя строка `kind: "control"`.
- Правила раскладки секций (signed), на которых держится разнос §5.1:
  `control-layout-dependency-rules.ts` — контрол с conditional applicability, чей селектор лежит в
  **другой** секции, ошибочен только если (а) совпадает loose-префикс target'а с селектором (`sphere.*`
  против `gallery.type` — префиксы `sphere` ≠ `gallery`, условие не срабатывает) или (б) заголовок секции
  содержит текст ветки условия (`sphere` / `Sphere`; заголовки `Lens`, `Gallery Placement` чисты);
  `control-layout-entity-rules.ts` — «split across sections» проверяется по strict-префиксу (≥ 3
  сегментов target'а), у двухсегментных `sphere.width` его нет; `control-section-entity-cohesion.ts` —
  сущности с ≤ 10 контролов обязаны жить в одной секции, поэтому у `Lens` **свой** `entityId`;
  `control-layout-section-rules.ts` — ≥ 8 контролов ⇒ `semanticGroup` у каждого; `control-labels.ts` —
  короткие метки (`Width`, `Height`, `Depth`) допустимы, когда все контролы секции делят один
  loose-префикс и заголовок не «слабый» (appearance/style/values…); метка не должна повторять заголовок.
- Browser-evidence (`e2e/browser-runtime-evidence-requirements.ts`): строка canvas-handle с `evidence:
  "product-output"` порождает требования `product-observable-change`, `canvas-handle-interaction`
  (через `dragCanvasHandle(page, testId, delta, { requirementId, target })`) и **`canvas-export-clean`**
  (через `expectExportExcludesCanvasHandles(page, exportAction, inspectArtifact, { requirementId,
  target })`, evidence привязывается к тесту с именем `canvasHandle.exportCleanTestName`). Хелпер
  требует непустой артефакт и семантическую сигнатуру (`contentHash`/`decodedPixelHash` + размеры),
  помечает хэндлы зелёным фоном/маджента-тенью и требует неизменности артефакта. В этом приложении
  экспорта нет (`exportIntent.image: user-removed`), а скриншот страницы включал бы оверлей ⇒ нужен
  артефакт **из iframe** (D9: `snapshot`-сообщение протокола). Протектед-спеки не вызывают
  `expectCanvasHandlesUseToolcraftVisualLanguage`; `expectNoForbiddenCanvasUi` допускает элементы
  `[data-toolcraft-canvas-handle]` без текста и без ролей button/slider/… .
- `component-rules.md` «Canvas Handles»: хэндлы — визуальные, без текста, в токенах, привязаны к runtime
  state, исключены из export/copy; `schema-reference.md` «Interaction Surface Ownership» — пример пары
  `direct-spatial-edit` (canvas) + `property-edit` (panel) на одном target; `acceptance-testing.md` —
  export-clean сравнивает декодированную семантику, не байты.
- `e2e/product-prompt-preview.spec.ts` — образец browser-пруфа Vector-пада (`getByRole("button", {
  name: "Position X/Y pad" })`, `expectToolcraftCompoundControlPartOutcome` для `vector.x/vector.y`,
  `freezeWebsiteMotion`). `e2e/hero-preview-browser-helpers.ts`/`product-cards-preview.spec.ts` всё ещё
  ждут 16 `[data-hero-card]` и `cards.scale` — долг Delivery 20.

## 3. Модель «панно + линза» (математика)

Обозначения: `W × H` — CSS-размер `[data-hero-scene]`; `(cx, cy) = (vp.x% · W + position.x·0.36·W,
vp.y% · H + position.y·0.28·H)` — главная точка (как сейчас); `f = perspective`; `Rx = sphere.width`,
`Ry = sphere.height`, `Rz = sphere.depth`; `h = cards.height`; `g = cards.gap`; `gv = sphere.rowGap`;
`n = sphere.rows.length`.

### 3.1 Панно

Бесконечная плоскость с координатами `u` (вправо) и `v` (вниз), px.

- Шаг рядов `p = max(h + gv, h/2)` (перекрытие не больше половины высоты — защита от вырождения
  периода при отрицательном `rowGap`); вертикальный период `V = n · p`.
- Центр ряда `r = 0..n−1` (сверху вниз): `v_r = (r − (n−1)/2) · p`; вертикальные копии `k ∈ ℤ`:
  `v_{r,k} = v_r + k·V` (ряд `r` повторяется через каждые `n` рядов ⇒ B3).
- Лента ряда: источники round-robin (`splitHeroGallerySourcesByRow`, без изменений); ширина карточки
  `w_i = h · a_i` (`a_i` — аспект с учётом rotate 90/270); слот `s_i = max(w_i + g, 1)`; период
  `Λ_r = Σ s_i` px; `start_i = Σ_{m<i} s_m`; фаза `ψ_r` (px): `ψ_r += speed_r · π/180 · Rx · dt`,
  `dt ≤ 50 ms`, хранится по модулю `Λ_r` с пропорциональным пересчётом при смене `Λ_r` (как сейчас, но в
  px). Центр карточки `i`, копия `j ∈ ℤ`:
  `u_{i,j} = offset_r · π/180 · Rx + ψ_r + start_i + w_i/2 − Λ_r/2 + j·Λ_r`.
  Положительная скорость — слева направо (рост `u` ⇒ рост экранного `x`).

### 3.2 Линза

Пан панно: `pan = sphere.pan ∈ [−1, 1)²` (Toolcraft), `turns ∈ ℤ` — обороты (сайт, §3.5).

```
Θ0 = (pan.x + 2·turns) · π                 // долгота начала панно, рад
Φ0 = −pan.y · (V/2) / Ry                   // широта начала панно, рад
θ(u) = u / Rx + Θ0                          // долгота точки панно
φ(v) = Φ0 − v / Ry                          // широта точки панно
S(θ, φ) = ( Rx·sinθ·cosφ,  Ry·sinφ,  Rz·(1 − cosθ·cosφ) )   // касательный трёхосный эллипсоид
s = f / (f − z);   screen = ( cx + x·s,  cy − y·s )
```

- Радиус **постоянный** (`Rx`, без `cos φ` на ряд) и поворота нет ⇒ поверхность неподвижна, по ней
  «едет» панно: карточка в центре линзы (`θ ≈ 0, φ ≈ 0`) плоская и равна `h` px; к краям — тот же
  «туннель», что сейчас у среднего ряда; ряд на широте `φ` сжат по горизонтали в `cos φ` и смещён на
  `Ry·sinφ` — это и есть «деформация как одно полотно» (B1, B5).
- Три оси линзы независимы: `Rx` задаёт, сколько ленты (`u = θ·Rx`) попадает в кадр и как быстро
  карточка заворачивается в плоскости экрана; `Ry` — то же по вертикали; `Rz` — глубину: на долготе `θ`
  точка уходит к зрителю на `z = Rz·(1 − cosθ·cosφ)` и увеличивается в `f / (f − z)` раз. При `Rz = Rx`
  получается нынешний эллипсоид вращения (дефолт), `Rz < Rx` — мелкая «чаша» с мягким ростом краёв,
  `Rz > Rx` — глубокий туннель; при `2·Rz ≥ f` камера оказывается внутри поверхности и ближние части
  уходят за камеру (отсекаются по §3.3).
- Направления: драг вправо ⇒ `pan.x` растёт ⇒ `Θ0` растёт ⇒ контент уходит вправо; драг вниз ⇒ `pan.y`
  растёт ⇒ `Φ0` падает ⇒ контент уходит вниз (совпадает с `coordinateMode: "screen"` Vector-пада).
- `pan.y = ±1` — сдвиг на `±V/2` ⇒ период пада по вертикали равен периоду панно: wrap в `[−1, 1)` даёт
  **идентичную** картинку (B3). `pan.x = ±1` — `±180°` долготы; полный оборот `2π·Rx` px **не** кратен
  `Λ_r`, поэтому нужен `turns` (§3.5).

### 3.3 Видимость, копии, порядок

- Окно долготы `θ ∈ [−π, π)` ⇔ `u ∈ [(−π − Θ0)·Rx, (π − Θ0)·Rx)`; диапазон копий `j` считать из окна
  (`ceil/floor`), а не перебором `±K`; при `Λ_r > 2π·Rx` шов ленты — на ближней стенке (за камерой при
  камере внутри; отсечён culling'ом при камере снаружи).
- Окно широты: рисуем карточки с `|φ_центра| ≤ 85°`; диапазон вертикальных копий `k` — из
  `v ∈ [Ry·(Φ0 − 85°), Ry·(Φ0 + 85°)]` (`ceil/floor` с учётом `h/2`), не более 12 копий на ряд.
- Отсечение карточки: 8 опорных точек bleed-расширенного прямоугольника (`±(w_i/2 + 256)`,
  `±(h/2 + 80)`) проецируются; **все** должны иметь `z ≤ f − 8` (иначе часть карточки за камерой —
  артефакты `max(f − z, 1)`), и bbox проекций должен пересекать вьюпорт с bleed (bbox, а не «хотя бы
  одна точка внутри» — иначе теряются сильно увеличенные карточки, накрывающие вьюпорт целиком).
- Лимит 96 отрисовок за кадр сохраняется; порядок painter's: по `z` (дальние первыми), затем ряд,
  затем `u`. Back-face culling как сейчас (при `f > 2·Rz` ближняя стенка невидима; при `Rz ≠ Rx`
  поверхность остаётся выпуклой, culling корректен).
- Motion boost: ключ velocity `${row}:${source.key}:${j}:${k}`; записи, не рисовавшиеся > 2 с, удалять.
  Пан по холсту меняет `centerX` карточек ⇒ даёт streak, как анимация (B8).

### 3.4 Шейдер

Вершинный шейдер — текущий минус поворот: `theta = uThetaCenter + arc / max(uRx, 1.0)`, `phi =
uPhiCenter − (point.y − uCardOrigin.y − uCardSize.y·0.5) / max(uRy, 1.0)`, `local = (Rx sinθ cosφ,
Ry sinφ, −Rz cosθ cosφ)`, `z = local.z + Rz`, `scale = uFocal / max(uFocal − z, 1.0)`, `screen =
uPrincipal + (local.x, −local.y)·scale`; `vPoint = point`. Удалить `uRowRadius`, `uYaw`, `uPitch`;
добавить `uRz`. CPU: `uThetaCenter = u_c / Rx + Θ0`, `uPhiCenter = Φ0 − v_c / Ry`. Фрагментный шейдер —
без изменений.

### 3.5 Пан: wrap, обороты, усиление драга

- Toolcraft хранит `sphere.pan = {x, y}` в `[−1, 1)`. Драг хэндла: `Δiframe = Δclient / scale`, где
  `scale = handle.getBoundingClientRect().width / handle.offsetWidth` (учёт зума холста без обращения к
  стору); `Δpan.x = Δiframe.x / (π · Rx)`, `Δpan.y = Δiframe.y / (V/2)`; `next = wrap(start + ΣΔ)`,
  `wrap(t) = ((t + 1) mod 2) − 1` (в `[−1, 1)`). В центре линзы контент следует за курсором 1:1; в
  увеличенных зонах движется быстрее курсора — допустимо (точное обратное отображение линзы —
  возможное расширение, не делать сейчас). `Rx`, `h`, `gv`, `n` читаются из `state.values`.
- Сайт ведёт `turns ∈ ℤ`: при получении новых settings, если `pan.x_new − pan.x_old < −1` ⇒ `turns += 1`;
  если `> 1` ⇒ `turns −= 1`; `Θ0` считается с `turns` ⇒ при заворачивании картинка не прыгает (B4).
  Источники `turns`: (а) `pan.turns` из persisted-настроек сайта (`hero-applied-settings.json`,
  BroadcastChannel) — если ключ присутствует, он переопределяет счётчик; (б) wrap-детекция для
  сообщений `settings` от Toolcraft (ключа `turns` там нет). Apply (`save-settings`, `intent: apply`)
  записывает `pan.turns = turns` в файл сайта ⇒ standalone-сайт воспроизводит композицию точно; Reset
  (`intent: reset`) пишет `turns = 0` и обнуляет счётчик. По вертикали `turns` не нужны (период точный).
- Альтернатива по желанию пользователя: `clamp` вместо `wrap` по `x` (драг упирается в ±180°), тогда
  `turns` не нужен. Не реализовывать обе ветки.

### 3.6 Дефолты

`cards.height = 340` (общий), `cards.gap = −24`, `sphere.rowGap = 24`, `sphere.width = 900`,
`sphere.height = 900`, `sphere.depth = 900` (= width ⇒ прежняя форма), `sphere.rows = [{ offset: 0,
speed: 3 }]`, `sphere.pan = {0, 0}`. Настройки
пользователя (`Rx 610, Ry 640, h ≈ 747, gv 17`) дают широту ряда `(747+17)/640 ≈ 68°` на ряд — второй
ряд уже у полюса; это ожидаемо: вертикальный «спад» регулируется `sphere.height` (бо́льшие значения —
почти плоский вертикальный цилиндр).

## 4. Решения

| # | Решение | Почему |
| --- | --- | --- |
| D1 | Одна высота карточки для всех рядов — существующий `cards.height` становится всегда применимым (Rows и Sphere); поле `height` из `sphere.rows[i]` удаляется, запись ряда = `{ offset, speed }`. | Прямая просьба: «мы задаём размер только среднего ряда, а остальные ряды скейлим относительно него». |
| D2 | Линза — та же касательная поверхность, но с постоянным радиусом `Rx`, без поворота и с **третьей независимой полуосью `Rz = sphere.depth`**; панно отображается эквидистантно (`θ = u/Rx`, `φ = −v/Ry`). | Средний ряд в центре линзы выглядит ровно как сейчас (понравилось пользователю); остальные ряды — «то же, сдвинутое». Пользователь просит настраивать искажение по всем осям; дефолт `depth = width` сохраняет текущую форму. Поворот `sphere.rotation` удаляется. |
| D3 | Бесконечный вертикальный цикл рядов с периодом `V = n·p`; `pan.y` измеряется в долях `V/2`. | «Панно бесконечное… 3 ряда крутятся друг за другом»; wrap пада по вертикали идеально бесшовен. |
| D4 | Пан — Vector-пад `sphere.pan` в секции `Gallery Placement` рядом с `Position` (`orderRole: "spatial"`) **и** канвас-хэндл в Toolcraft над iframe. Ownership: canvas `direct-spatial-edit` + panel `property-edit` на одном target (разрешённая пара). | Пользователь просит тянуть прямо на холсте; пад даёт точность, reset, persistence. `Position` двигает центр линзы по холсту, `Pan` — панно внутри линзы: одна сущность «размещение». Гейтинг из другой секции допустим: префикс `sphere` ≠ `gallery`, заголовок не содержит ветку (§2). |
| D5 | Хэндл — product-оверлей `[data-toolcraft-canvas-handle]` внутри `canvasContent` (в Toolcraft DOM, не в iframe): прозрачная поверхность на всю область превью в режиме Sphere + токенизированный «пин» (кольцо + перекрестие ≤ 1.5 px) в центре линзы; без текста; пишет `sphere.pan` через `controls.setValue` с `history: "merge"` и одним `historyGroup` на жест (одна запись undo). Модифицированный драг, пинч и колесо уходят в CanvasShell; не-первичные кнопки игнорируются. | Единственный поддерживаемый runtime-механизм прямого взаимодействия над продуктом; повторяет эталон Orientation Gizmo (`role="application"`, pointer capture, merge-history). `viewInteraction` остаётся `fixed-camera` — двигается контент, не камера. |
| D6 | По `x` — wrap на ±180° с оборотами `turns` на сайте (persist через Apply как `pan.turns`); по `y` — точный период. | Бесконечный драг без скачков и точное воспроизведение после Apply; см. альтернативу `clamp` в §3.5. |
| D7 | `offset` (°) и `speed` (°/s) рядов остаются угловыми величинами долготы линзы (`px = ° · π/180 · Rx`). | Визуально стабильны при смене `Rx`; минимум изменений контролов. |
| D8 | Протокол → **v10** (меняются формы `sphere.rows`, `sphere.pan`, `cardHeight`, `state`; новые `snapshot`/`snapshot-result`). Оба репозитория в одной доставке; сайт принимает только v10. | Версионированный мост — договорённость проекта. |
| D9 | Export-clean пруф хэндла — через `snapshot`-сообщение: сайт синхронно рисует кадр WebGL-галереи и отдаёт PNG (`canvas.toBlob`) родителю; тест сравнивает декодированную сигнатуру с подсвеченным/обычным хэндлом. | Валидатор требует `canvas-export-clean`, а экспорта в приложении нет; артефакт из iframe — честное product-output, в которое оверлей Toolcraft попасть не может. Сообщение доступно только embedded с trusted origin; без e2e-хуков в product-коде Toolcraft. |
| D10 | Ряд без картинок получает полный набор; `hardMaxItems` 24 / 6 рядов / 96 draw-лимит / POT-текстуры — без изменений. | Не трогать то, что работает. |
| D11 | Режим Rows сохраняется («функционал не сокращаем»). Контролы галереи разносятся на три секции: `Gallery` (Type, Gap, Card height, Safety width, Roll, Rows, Row gap — 7), `Lens` (Width, Height, Depth — 3, свой `entityId`), `Gallery Placement` (Position, Pan — 2). | Прежняя секция упёрлась в 10; разнос по сущностям «контент / линза / размещение» проходит все правила раскладки (§2) и оставляет запас под будущие ручки линзы (наклон, асимметрия). |

Отвергнуто: жёсткий yaw/pitch (даёт шапки у полюсов и не «морфит» ряды); высота на ряд (рвёт единое
полотно); радиус `Rx·cos φ` на ряд (сжимает верхние ряды как сейчас на скриншоте); запись драга в
`offset` каждого ряда (до 6 записей на движение, шум history); переиспользование
`useToolcraftModelOrbitInteraction`/Orientation Gizmo (привязаны к pose-модели ориентации, а нужен
пан); скриншот страницы как export-артефакт (включает оверлей); цилиндр без вертикальной кривизны
(теряется смысл `sphere.height`; при желании — вариант функции линзы, не делать сейчас); общий набор
картинок во всех рядах ради общего периода (повторы одной картинки в каждом ряду).

## 5. Toolcraft

### 5.1 Контролы и секции

Diff контролов:

| Target | Было | Стало |
| --- | --- | --- |
| `cards.height` | slider 80–1080 px, `conditional: type == rows`, group `rows-geometry`, label `Card height` | `applicability: always`, `semanticGroup: "card-geometry"`, `description`: «Height of every card in panel pixels; the Sphere lens scales rows as they move away from its centre.» |
| `sphere.rows` | collectionActions, itemControls `height/offset/speed` | itemControls **`offset`** (slider ° −180–180, step 1, default 0) и **`speed`** (slider °/s −45–45, step 0.5, default 3); `description`: «Each row owns its base angle and signed angular speed; rows share Card height and Row gap and cycle top to bottom.» |
| `sphere.rotation` | vector `Rotation` | **удалить** |
| `sphere.width` | slider `Sphere width` в Gallery | переезжает в `Lens`, label `Width`, `semanticGroup: "lens-shape"`, `description`: «Horizontal lens curvature: how much of each row fits the frame and how quickly cards bend toward the sides.» |
| `sphere.height` | slider `Sphere height` в Gallery | переезжает в `Lens`, label `Height`, `semanticGroup: "lens-shape"`, `description`: «Vertical lens curvature: how strongly rows above and below the centre shrink and recede.» |
| `sphere.depth` | — | **новый** slider continuous, px, 200–6000, step 10, default 900, `conditional: type == sphere`, label `Depth`, `semanticGroup: "lens-shape"`, `performanceRole: responsiveness`, `description`: «Lens depth: how far the sides travel toward the viewer and magnify, independent of the horizontal bend; equal to Width reproduces a round lens.» |
| `sphere.pan` | — | **новый** `vector`, `coordinateMode: "screen"`, label `Pan`, `defaultValue {0,0}`, `conditional: type == sphere`, `orderRole: "spatial"`, `performanceRole: responsiveness`, секция `Gallery Placement`, `description`: «Slides the image panel through the fixed lens: X scrolls every row along the lens and wraps at ±180°, Y cycles the row stack (±1 is half a stack period).» Драг хэндла и пад пишут один target. |
| `type`, `gap`, `safetyWidth`, `roll`, `rowGap`, `gallery.position` | — | без изменений. |

Секции (порядок в панели: … Projection → Gallery Images → Gallery → Lens → Gallery Placement → Edge
Zone …):

- `gallery` — title `Gallery`, entity «Hero gallery content», `entityId: "hero-gallery-surface"`,
  **7 контролов**: `type → gap → cardHeight → safetyWidth [rows] → roll [rows] → sphereRows [sphere] →
  rowGap [sphere]`. Селектор и зависимые контролы контента — вместе; `semanticGroup` оставить на всех.
- `lens` — title `Lens` (id `lens`), entity «Gallery lens», `entityId: "hero-gallery-lens"` (**своя**
  сущность — иначе правило cohesion потребует держать ≤ 10 контролов одной сущности в одной секции),
  **3 контрола**: `sphereWidth → sphereHeight → sphereDepth`, все `conditional: type == sphere`. Заголовок
  не содержит «Sphere»/«Rows», все target'ы с одним loose-префиксом `sphere` ⇒ короткие метки
  допустимы (§2). `groupingReason`: «Width, height and depth jointly define the fixed distortion surface
  every Sphere row is drawn through.»
- `gallery-placement` — title `Gallery Placement`, entity «Gallery placement on the hero canvas»,
  `entityId: "hero-gallery-placement"`, **2 контрола**: `position → pan [sphere]`. `groupingReason`:
  «Position moves the lens centre on the canvas and Pan slides the image panel through it; both place the
  active gallery as one composition.» В секции два loose-префикса (`gallery`, `sphere`); generic-метка
  `Position` остаётся валидной, потому что заголовок содержит слово `gallery` (правило
  `doesToolcraftSectionMatchTarget`), `Pan` generic-меткой не считается.
- `gallery-images`, `website-actions` и остальные секции — без изменений.

В `heroGalleryTargets`: `rotation` → `pan: "sphere.pan"`, добавить `sphereDepth: "sphere.depth"`.
После разноса ни одна секция не превышает 10; у `Lens` остаётся запас под будущие ручки линзы.

### 5.2 Значения и протокол v10 (`hero-gallery-values.ts`, `hero-preview-protocol.ts`)

```ts
export type HeroSphereRow = Readonly<{ offset: number; speed: number }>;          // °, °/s
export type HeroGalleryPan = Readonly<{ x: number; y: number }>;                  // −1..1
export type HeroGallerySettings = Readonly<{
  cardGap: number;
  cardHeight: number;                       // общий для Rows и Sphere (было rows.cardHeight)
  images: readonly HeroGalleryImage[];
  position: Readonly<{ x: number; y: number }>;
  rows: Readonly<{ roll: number; safetyWidth: number }>;
  sphere: Readonly<{
    depth: number;                          // новый, Rz (200–6000)
    height: number; width: number; rowGap: number;
    pan: HeroGalleryPan;                    // было rotation
    rows: readonly HeroSphereRow[];         // 1..6
  }>;
  type: "rows" | "sphere";
}>;
export const HERO_SPHERE_ROW_DEFAULT: HeroSphereRow = { offset: 0, speed: 3 };
// HERO_GALLERY_DEFAULTS: cardHeight 340, sphere.depth 900, sphere.pan {0,0}; sphereRowsValue без height;
// createHeroGallerySettingsFromValues: pan = vectorValue(values["sphere.pan"]) (без домножения).
```

Новый модуль `src/app/hero-gallery-pan.ts` (чистые функции, без React):

```ts
export function wrapHeroGalleryPanUnit(value: number): number;              // → [−1, 1)
export function getHeroGalleryPanelPeriod(args: { cardHeight: number; rowGap: number; rowCount: number }): number; // n·max(h+gv, h/2)
export function applyHeroGalleryPanDrag(args: {
  start: HeroGalleryPan;                    // значение на pointerdown
  deltaPx: { x: number; y: number };        // суммарная дельта в px iframe
  sphereWidth: number; panelPeriod: number;
}): HeroGalleryPan;                         // wrap(start + {dx/(π·Rx), dy/(V/2)})
export function readHeroGalleryPanDragInputs(values: Record<string, unknown>): { panelPeriod; sphereWidth; type }; // clamp как в values
```

Протокол: `HERO_PREVIEW_PROTOCOL_VERSION = 10`; `HeroPreviewGalleryState.rotation` → `pan: { x, y,
turns }` (guard `isHeroPreviewStateMessage` обновить); новые типы сообщений (для сайта и e2e; Toolcraft
product-код их не шлёт):

```ts
type HeroPreviewSnapshotMessage = { channel; version: 10; type: "snapshot"; requestId: string };
type HeroPreviewSnapshotResultMessage = {
  channel; version: 10; type: "snapshot-result"; requestId: string;
  ok: boolean; message?: string; blob?: Blob; width?: number; height?: number;
};
```

`HeroPreviewSettings` остальное без изменений; `runtimeId` пайплайна → `hero-external-preview-v10`.

### 5.3 Канвас-хэндл `HeroGalleryPanHandle` (новый `src/app/hero-gallery-pan-handle.tsx`)

- Рендерится внутри `.preview` (`HeroExternalPreview`) после `<iframe>`; `.preview` получает
  `position: relative`. Возвращает `null`, если `values["gallery.type"] !== "sphere"`. Пин статичен
  относительно product-output (центр линзы), поэтому raster-пробы product-observable не видят в нём
  изменений; если протектед-репортер потребует вынести хэндл из `[data-toolcraft-product-output]` —
  вернуть из `canvasContent` фрагмент `<div .preview/> + <HeroGalleryPanHandle/>` с абсолютным
  позиционированием поверх превью.
- DOM:
  ```tsx
  <div
    aria-label="Drag to pan the gallery panel"
    className={styles.panHandle}                 // position:absolute; inset:0; cursor:grab; touch-action:none; pointer-events:auto
    data-hero-gallery-pan-handle-state={dragging ? "dragging" : "idle"}   // cursor:grabbing при dragging
    data-testid="hero-gallery-pan-handle"
    data-toolcraft-canvas-handle="hero-gallery-pan"
    role="application"
    style={{ "--hero-pan-pin-x": `calc(50% + ${position.x * 36}%)`, "--hero-pan-pin-y": `calc(44% + ${position.y * 28}%)` }}
    onPointerDown onPointerMove onPointerUp onPointerCancel onLostPointerCapture
  >
    <svg aria-hidden="true" className={styles.panPin} viewBox="0 0 24 24">   // 24×24, translate(-50%,-50%), pointer-events:none
      <circle cx="12" cy="12" r="9" fill="none" stroke="var(--ring)" strokeWidth="1.5" />
      <path d="M12 4v4M12 16v4M4 12h4M16 12h4" stroke="var(--primary)" strokeWidth="1.5" />
    </svg>
  </div>
  ```
  Без текста, без вложенных контролов, штрихи ≤ 2 px, цвета — токены `--ring`/`--primary` (при
  необходимости лёгкий ореол `--background` с opacity). `50%/44%` = `HERO_PREVIEW_DEFAULTS.vanishingPoint`,
  `position` = `gallery.position` (центр линзы совпадает с главной точкой сайта).
- Жест: `onPointerDown` — если жест уже идёт или не (`button === 0 && !alt && !ctrl && !meta && !shift`)
  ⇒ `return` (событие всплывает в CanvasShell — обычный пан холста, B2); иначе `preventDefault()`,
  `stopPropagation()`, `setPointerCapture(pointerId)`, `gesture = { pointerId, startPan: текущее
  sphere.pan, startClient, scale: rect.width / offsetWidth, historyGroup: \`hero-gallery-pan:${++n}\`,
  pending: false }`, состояние `dragging`. `onPointerMove` (тот же pointerId) — `preventDefault/
  stopPropagation`, запомнить последний client-поинт, запланировать один `requestAnimationFrame`, в
  нём `value = applyHeroGalleryPanDrag({ start, deltaPx: (last − startClient)/scale, sphereWidth,
  panelPeriod })` и `dispatch({ type: "controls.setValue", target: "sphere.pan", value, history:
  "merge", historyGroup, label: "Pan" })`. Вычисление от `startPan + ΣΔ` (а не инкрементально) —
  идемпотентно и не зависит от устаревших значений в замыкании. `onPointerUp`/`onPointerCancel`/
  `onLostPointerCapture` (тот же pointerId) — отменить rAF, применить последнюю дельту, снять capture,
  закрыть жест. Второй палец (пинч) забирает capture ⇒ жест завершается. Колесо не перехватывать.
- Значения: `useToolcraftSelector(state => state.values, Object.is)` → `readHeroGalleryPanDragInputs`;
  `useToolcraftDispatch()`. Никакого чтения DOM iframe.
- Доступность/клавиатура не требуются (как у гизмо); пад в панели остаётся клавиатурной поверхностью.

### 5.4 Пайплайн (`hero-preview-pipeline.ts`)

`HERO_PREVIEW_CONTROL_DRAG_TARGETS`: `sphere.rotation` → `heroGalleryTargets.pan` (драг хэндла и пада —
один `control-drag` по тому же target; `mask-drag` не использовать); добавить `heroGalleryTargets.sphereDepth`. Описательную строку `inputs`
`preview-sync` обновить («…retained panel-through-lens sphere WebGL output…»). `runtimeId` v10.
`media-sync` без изменений. Прогнать существующие performance-тесты (`assessToolcraftRenderPlan`).

### 5.5 Acceptance, ownership, readiness (`app-acceptance-data.ts`, `app-performance.ts`)

- `interactionOwnership`: удалить `panel-sphere-rotation`; добавить
  - `canvas-sphere-pan` — `surface: "canvas"`, `capability: "direct-spatial-edit"`, `target: sphere.pan`,
    без `selectionScope`, `evidence: { source: "user-request", detail: "The user asked to drag the image
    projection directly on the canvas instead of rotating a sphere from the panel." }`, `reason`: «Dragging
    over the live website preview keeps the panel under the pointer and gives immediate lens feedback.»,
    `alternative: { surface: "panel", reason: "A pad alone separates the drag from the visible output and
    cannot follow the pointer across the lens." }`;
  - `panel-sphere-pan` — `surface: "panel"`, `capability: "property-edit"`, `selectionScope: { mode:
    "global" }`, `target: sphere.pan`, `evidence: { source: "usability-analysis", detail: "Precise,
    persistent, resettable pan values are read and edited in the panel while the canvas owns the drag." }`,
    `reason`/`alternative` ≥ 24 символов (alternative.surface `canvas`).
  Общий `.map` property-edit остаётся для остальных target'ов (`cards.height` уже там; добавить
  `sphere.depth`); `sphere.pan` в него **не** включать (иначе второй `panel-sphere-pan` даст дубликат id). Id `panel-sphere-pan` совпадает
  с тем, что генерирует хелпер `controlAcceptance` (`panel-${target с точками → дефисы}`).
- Строки acceptance:
  - `sphere.pan` (`kind: "control"`, vector, `controlPartCoverage: ["vector.x","vector.y"]`,
    `interactionId: "panel-sphere-pan"`), observable: «Both pad axes slide the image panel through the
    fixed lens; `data-hero-gallery-pan` mirrors the value and rows keep equal spacing.»;
  - `sphere.pan.handle` (`kind: "canvas-handle"`, `componentType: "canvas-handle"`, `evidence:
    "product-output"`, `interactionId: "canvas-sphere-pan"`, `canvasHandle: { testId:
    "hero-gallery-pan-handle", writesTarget: "sphere.pan", outputObservable: "The panel follows the
    pointer: rows slide along the lens and cycle vertically while the lens stays fixed.",
    exportCleanTestName: "export excludes the gallery pan handle" }`, `automatedTestName: "sphere.pan.handle
    converts pointer deltas into wrapped pan values"`, `browserTestName: "browser: dragging the gallery
    pan handle slides the panel"`, `fixture: "Sphere gallery with authored portraits, frozen motion and
    default pan"`, `expectedObservable` = `outputObservable`, `userAction: "Drag the preview with the
    primary button."`);
  - `sphere.rows` — observable/userAction без `Height` («Add a row, edit its Offset and Speed, then remove
    it.»); `cards.height` — observable для обоих режимов («Every card in Rows or every panel row in Sphere
    changes height while width follows the image aspect.»), `userAction` без «Select Rows»;
  - удалить строку `sphere.rotation`; `sphere.width/height` — формулировки про линзу (`userAction`: «Drag
    Width.» / «Drag Height.» в секции Lens); новая строка `sphere.depth` (slider, observable: «The sides of
    every row travel further toward or away from the viewer and change magnification while the on-screen
    bend set by Width stays the same.», `userAction: "Drag Depth."`).
- `referenceFeatureInventory.requested.hero-sphere-gallery`: `behaviorEvidence`/`toolcraftMapping` —
  «uniform rows on one infinite panel drawn through a fixed tangent-ellipsoid lens; canvas drag and panel
  pad pan the panel; rows cycle vertically».
- `productSummary`/`requestedBehavior`: «…a multi-row panel gallery seen through a fixed lens, pannable
  directly on the canvas…». `viewInteraction.evidence`: «The camera stays fixed; the canvas handle pans
  the image panel through the lens and never orbits or moves the website camera.»
- `animationIntent.reason`: «Each row conveyor scrolls at its own signed angular speed inside the
  website; canvas and pad pan are user edits, not transport…» (шесть `behaviorCoverage` без изменений).
- `appControlSectionInventory`: `gallery` — 7 target'ов (без `sphereWidth/Height`, без `rotation`),
  `groupingReason` — «The mode selector stays with the Rows and Sphere content geometry it gates; the
  seven controls arrange cards and rows on the panel.»; новая запись `lens` (entity «Gallery lens»,
  `entityId: "hero-gallery-lens"`, targets `sphereWidth, sphereHeight, sphereDepth`); `gallery-placement`
  — targets `position, pan` с новым `groupingReason` (§5.1). Без `splitReason`/`workflowStage` — это
  разные сущности, а не split одной.
- `app-performance.ts`: `fidelityRisks` — заменить фразу про rotatable ellipsoid/pitch seam на
  «vertical copies near ±85° latitude shrink to slivers; a row period longer than the lens circumference
  keeps its seam on the near wall behind the camera»; `performanceRisks` — «canvas drag writes merged pan
  values per animation frame; each write re-sends settings to the iframe (constant cost)».

### 5.6 Unit-тесты Toolcraft

- `src/app/hero-gallery-pan.test.ts` (новый): `wrapHeroGalleryPanUnit` (1 → −1, −1.25 → 0.75, 0.5 → 0.5);
  `getHeroGalleryPanelPeriod` (n=3, h=340, gv=17 → 1071; gv=−300 → 3·170); `applyHeroGalleryPanDrag`
  (dx = π·Rx ⇒ +1 → wrap в −1; dy = V/4 ⇒ +0.5; отрицательные дельты); `readHeroGalleryPanDragInputs`
  (clamp и дефолты). Имя `it` для хэндла = `automatedTestName` строки `sphere.pan.handle`.
- `hero-preview.product.test.ts`: кейс `sphere.rotation` → `sphere.pan` (`{x: 0.25, y: −0.5}` без
  масштабирования), новый кейс `sphere.depth` (1400 → `settings.gallery.sphere.depth`), `sphere.rows` →
  `[{offset: 30, speed: −6}, {offset: 0, speed: 3}]` (записи с лишним
  `height` игнорируются), `cards.height` читается из `settings.gallery.cardHeight`; версия 10.
- `hero-gallery-values.test.ts`: `sphereRowsValue` без `height`, `isHeroPreviewStateMessage` с `pan`.

## 6. Сайт (`recraft-v4-styles/src/components/pages/home/`)

### 6.1 `hero-scene-settings.ts`

- [ ] `HeroSphereRow { offset; speed }`; `HeroGallerySettings.cardHeight` (вместо `rows.cardHeight`);
      `sphere.depth: number`; `sphere.pan: { x: number; y: number; turns?: number }` (вместо `rotation`;
      `turns` — целое, только в persisted-источниках); `HeroGalleryRenderState.pan: { x; y; turns }`
      (вместо `rotation`).
- [ ] `numericBounds`: убрать `sphereRowHeight`, `sphereYaw`, `spherePitch`; добавить `galleryCardHeight:
      [80, 1080]`, `spherePan: [-1, 1]`, `spherePanTurns: [-1000, 1000]`; `sphere.depth` — через существующий
      `sphereSize: [200, 6000]`, при отсутствии ключа в старом JSON — fallback на `sphere.width` (старые
      файлы сохраняют форму); `normalizeSphereRows` читает
      только `offset/speed` (лишний `height` игнорируется); `normalizeHeroGallerySettings`: `cardHeight`
      из `input.cardHeight`, при его отсутствии — из устаревшего `input.rows.cardHeight` (совместимость с
      текущим tracked JSON); `pan.turns` попадает в результат **только если** присутствует целым числом.
- [ ] `defaultHeroSceneSettings.gallery`: `cardHeight: 330`, `sphere: { depth: 900, height: 900, pan: {x: 0,
      y: 0}, rowGap: 24, rows: [{ offset: 0, speed: 3 }], width: 900 }`, `type: 'rows'` (standalone-вид не
      меняется).
- [ ] `hero-applied-settings.json`: не редактировать вручную; устаревшие ключи игнорируются. После
      доставки пользователь перезапишет файл через Apply (опционально — один раз `Reset` → `Apply`).

### 6.2 `hero-sphere-layout.ts` (переписать; имя файла оставить)

- [ ] `getHeroPanelPitch(h, rowGap) = max(h + rowGap, h/2)`, `getHeroPanelPeriod(n, pitch)`,
      `getHeroPanelRowCenters(n, pitch)` (§3.1) — формулы должны совпадать с
      `getHeroGalleryPanelPeriod` в Toolcraft (комментарий-ссылка в обоих местах).
- [ ] `projectHeroLensPoint(u, v, { rx, ry, rz, focal, principal, theta0, phi0 })` → `{ x, y, z }` (§3.2,
      без поворота, `z = rz·(1 − cosθ·cosφ)`); `getHeroLensOrigin({ pan, turns, ry, period })` → `{ theta0,
      phi0 }`.
- [ ] `layoutHeroSphereGallery({ bleed, cardHeight, focal, gap, pan: {x, y, turns}, phases, principal,
      rowGap, rowSources, rows, rx, ry, rz, viewport })` → `{ cards: Array<{ rowIndex, sourceIndex, copy (j),
      cycle (k), arcWidth, thetaCenter, phiCenter, centerX, depth, side, order }>, periods: number[] /* px */ }`
      по §3.1–§3.3 (диапазоны `j`/`k` из окон, bbox-отсечение, «все 8 точек `z ≤ f − 8`», лимит 96,
      порядок `depth → row → u`).
- [ ] `advanceHeroPanelPhase(phasePx, speedDegPerSecond, dtMs, periodPx, previousPeriodPx, rx)` (px).
- [ ] Проверка математики: на сайте нет test-runner'а — не добавлять зависимости; опционально
      `node --test src/components/pages/home/hero-sphere-layout.test.ts` (erasable TS, файл не импортируется
      сборкой): период/шаг, wrap `pan.y` на 2 даёт те же `v` по модулю `V`, `turns` сдвигает `theta0` на
      `2π`, симметрия проекции.

### 6.3 `hero-sphere-gallery-webgl.ts`

- [ ] Вершинный шейдер по §3.4 (убрать `uRowRadius/uYaw/uPitch`, добавить `uRz`); per-card uniforms
      `uThetaCenter/uPhiCenter` из layout; `uViewSize = (arcWidth + 512, cardHeight + 160)`, `uCardSize = (arcWidth,
      cardHeight)`.
- [ ] Состояние `turns` и wrap-детекция в `setSettings` (§3.5): хранить `previousPan`; если новые settings
      содержат `pan.turns` — взять его; иначе обновить по `Δx`. Экспортировать в `getState()`.
- [ ] `draw(timestamp, { advancePhases })`: фазы в px (`advanceHeroPanelPhase`); velocity-ключ с `cycle`;
      чистка карт velocity/centerPositions.
- [ ] `captureFrame(): Promise<Blob | null>` — синхронно `draw(performance.now(), { advancePhases: false })`,
      затем **в том же таске** `canvas.toBlob(resolve, 'image/png')` (буфер WebGL валиден до следующего
      compositing; `preserveDrawingBuffer` не включать); `null` при потерянном контексте.
- [ ] `requestAnimationFrame` планировать также при изменении settings (пан) и пока затухает velocity
      (как сейчас — пока `|velocity| > порога`), иначе streak после драга «зависнет».
- [ ] Файл ≤ 1000 строк; при росте вынести текстурный кэш в `hero-sphere-gallery-textures.ts`.

### 6.4 `hero-sphere-gallery.tsx`

- [ ] `rowSignature = rows.map(r => \`${r.offset}:${r.speed}\`).join('|')`; атрибут
      `data-hero-gallery-pan="x:y:turns"` (4 знака) вместо `-rotation`; `onState` с `pan: { x, y, turns }`.
- [ ] Регистрация провайдера снимка: модуль `hero-gallery-snapshot.ts` (`registerHeroGallerySnapshotProvider
      (fn)`, `captureHeroGallerySnapshot(): Promise<{ blob, width, height } | null>`) по образцу
      `hero-preview-website-actions.ts` в Toolcraft; компонент регистрирует `() => renderer.captureFrame()`
      на монтировании и снимает при размонтировании.
- [ ] DOM-fallback: ряды одной высоты `cardHeight`.

### 6.5 `hero-preview-boundary.tsx` и `hero-v4-styles.tsx`

- [ ] `previewProtocolVersion = 10`; guard'ы `settings`/`media`/`save-settings` без изменений формы,
      новый `isPreviewSnapshotMessage`; на `snapshot` — `captureHeroGallerySnapshot()` → `snapshot-result`
      (`ok: false, message` если тип `rows`, fallback-рендер или `null`). Blob проходит structured clone.
- [ ] `saveSettings`: для `intent: 'apply'` записывать `gallery.sphere.pan.turns = <turns из state
      галереи>` (последний `HeroGalleryRenderState.pan.turns`, хранить в ref из `onGalleryState`); для
      `intent: 'reset'` — `turns: 0`. `persistHeroSettings`/`/api/hero-settings` принимают расширенный
      объект (нормализатор сохраняет `turns`).
- [ ] `hero-v4-styles.tsx`: `CardStack` — `settings.gallery.cardHeight`; `HeroCardScene` — `rowSignature`
      без `rotation`, `data-hero-gallery-pan="0:0:0"`, `onState.pan = {0,0,0}`.
- [ ] `HeroV4Styles` передаёт `onGalleryState` как сейчас; никаких новых `'use client'`-границ.

### 6.6 Rows (без изменений геометрии)

Только общий `cardHeight`; `safetyWidth`/`roll`/path-логика не трогаются; standalone-дефолты те же.

### 6.7 Проверки сайта

- [ ] `pnpm exec oxfmt <тронутые файлы>`, `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm build`,
      `git diff --check` из корня `recraft-landing`.
- [ ] Ручной контроль embedded: 1 → 3 → 6 рядов одной высоты; ряд, перетащенный в центр, выглядит как
      средний; вертикальный цикл без шва; wrap по горизонтали без скачка; `sphere.height` меняет спад к
      полюсам; `sphere.depth` меняет рост краёв при неизменном изгибе (`depth = width` ⇒ прежний вид,
      `2·depth ≥ perspective` ⇒ камера внутри без артефактов у краёв); отрицательный `rowGap` (перекрытие ≤ h/2); `speed` и `offset` рядов; Apply → standalone
      сайт показывает ту же композицию (включая `turns`); Reset обнуляет пан.

## 7. Browser-проверки Toolcraft (`e2e/`, app-owned файлы)

**Долг Delivery 20 (обязателен, если проверки запускаются):** `hero-preview-browser-helpers.ts`
(`waitForWebsitePreview` ждёт 16 `[data-hero-card]` — заменить на `[data-hero-gallery][data-hero-gallery-ready="true"]`
во фрейме), `product-cards-preview.spec.ts` (ссылается на удалённый `cards.scale`), отсутствующие спеки
`gallery.images` (media-lifecycle), `gallery.type`, `sphere.rows`, `sphere.rowGap`, `sphere.width`,
`sphere.height`, `gallery.position` — см. §7 плана `2026-08-21-hero-sphere-gallery.md` (актуально за
вычетом `sphere.rotation`/`height`). Минимум этой доставки — кейсы ниже; остальное — по режиму проверки.

- [ ] Предусловие неподвижности: `page.emulateMedia({ reducedMotion: "reduce" })` до `goto` (фазы на сайте
      замораживаются; проверить, что эмуляция доходит до OOPIF-iframe), страховка — `speed = 0` у каждого
      ряда через числовое поле слайдера `Speed` записи коллекции.
- [ ] `e2e/product-gallery-pan.spec.ts` (новый):
  1. `browser: dragging the gallery pan handle slides the panel` — сессия `createToolcraftBrowserProofSession`;
     Sphere по умолчанию; `expectToolcraftProductObservableToChange(session, session.targetAction("sphere.pan",
     page => dragCanvasHandle(page, "hero-gallery-pan-handle", { x: 160, y: 0 }, { requirementId:
     "sphere.pan.handle", target: "sphere.pan" })), { requirementId: "sphere.pan.handle", selector:
     heroPreviewSelector })`; затем вертикальный драг `{ x: 0, y: 120 }`; проверить, что
     `data-hero-gallery-pan` на обёртке и значение пада `Pan` изменились в одном направлении (x вырос,
     y вырос), один шаг undo (`history` в тулбаре) возвращает прежнее значение; драг с зажатым Shift
     **не** меняет `sphere.pan` (холст Toolcraft сдвигается, если `canvas.draggable` включён в схеме).
  2. `export excludes the gallery pan handle` — `expectExportExcludesCanvasHandles(page, exportAction,
     inspectArtifact, { requirementId: "sphere.pan.handle", target: "sphere.pan" })`, где `exportAction`
     в `page.evaluate` шлёт `{ channel: "recraft.hero-scene", version: 10, type: "snapshot", requestId }`
     в `iframe[title="Recraft hero website preview"].contentWindow` с targetOrigin `http://localhost:3000`
     и ждёт `message` `snapshot-result` с тем же `requestId` (таймаут 10 с), возвращая base64 PNG;
     `inspectArtifact` декодирует через `createImageBitmap` + `observeToolcraftDecodedPixels` (по образцу
     `inspectToolcraftImageDownload`) → `{ byteLength, decodedPixelHash, height, kind: "image", mediaType:
     "image/png", nonBackgroundBounds, width }` (новый app-owned `e2e/hero-gallery-snapshot-helpers.ts`).
     Снимок берётся при замороженной анимации.
  3. `browser: sphere.pan changes the embedded hero output` — пад `Pan` по образцу
     `product-prompt-preview.spec.ts` (`getByRole("button", { name: "Pan X/Y pad" })`,
     `expectToolcraftCompoundControlPartOutcome` для `vector.x`/`vector.y`, `requirementId: "sphere.pan"`).
- [ ] `sphere.depth`, `sphere.width`, `sphere.height` — slider-кейсы через `registerHeroPreviewControlTests`
      (секция `Lens`; `getToolcraftControlFieldByTarget` находит поле по target, не по секции).
- [ ] `app-controls.spec.ts`: sphere-smoke (`data-hero-gallery-ready`, `rows="1"`, хэндл
      `[data-toolcraft-canvas-handle="hero-gallery-pan"]` присутствует в Sphere и отсутствует в Rows) и
      `expectNoForbiddenCanvasUi(page)`.
- [ ] `npm run test:feature -- sphere.pan sphere.pan.handle sphere.depth cards.height sphere.rows` (+
      остальные id галереи, если закрывается долг).

## 8. Порядок задач

### Task 0 — Preflight

- [ ] Перечитать актуальные версии всех файлов из §2 (оба репозитория), номер следующей Delivery в
      worklog, режим проверки у пользователя; решение D6 (wrap+turns) считать принятым, если пользователь
      не сказал иначе.

### Task 1 — Toolcraft: значения, математика пана, протокол v10

**Files:** modify `src/app/hero-gallery-values.ts`, `src/app/hero-preview-protocol.ts`,
`src/app/hero-preview.product.test.ts`; create `src/app/hero-gallery-pan.ts`,
`src/app/hero-gallery-pan.test.ts`; modify/create `src/app/hero-gallery-values.test.ts`.

- [ ] §5.2, §5.6. `npm exec vitest run src/app/hero-gallery-pan.test.ts src/app/hero-gallery-values.test.ts
      src/app/hero-preview.product.test.ts` зелёные.

### Task 2 — Toolcraft: схема, acceptance, пайплайн, performance

**Files:** modify `src/app/app-schema.ts`, `src/app/app-acceptance-data.ts`, `src/app/hero-preview-pipeline.ts`,
`src/app/app-performance.ts`.

- [ ] §5.1, §5.4, §5.5: три секции (`Gallery` 7 / `Lens` 3 / `Gallery Placement` 2), новый `sphere.depth`,
      инвентарь с отдельной сущностью `hero-gallery-lens`. `npm run typecheck`, `pnpm ai:check`, `npm exec
      vitest run src/app` — мета-тесты (section size/semanticGroup, dependency grouping, entity cohesion,
      generic labels, canvas-handle acceptance, interaction ownership, compound-part coverage,
      applicability, pipeline) зелёные. Если dependency-grouping всё же ругнётся на `Lens`/`Gallery
      Placement` — прочитать точный текст ошибки (§2 описывает оба условия) и менять заголовок, а не
      возвращать контролы в `Gallery`.

### Task 3 — Toolcraft: канвас-хэндл и превью

**Files:** create `src/app/hero-gallery-pan-handle.tsx`; modify `src/app/hero-preview.tsx`,
`src/app/hero-preview.module.css`.

- [ ] §5.3; обёртка превью: `data-hero-gallery-pan` вместо `-rotation`; `.preview { position: relative }`.
- [ ] Ручная проверка с сайтом ещё на v9: Toolcraft не падает (сайт игнорирует v10), хэндл пишет
      `sphere.pan` (видно в паде и history), Shift+драг/колесо/пинч управляют холстом.

### Task 4 — Сайт: настройки, протокол, мост

**Files (site):** modify `hero-scene-settings.ts`, `hero-preview-boundary.tsx`, `hero-v4-styles.tsx`;
create `hero-gallery-snapshot.ts`.

- [ ] §6.1, §6.4 (регистр снимка), §6.5, §6.6. Rows продолжает работать; tracked JSON читается.

### Task 5 — Сайт: панно сквозь линзу

**Files (site):** rewrite `hero-sphere-layout.ts`; modify `hero-sphere-gallery-webgl.ts`,
`hero-sphere-gallery.tsx`.

- [ ] §3, §6.2–§6.4. Ручные проверки §6.7 и сверка с B1–B8.
- [ ] `pnpm exec oxfmt <files>`, `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.

### Task 6 — Browser-проверки и worklog

**Files:** create `e2e/product-gallery-pan.spec.ts`, `e2e/hero-gallery-snapshot-helpers.ts`; modify
`e2e/hero-preview-browser-helpers.ts`, `e2e/product-cards-preview.spec.ts`, `e2e/app-controls.spec.ts`;
modify `docs/toolcraft/agent-worklog.md`.

- [ ] §7 (минимум — три теста пана + смоук; долг — по режиму проверки).
- [ ] Worklog: `Delivery 21 — Panel-through-lens gallery with canvas pan` по шаблону (request, task type,
      user-visible result, source checked, docs read, rules applied — добавить `canvas-handle-placement`
      и `interaction-surface-ownership`; view interaction `fixed-camera` с новым evidence; interaction
      ownership canvas/panel; decision D1–D10; alternatives; state/output mapping (`sphere.pan`, `turns`,
      `snapshot`); performance intent `ordinary-product-work`; verification; risks). Обновить блоки
      Status (v10), Decisions (Controls, Renderer, Timeline), Verification, Risks.

## 9. Verification note

Предусловие browser-проверок: сайт на `http://localhost:3000/` (`pnpm dev`), Toolcraft `npm run dev`
(порт 3003). Если действует standing-инструкция «без проверок» — пропустить `Run`, перечислив команды в
worklog как «не запускалось».

```md
Verification tier: Tier 3
Reason: Later feature edit replaces the sphere row model (uniform rows on an infinite panel through a fixed three-axis lens), removes surface rotation, adds a lens depth control and regroups gallery controls into three sections, adds the first product canvas handle with canvas/panel ownership, changes the versioned bridge (v10, snapshot request, persisted pan turns), and rewrites the website layout/vertex projection; Toolcraft runtime internals are unchanged.
Run: npm run typecheck; pnpm ai:check; npm exec vitest run src/app; npm run test:feature -- sphere.pan sphere.pan.handle sphere.depth cards.height sphere.rows (plus remaining gallery ids when the Delivery 20 browser debt is closed); website oxfmt/format/lint/typecheck/build + git diff --check; live visual checks B1–B8 embedded and standalone after Apply.
Skip: repeated npm run verify:delivery; measured performance / verify:perf (not requested); export matrices (no artifact export).
```

## 10. Риски и открытые вопросы

- Export-clean для хэндла опирается на `snapshot` из iframe (D9). Если протектед-репортер отвергнет
  артефакт без download-потока — зафиксировать в worklog как ограничение и оставить browser-драг +
  product-observable пруфы; валидатор acceptance при этом всё равно требует `exportCleanTestName`
  (тест должен существовать).
- Полноэкранный хэндл перекрывает пан холста Toolcraft над превью первичной кнопкой без модификаторов;
  остаются Shift/Alt/Ctrl/Cmd+драг, колесо, пинч и драг вне артборда. Записать как осознанное решение
  (`canvas-handle-placement`); при жалобе — сузить хэндл до полосы рядов.
- `turns` живёт на сайте: в Toolcraft-сессии после многих оборотов Apply записывает текущие обороты, а
  Reset обнуляет; undo/redo в Toolcraft корректно проходят wrap-детекцию (Δ > 1 в обе стороны).
- Верхние/нижние ряды у `|φ| → 85°` сжимаются в полоски — свойство линзы; регулируется `sphere.height`.
  Настройки пользователя (`Ry 640`, `h ≈ 747`) дают один ряд на 68° — подсказать в description.
- Сильно отрицательный `rowGap` ограничен перекрытием `h/2` (иначе период вырождается) — задокументировать.
- Каждое движение драга порождает `controls.setValue` (merge) и пересылку settings в iframe (rAF-частота)
  — стоимость константная, но `preview-sync` запускается чаще; при жалобе на плавность — троттлинг
  до 30 Hz в хэндле.
- Параллельные правки (pre-footer bridge, сайт): перечитывать файлы; не откатывать чужое.
- Два dev-сервера должны быть на одной версии протокола; порядок выкладки Toolcraft v10 раньше сайта
  допустим (сайт игнорирует), наоборот — превью пустое до обновления Toolcraft.
- Разнос на три секции опирается на точные условия `control-layout-dependency-rules.ts` (префикс и
  заголовок); заголовки `Lens`/`Gallery Placement` и target'ы `sphere.*` им удовлетворяют, но любое
  переименование секции со словом «Sphere» или перенос `gallery.*`-контрола с гейтингом в другую секцию
  сломает валидацию.
- `sphere.depth` при `2·depth ≥ perspective` переводит камеру внутрь поверхности: ближние карточки
  отсекаются по правилу «все 8 точек `z ≤ f − 8`» — проверить визуально на крайних значениях (6000).
- Долг browser-спек Delivery 20 остаётся, если пользователь снова попросит сдачу без проверок.
