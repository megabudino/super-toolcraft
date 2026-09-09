# Hero Gallery — автоматическое проскролливание к другой точке галереи (Auto Scroll: случайный ряд и сдвиг во все стороны, резкий переход со смазом; план реализации)

> **For agentic workers:** план рассчитан на выполнение по задачам (checkbox `- [ ]`) с
> `superpowers:subagent-driven-development` или `superpowers:executing-plans`. Preflight из
> `AGENTS.md` → `docs/toolcraft/workflow.md` обязателен. Этот файл — единственный документ доставки.
>
> **Контекст.** Пользователь хочет, чтобы раз в настраиваемый период Sphere‑галерея сама
> «проскролливалась в другую точку». Уточнение от 2026‑08‑24: цель перехода — **не только соседний
> ряд**: любой другой ряд (и вверх, и вниз — например с 1‑го на 4‑й), **плюс горизонтальный сдвиг
> влево или вправо** — движение «во все стороны» по диагонали; переход должен быть **быстрым и
> резким**, чтобы срабатывал существующий дисперсионный смаз движения (как при драге).
> Уточнение №2: в Toolcraft нужен **явный переключатель** эффекта, чтобы на время
> разработки/точной настройки его выключать и включать одним кликом. Число рядов динамическое и
> учитывается в момент каждого перехода. Новая фича: Toolcraft‑контролы + протокол
> v15 → v16 + анимация на сайте. Номер записи worklog — следующий свободный (сейчас 36,
> перепроверить). Режим проверки — уточнить; по умолчанию §7. Коммиты — только по явной просьбе.

---

## 1. Архитектура

- **Кто анимирует.** Сайт, внутри retained‑рендерера — по образцу автономного движения рядов
  (`rows[].speed` + `phases`). Toolcraft передаёт только настройки; авто‑смещение — рендерное
  состояние, оно **не** пишется обратно в `sphere.pan`, не попадает в историю/персистенс и работает
  на standalone‑сайте без Toolcraft. Ownership не меняется: канвас владеет прямым драгом Pan,
  панель — значениями, сайт — анимацией и пикселями.
- **Геометрия.** Панель периодична по обеим осям в pan‑единицах с периодом **2**: по вертикали
  `V = rowCount · pitch` ⇒ один ряд = `2 / rowCount` pan‑единиц независимо от pitch; по
  горизонтали `Θ0 = (pan.x + 2·turns)·π` ⇒ +2 к `pan.x` — тот же контент (ряды замкнуты по
  окружности). Авто‑смещение — пара `{x, y}` в pan‑единицах, wrap по модулю 2.
- **Выбор цели перехода (в момент старта, от текущего `rows.length = n`).**
  Вертикаль: случайный **другой** ряд (равномерно из `n − 1`), путь — кратчайший по кольцу рядов
  (знак задаёт «вверх/вниз»; при ничьей `n/2` — случайный знак); текущий ряд берётся округлением
  накопленного смещения к сетке `2/n`, так что после отменённого на середине перехода следующий
  сам доцентровывается на ряд. При `n = 1` вертикальная часть нулевая. Горизонталь: случайный знак
  и случайная амплитуда `|Δx| ∈ [0.1, 0.45]` pan‑единиц (≈ 150–700 px панели при текущих
  настройках) — переход всегда диагональный/боковой, «во все стороны». Константы амплитуды —
  именованные, вынести в верх файла (кандидат на контрол в будущем, не сейчас).
- **Резкость.** Настраивается не скорость в рядах, а **длительность перехода** `duration`
  (0.15–2 с, дефолт 0.45): дальний прыжок за то же время едет быстрее ⇒ резче и с более сильным
  смазом. Easing — **ease‑out‑cubic**: резкий старт, торможение к финишу. Пиковая скорость панели
  при 2 рядах за 0.45 с — тысячи px/с: оценщик скорости пана (окно Delivery 32) видит её по
  дельтам origin, и штатный смаз движения (с клипом 140 px и Motion boost) включается сам, без
  нового кода эффекта.
- **Настройки.** `gallery.sphere.autoScroll = { duration, enabled, interval }`: `enabled` —
  главный переключатель эффекта (свитч в Toolcraft, дефолт **выключено** — удобно для
  разработки: один клик глушит и возобновляет прыжки); `interval` — пауза в секундах между
  **окончанием** одного перехода и стартом следующего (0.5–60, дефолт 6); `duration` —
  длительность перехода в секундах. Слайдеры Interval/Jump time видимы только при включённом
  свитче (conditional applicability).
- **Паузы и сбросы.** Выключение свитча мгновенно отменяет активный переход, чистит таймер и
  **сбрасывает авто‑смещение в ноль** — сцена возвращается ровно в authored‑положение, чтобы во
  время настройки значения панели соответствовали картинке; включение начинает отсчёт заново.
  Изменение authored `sphere.pan` (драг ручкой, undo, импорт) ⇒ текущий
  переход отменяется (смещение замирает), отсчёт интервала заново. `prefers-reduced-motion` ⇒
  авто‑скролл выключен полностью (паритет с `rows[].speed`). `setActive(false)` (вкладка
  скрыта/вне вьюпорта) ⇒ таймер очищается, переход замирает; при активации отсчёт заново.
  `captureFrame` (snapshot, `advancePhases: false`) не продвигает авто‑скролл.

## 2. Сайт — чистая логика (`hero-sphere-gallery-motion.ts` + тесты)

- [ ] Добавить юнит‑тестируемый автомат (без DOM/GL; вся случайность — через переданный
      `random: () => number`, чтобы тесты были детерминированными):

  ```ts
  export interface HeroAutoScrollOffset {
    x: number;
    y: number;
  }

  export interface HeroAutoScrollState {
    elapsed: number;
    from: HeroAutoScrollOffset;
    mode: 'gliding' | 'idle';
    offset: HeroAutoScrollOffset;
    target: HeroAutoScrollOffset;
  }

  export function createHeroAutoScrollState(): HeroAutoScrollState;
  export function getHeroAutoScrollStep(rowCount: number): number; // 2 / max(1, floor(rowCount))
  export function beginHeroAutoScrollGlide(
    state: HeroAutoScrollState,
    rowCount: number,
    random: () => number,
  ): HeroAutoScrollState;
  // вертикаль: currentRow = Math.round(offset.y / step); выбрать targetRow из (n − 1) чужих рядов
  // равномерно через random(); rowDelta = кратчайшая кольцевая разница (ничья n/2 — знак от
  // random()); target.y = (currentRow + rowDelta) * step; при n <= 1 — rowDelta = 0.
  // горизонталь: target.x = offset.x + (MIN_X + (MAX_X - MIN_X) * random()) * (random() < 0.5 ? -1 : 1),
  // MIN_X = 0.1, MAX_X = 0.45.
  export function advanceHeroAutoScrollGlide(
    state: HeroAutoScrollState,
    dtSeconds: number,
    durationSeconds: number,
  ): HeroAutoScrollState;
  // progress = clamp(elapsed / max(duration, 0.05), 0, 1); ease-out-cubic (1 - (1 - t)^3);
  // offset = from + (target - from) * eased; по завершении: mode 'idle',
  // обе координаты wrap: ((v % 2) + 2) % 2 (без скачка эффективных Θ0/Φ0 — период панели).
  export function cancelHeroAutoScrollGlide(state: HeroAutoScrollState): HeroAutoScrollState;
  ```

- [ ] `hero-sphere-gallery-motion.test.ts` — новые кейсы (random — заскриптованная
      последовательность): шаг = `2/n` (n = 1, 3, 6); цель — всегда другой ряд, оба знака
      достижимы (перебор значений random), с 1‑го ряда достижим любой из остальных (пример «1 →
      4» при n = 4 через кратчайший путь −1); кратчайший путь не длиннее `n/2` рядов; ничья при
      чётном n разрешается знаком от random; `n = 1` — только горизонталь; горизонтальная
      амплитуда ∈ [0.1, 0.45] с обоими знаками; смена числа рядов между переходами меняет сетку
      только со следующего перехода; отменённый на середине переход при следующем старте
      доцентровывается к ближайшему ряду; завершение делает wrap обеих координат в [0, 2) без
      изменения дробной части относительно сетки; продвижение монотонно по обеим осям и достигает
      цели ровно при `elapsed = duration`; ease‑out: за первую половину времени пройдено больше
      половины пути; `dt = 0` ничего не меняет.

## 3. Сайт — рендерер и компонент

- [ ] **`hero-sphere-gallery-webgl.ts`**
  - Состояние: `let autoScroll = createHeroAutoScrollState();` и `let autoScrollTimer: number |
    null = null;` + `armAutoScrollTimer()`: очищает старый таймер и, если
    `settings.gallery.type === 'sphere' && settings.gallery.sphere.autoScroll.enabled &&
    active && !reducedMotion && !contextLost`, ставит `window.setTimeout(() => {
    autoScroll = beginHeroAutoScrollGlide(autoScroll, rows.length, Math.random); schedule(); },
    interval * 1000)`.
  - `draw()`: при `autoScroll.mode === 'gliding'` и `shouldAdvancePhases` — продвинуть на тот же
    клампованный `frameDt` с `duration` из настроек; построить `const effectivePan = { turns,
    x: sphere.pan.x + autoScroll.offset.x, y: sphere.pan.y + autoScroll.offset.y };` и
    использовать его в `layoutHeroSphereGallery({ ..., pan: effectivePan })`, в
    `getHeroLensOrigin({ pan: effectivePan, ... })` и в `previousRenderedPan` (хранить
    эффективные `x`/`y`), чтобы окно скорости видело переход по обеим осям. В конце кадра:
    переход активен ⇒ `schedule()`; переход завершился в этом кадре ⇒ `armAutoScrollTimer()`.
  - `setSettings`: если `autoScroll.enabled` стал `false` (или тип галереи ушёл со sphere) —
    `autoScroll = createHeroAutoScrollState()` (смещение сброшено в `{x: 0, y: 0}` — мгновенный
    возврат к authored‑положению) и очистить таймер + `schedule()` один кадр; иначе если изменился
    authored `pan` (сравнение с `previousPan` уже есть) —
    `autoScroll = cancelHeroAutoScrollGlide(autoScroll)`; в любом случае перечитать конфиг и
    `armAutoScrollTimer()`. `setActive`/`setReducedMotion`: при выключении — отменить переход и
    очистить таймер, при включении — `armAutoScrollTimer()`. `dispose` и `handleContextLost` —
    очистить таймер. `handleContextRestored` — `armAutoScrollTimer()`.
  - `getState()` дополнительно возвращает `autoScrollOffset: { ...autoScroll.offset }`
    (диагностика); поле добавить в `HeroSphereGalleryRendererState` (и в
    `pendingRendererState`/`fallbackRendererState` компонента значением `{x: 0, y: 0}`, если
    Delivery 35 уже выполнена — сверить фактическое состояние файла).
- [ ] **`hero-sphere-gallery.tsx`** — наблюдаемость: на корневой элемент атрибут
      `data-hero-gallery-auto-scroll={`${state.autoScrollOffset.x.toFixed(4)}:${state.autoScrollOffset.y.toFixed(4)}`}`.
      Больше ничего: настройки приходят через существующий `setSettings`.
- [ ] **`hero-scene-settings.ts`** — тип `sphere.autoScroll: { duration: number; enabled:
      boolean; interval: number }`; дефолт `{ duration: 0.45, enabled: false, interval: 6 }`;
      `numericBounds`: `autoScrollDuration: [0.15, 2]`, `autoScrollInterval: [0.5, 60]`; кламп в
      нормализации, `enabled` — строго boolean (иное ⇒ `false`); старые JSON без поля получают
      дефолты (выключено). `hero-scene-settings.test.ts` — кейс: отсутствие поля ⇒ дефолты
      (enabled false); `interval: 90` ⇒ 60; `duration: 0` ⇒ 0.15; `enabled: 'yes'` ⇒ false.
- [ ] **`hero-preview-boundary.tsx`** — `previewProtocolVersion` 15 → 16. Контракт в
      `hero-dispersion-post-shader.test.ts` (`…on protocol v15`) — переименовать и обновить регекс
      на `/const previewProtocolVersion = 16;/`.

## 4. Toolcraft

- [ ] **`src/app/hero-gallery-values.ts`** — таргеты `autoScrollEnabled:
      "sphere.autoScroll.enabled"`, `autoScrollInterval: "sphere.autoScroll.interval"`,
      `autoScrollDuration: "sphere.autoScroll.duration"`; `HeroGallerySettings.sphere.autoScroll:
      Readonly<{ duration: number; enabled: boolean; interval: number }>`; дефолты
      `{ duration: 0.45, enabled: false, interval: 6 }`; чтение: boolean строго (по образцу
      `warpWaveEnabled` в dispersion‑values), числа — кламп по границам `[0.5, 60]` / `[0.15, 2]`.
      `hero-gallery-values.test.ts` — клампы и дефолты (NaN/не‑boolean ⇒ дефолт).
- [ ] **`src/app/hero-preview-protocol.ts`** — `HERO_PREVIEW_PROTOCOL_VERSION = 16` (payload
      берёт форму из values‑типа автоматически; убедиться, что `HERO_PREVIEW_DEFAULTS` включает
      новый объект).
- [ ] **`src/app/app-schema.ts`** — новая секция после Gallery Placement: `id: "auto-scroll"`,
      `title: "Auto Scroll"`, три контрола: свитч «Auto scroll» → `sphere.autoScroll.enabled`
      (sphere‑only applicability, описание «Periodically jumps the gallery to another spot; turn
      off while tuning the scene») и два слайдера, видимых только при включённом свитче
      (applicability: sphere‑only **и** `{ equals: true, target: sphere.autoScroll.enabled }`, по
      образцу связки `warpWaveEnabled` → wave‑слайдеры в dispersion‑секциях): «Interval» →
      `sphere.autoScroll.interval`, 0.5–60, шаг 0.5, unit "s", описание «Pause between automatic
      jumps to another gallery spot» — и «Jump time» → `sphere.autoScroll.duration`, 0.15–2, шаг
      0.05, unit "s", описание «How long each automatic jump takes; shorter is sharper and smears
      more». SemanticGroup не нужен (3 контрола).
- [ ] **`src/app/app-acceptance-data.ts`** — inventory‑блок секции: `entity: "Hero gallery auto
      scroll"`, `entityId: "hero-gallery-autoscroll"` (свой entityId ⇒ правило когезии сыто),
      `id: "auto-scroll"`, все три таргета, `groupingReason`: переключатель, интервал и
      длительность определяют один автономный цикл прыжков по галерее. Проверить
      cross‑section‑gating правило: свитч и зависимые слайдеры в одной секции — конфликтов нет.
- [ ] **`src/app/hero-preview-pipeline.ts`** — свитч в control‑change список (по образцу
      `warpWaveEnabled`), оба слайдера — в control‑drag.
- [ ] **`src/app/hero-product-control-acceptance.ts`** — три строки (switch + два slider) с
      продукт‑описанием; **`src/app/hero-preview.product.test.ts`** — три кейса
      `read: (settings) => settings.gallery.sphere.autoScroll.enabled / .interval / .duration`
      по образцу соседних.
- [ ] Прогнать `app-acceptance.section-*.test.ts` (титулы/размер/когезия/зависимости) — новая
      секция должна пройти без исключений.
- [ ] **e2e** — в `e2e/product-gallery-pan.spec.ts` (рядом с pan‑кейсами) новый кейс
      `browser: auto scroll jumps the Sphere to another spot`: включить свитч «Auto scroll»
      реальным кликом (слайдеры появляются по applicability), выставить Interval `1`, Jump time
      `0.3`; прочитать `data-hero-gallery-auto-scroll` (`0.0000:0.0000`), подождать ≥ 1.6 с;
      ожидать: атрибут изменился (проверять строку целиком), pixel‑дельта снапшотов > порога;
      затем выключить свитч ⇒ атрибут возвращается ровно к `0.0000:0.0000` (сброс к
      authored‑положению) и больше не меняется. Отдельной проверкой:
      `page.emulateMedia({ reducedMotion: 'reduce' })` ⇒ при включённом свитче атрибут не
      меняется. Существующие stable‑snapshot кейсы не трогать — дефолт выключен.
- [ ] **Worklog** — запись Delivery 36: принятая интерпретация (случайный другой ряд с кратчайшим
      кольцевым путём вверх/вниз + случайный горизонтальный сдвиг обоих знаков; резкость через
      длительность + ease‑out), владение анимацией на сайте (паритет с rows[].speed), сетка
      `2/rowCount` от динамического числа рядов, свитч включения с мгновенным сбросом смещения к
      authored‑положению, протокол v16, паузы
      (свитч/драг/интервал/reduced motion/visibility/snapshot), фактические проверки §6, границы §8.

## 5. Целевое поведение

- **M0** — свитч «Auto scroll» в Toolcraft включает/выключает эффект одним кликом: выключение
  мгновенно останавливает прыжки и возвращает сцену ровно в authored‑положение (смещение = 0) —
  удобно для разработки; слайдеры Interval/Jump time видимы только при включённом свитче.
- **M1** — при включённом свитче галерея каждые `interval` секунд резко (ease‑out, `duration` с)
  прыгает в другую точку: случайный другой ряд (в обе стороны — например 1 → 4) с одновременным
  случайным сдвигом влево или вправо; во время прыжка виден тот же смаз движения, что при быстром
  драге; после остановки смаз затухает штатно, без рывка.
- **M2** — число рядов меняется в Toolcraft на лету ⇒ следующий прыжок использует новую сетку
  `2/rowCount` и новый список целевых рядов; при одном ряде прыжки чисто горизонтальные.
- **M3** — драг ручки Pan мгновенно отменяет прыжок и перезапускает отсчёт; authored `sphere.pan`
  никогда не меняется авто‑скроллом (undo/история/персистенс чистые); F5 возвращает к authored
  положению.
- **M4** — свитч выключен (дефолт) ⇒ поведение сцены побайтно как сейчас; reduced motion ⇒
  авто‑скролл выключен; скрытая вкладка не накапливает прыжки; snapshot‑протокол стабилен.
- **M5** — работает и в Toolcraft‑iframe, и на standalone‑сайте (Apply переносит новые поля);
  Rows‑режим не затронут.

## 6. Проверки

- [ ] Сайт: RED → GREEN `pnpm dlx tsx --test src/components/pages/home/hero-sphere-gallery-motion.test.ts src/components/pages/home/hero-scene-settings.test.ts src/components/pages/home/hero-dispersion-post-shader.test.ts src/components/pages/home/hero-sphere-gallery-lifecycle.test.ts src/components/pages/home/hero-sphere-layout-phase.test.ts src/components/pages/home/hero-sphere-layout-visibility.test.ts`;
      focused `oxfmt`; `pnpm lint`; `pnpm build`; `git diff --check` (typecheck/format —
      pre‑existing блокеры, зафиксировать).
- [ ] Toolcraft: focused vitest (values/product/dispersion‑toolcraft + section‑тесты); браузерные:
      новый auto‑scroll кейс, `product-gallery-pan.spec.ts` целиком и
      `browser: dispersion.velocity changes the embedded hero output` — зелёные.
- [ ] Ручные (настройки пользователя): (0) свитч выкл → сцена неподвижна; вкл → прыжки; выкл во
      время прыжка → мгновенный возврат к authored‑положению без остаточного смещения, Undo/Redo
      по свитчу работает; (а) свитч вкл, Interval 5, Jump time 0.3–0.5 — каждые 5 с резкий
      диагональный прыжок с выраженным смазом, направления и дистанции меняются (несколько минут
      наблюдения: встречаются и вверх, и вниз, и влево, и вправо, и дальние ряды); (б) сменить
      число рядов 3 → 4 → следующий прыжок уже по новой сетке, «1 → 4» достижим; (в) драг во
      время прыжка — прыжок отменён, отсчёт заново; (г) свитч выкл — полная неподвижность;
      (д) reduced motion — авто‑скролл молчит; (е) Apply → standalone: работает на сайте без
      Toolcraft, выключенный свитч на сайте тоже уважается; (ж) фоновая вкладка 2 мин → возврат
      без «догоняющих» прыжков; (з) Jump time 2 с —
      переход мягкий и медленный (смаз слабее), 0.15 с — почти мгновенный с максимальным смазом.

## 7. Verification note

```md
Verification tier: Tier 2
Reason: New coordinated feature (one Toolcraft switch + two gated sliders + protocol v16 + website-owned random jump animation); defaults keep current behavior; no new pass/texture/framebuffer.
Run: focused tsx site tests (motion RED→GREEN with seeded random, settings, shader-contract v16, lifecycle, layout); toolcraft focused vitest incl. section tests; the new auto-scroll browser case plus product-gallery-pan and dispersion.velocity; oxfmt on touched files; site lint/build; git diff --check; manual checks §6.
Skip: verify:delivery; verify:perf; export matrices; site typecheck/format (pre-existing blockers, record them).
```

## 8. Риски и что сознательно не делаем

- Горизонтальная амплитуда `[0.1, 0.45]` pan‑единиц и кратчайший кольцевой путь по рядам (не
  длиннее `n/2`) — зашитые константы этой доставки; отдельные контролы амплитуды/дистанции или
  «длинный путь» — только следующей доставкой. Пример пользователя «1 → 4» покрыт: целевым рядом
  может быть любой, путь к нему — кратчайший (при n = 4 это один ряд вверх через кольцо).
- Случайность не сидируется и не персистится: последовательность прыжков у каждой загрузки своя;
  в юнит‑тестах random подменяется, в браузерном кейсе проверяется факт изменения, а не конкретная
  цель.
- Короткий Jump time (0.15 с) упирает смаз в существующий клип 140 px — это осознанный предел
  резкости; interval считается от конца прыжка, поэтому «прыжок длиннее паузы» невозможен.
- Авто‑смещение не персистится: перезагрузка/Reset возвращают authored pan — это презентационная
  анимация, а не редактирование значения.
- Для разработки эффект глушится штатным свитчем «Auto scroll» (дефолт — выключен); выключение
  мгновенно (без обратного глайда) возвращает сцену к authored‑положению — это осознанный резкий
  снап, отдельную анимацию возврата не делаем. Свитч — обычная персистируемая настройка сцены, а
  не editor‑only флаг: что сохранено, то и уедет на сайт через Apply.
- Если Delivery 35 (reveal) ещё не выполнена к моменту исполнения — поля
  `pendingRendererState`/`settledIds` в §3 могут отсутствовать; сверять фактические файлы, пункты
  независимы.
