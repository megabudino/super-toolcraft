# Hero Gallery — эффект краёв одним проходом на сцену, зона по геометрии панно (план)

> **For agentic workers:** план рассчитан на выполнение по задачам (checkbox `- [ ]`) с
> `superpowers:subagent-driven-development` или `superpowers:executing-plans`. Перед правками
> обязателен preflight из `AGENTS.md` → `docs/toolcraft/workflow.md` (маршруты «Schema, controls…»,
> «Renderer, canvas output…»; Plan-фаза до спеки, Implementation-фаза перед кодом, Verification-фаза
> перед пруфом). Этот файл — единственный документ доставки (диагноз §1–§2, дизайн §3–§4, план §5–§10).
>
> **Контекст.** Sphere-галерея (Delivery 21, план `2026-08-21-hero-gallery-panel-lens.md`) рисует
> панно сквозь линзу одним WebGL1-канвасом, но эффект краёв (Edge Zone / Edge Warp / Dispersion & Aura /
> Boundary Aura) по-прежнему исполняется **внутри каждой карточки** тем же фрагментным шейдером, что и в
> Rows. Пользователь видит случайные помигивания при работающей анимации и тормоза; хочет, чтобы эффект
> считался **один раз на всю сцену**, но умел ложиться на изогнутую поверхность панно (зона применения
> повторяет геометрию рядов) и при необходимости заходил на верх/низ. Эта доставка не зависит от плана
> профиля линзы (`…-hero-lens-profile-and-edge-clipping.md`, Delivery 22), но рекомендуется выполнять
> после него: оба меняют вершинную проекцию, и клиппинг по плоскости камеры нужен здесь тоже. Номер
> записи worklog — следующий свободный (**Delivery 23**, перепроверить), протокол — следующий после
> текущего (**v12**, если v11 занят планом профиля; иначе v11).
>
> **Параллельная работа / режим проверки.** Как раньше: перечитывать файлы, не откатывать чужое, не
> коммитить без разрешения; уточнить, действует ли «без проверок», по умолчанию выполнять §9.

---

## 1. Как эффект работает сейчас (факты из кода)

`recraft-v4-styles/src/components/pages/home/`:

- `hero-card-dispersion-webgl.ts` → `HERO_DISPERSION_FRAGMENT_SHADER` — один шейдер для Rows (per-card
  канвасы) и Sphere (`hero-sphere-gallery-webgl.ts` линкует его со своим вершинным). Работает в
  **card-space** (px авторской карточки: `vPoint`, `uCardOrigin`, `uCardSize`, `sampleCard` → вне `[0,1]`
  прозрачно) и вызывается **на каждую карточку отдельно**: на кадр до 96 `drawArrays`, каждая —
  сетка 48×12 над прямоугольником карточки **плюс bleed 256 px по бокам и 80 px сверху/снизу**.
- Маска зоны — экранная: `canvasX = gl_FragCoord.x / uBackingSize.x · uScreenSize.x`, `edgeDistance =
  uSide < 0 ? viewportX : uViewportWidth − viewportX`, `zonePixels = uViewportWidth · uEdgeWidth`,
  `distance = clamp(1 − edgeDistance / zonePixels)`, `edge = pow(distance, uCurve)`. То есть зона —
  **прямая вертикальная полоса** у левого или правого края экрана; верх/низ не обрабатываются; сторона
  `uSide` выбирается **на карточку целиком** по её центру (`side = centerX < W/2 ? −1 : 1`), поэтому
  широкая карточка, пересёкшая середину, мгновенно меняет сторону маски, seed турбулентности
  (`sideSeed 13.7 / 3.1`) и направление всех смещений.
- Все смещения (warp, wave, dispersion `uSide·span·spread`, aura, gate ridge) — вдоль card-space `x`,
  т.е. вдоль авторской горизонтали карточки, а не вдоль изогнутого ряда на экране.
- Дорогой путь (`for i < uSamples` до 48 выборок + 12 aura + 5 gate) включается, когда `extent = span +
  |uVelocity| ≥ 0.5`. Вне зоны `span = 0`, но при работающей анимации `uVelocity ≠ 0` у каждой карточки
  ⇒ цикл из `uSamples` выборок исполняется **на каждом фрагменте каждой карточки по всему экрану**,
  включая bleed-области, где `sampleCard` возвращает ноль. Из-за bleed и отрицательных gap'ов один
  экранный пиксель покрыт 2–4 мешами ⇒ 2–4 полных цикла на пиксель на кадр. При `count 28`, DPR 2 и
  клампе backing 5 MP это порядка 300–500 M текстурных выборок на кадр — главный источник тормозов.
- Motion boost: `uVelocity` на карточку = сглаженная дельта `centerX` между кадрами (ключ
  `${row}:${source.key}:${copy}:${cycle}`, `velocitySmoothing 0.2`, клип ±140, gain 1.6). Velocity
  участвует в `extent`, смещениях (`uVelocity·spread·2`), `drift` турбулентности (`fbm(rowCoord,
  sideSeed + drift)`) и `motionKick` gate. Любой скачок velocity — мгновенное изменение контура halo и
  smear'а.
- `setDispersionUniforms` загружает ~30 uniform'ов на каждую карточку на каждом кадре.
- Дизеринг выборок — `ditherPhase(gl_FragCoord.xy + index·…)`: паттерн привязан к экрану, контент
  движется под ним ⇒ лёгкое «зерно/шиммер» в зоне при движении (поведение референса).

## 2. Причины помигиваний и тормозов

| # | Причина | Уверенность | Лечение |
| --- | --- | --- | --- |
| C1 | Скачки `uVelocity`: карточка, отсечённая на несколько кадров (агрессивный culling у плоскости камеры — см. план Delivery 22), возвращается с прежней записью `centerPositions` (живёт 2 с) ⇒ `instantaneous` = накопленный сдвиг ⇒ всплеск smear'а и сдвиг `drift` турбулентности; то же при смене `copy` на переходе фазы через период. | высокая | Velocity считается аналитически на пиксель из скорости ряда и пана (§4.5) — per-card состояния больше нет. |
| C2 | Переворот `uSide` у карточки, пересекающей середину экрана: маска, seed турбулентности и направление смещений меняются скачком у всей карточки, включая её часть в зоне. | высокая | Сторона/направление вычисляются на пиксель из поля линзы (§4.3). |
| C3 | Исчезновение карточек у краёв (culling с bleed-точками) — «мигание» края. | высокая | Клиппинг GPU (план Delivery 22, §4.1); здесь — обязательная зависимость. |
| C4 | Полный цикл выборок вне зоны при любой ненулевой velocity × overdraw bleed'ов. | высокая (тормоза) | Один full-screen проход с ранним выходом вне зоны (§4.4). |
| C5 | Экранный дизер при движении контента. | средняя (шиммер, не «мигание») | Оставить как у референса; опция — seed по координатам панно (§10). |
| C6 | Перезагрузка uniform'ов на карточку. | низкая (CPU) | Один набор uniform'ов на кадр в post-проходе. |

## 3. Целевое поведение

- **R1** — эффект исполняется **один раз на кадр** как post-проход по готовой сцене; стоимость не
  зависит от числа карточек и перекрытий.
- **R2** — зона применения может быть либо экранной (как сейчас: полосы у левого/правого края), либо
  **панельной**: граница зоны и направление smear'а следуют геометрии панно — линии постоянной долготы
  линзы, изогнутые вместе с рядами.
- **R3** — зона может заходить на верх и низ (полосы по широте) с собственной шириной; 0 = выключено.
- **R4** — визуальный паритет с текущим видом в экранном режиме при тех же настройках (дисперсия,
  aura, warp, wave, gate, fade, turbulence), кроме исправленных артефактов (C1–C3).
- **R5** — motion boost детерминирован: никаких всплесков при culling'е, переходе фазы или смене
  стороны; направление smear'а — вдоль движения контента на экране.
- **R6** — Rows-режим не меняется (per-card рендер остаётся, общий GLSL выносится в модуль).

## 4. Архитектура: два геометрических прохода + один post-проход

### 4.1 Буферы

- **A — сцена** (RGBA8 FBO, premultiplied): backing-размер **с полями** `margin = (256, 80)` CSS px
  (умноженные на backing-ratio) вокруг вьюпорта — чтобы выборки smear'а/aura у края экрана находили
  реальный контент за кромкой (раньше это давал per-card bleed). Рисуются все карточки текущей
  раскладки **минимальным** фрагментным шейдером (`sampleCard` премультиплицированно), blend
  `ONE, ONE_MINUS_SRC_ALPHA`, culling как сейчас, clear `(0,0,0,0)`. `TEXTURE_MIN/MAG_FILTER = LINEAR`,
  `CLAMP_TO_EDGE`.
- **B — поле линзы** (RGBA8 FBO, без полей, backing-размер): рисуется **поверхность линзы целиком** —
  одна сетка `(θ, φ)` на окно `θ ∈ [−π, π)`, `φ ∈ [−85°, 85°]` (например 192×64 квадов) тем же
  вершинным кодом (однородный клип-спейс из плана Delivery 22). Фрагментный шейдер кодирует
  `θ` и `φ` по 16 бит: `R,G = θ`, `B,A = φ` (`θ ∈ [−π, π) → [1, 65535]`, `φ ∈ [−π/2, π/2] → [0, 65535]`;
  точность ~1e-4 рад ≈ 0.06 px при `Rx = 610`). Clear — `(0,0,0,0)`: `θ`-код `0` = «нет поверхности»
  (фон за силуэтом выпуклого профиля / вне окна). `NEAREST`, `CLAMP_TO_EDGE`. Поле покрывает и
  промежутки между карточками, и область за последним рядом — зона и направление определены везде,
  где есть поверхность, поэтому halo может выходить за контент, как раньше за счёт bleed.
- **Post** — полноэкранный треугольник в default framebuffer (premultiplied), blend выключен.
- Размеры A/B пересоздаются в `setSize`; при `checkFramebufferStatus ≠ COMPLETE` — `renderer: 'fallback'`.
  Потеря/восстановление контекста пересоздаёт всё. `captureFrame` снимает default framebuffer после
  post-прохода — без изменений.
- Опционально (если доступно `WEBGL_draw_buffers`) A и B можно писать в одном проходе; базовый путь —
  два прохода, геометрия дешёвая (≤ 96 карточек × 1152 треугольника + сетка поля).

### 4.2 Post-шейдер: общее

Вход: `uScene` (A), `uField` (B), `uSceneSize/uSceneMargin`, `uScreenSize/uBackingSize`, все uniform'ы
дисперсии (как сейчас, один раз на кадр), параметры зоны (§4.3), параметры velocity (§4.5),
`uCardHeight`, `uPitch`, `uRowCount`, `uRx`, `uRy`, `uPhi0`.

Для пикселя `p` (CSS px экрана): `field = decode(uField, p)`; если «нет поверхности» ⇒
`gl_FragColor = sampleScene(p)` и выход. Иначе:

- `θ, φ` → панно: `u = (θ − Θ0)·Rx`, `v = (Φ0 − φ)·Ry`, индекс ряда `r = round((v − v_0)/pitch) mod n`,
  центр ряда `v_r` ⇒ `dv = v − v_r` (заменяет card-space `point.y − midY`).
- Градиенты поля конечными разностями по соседним текселям B: `gθ = ∇θ`, `gφ = ∇φ` (экранные px⁻¹);
  `dirθ = normalize(gθ)`, `dirφ = normalize(gφ)`; `pxPerRad = 1/|gθ|` (px экрана на радиан долготы).
  Соседи с кодом «нет поверхности» исключаются из разности (односторонняя разность).
- `sampleScene(q)` = `texture2D(uScene, (q + margin)/sceneSize)` — все прежние `sampleCard(point + …)`
  становятся `sampleScene(p + …)`; `authoredCoverage` = `sampleScene(p_warped).a`;
  `outsideAuthoredContent` и спектральная бахрома — как сейчас (вне контента остаётся только бахрома).

### 4.3 Зона и направление

`zoneSpace ∈ {viewport, panel}` (новый контрол), `edgeWidth` (есть), `topWidth` (новый, 0 = выкл).

- **viewport** (нынешнее поведение, на пиксель): `d_side = clamp(1 − min(x, W − x)/(W·edgeWidth))`,
  `dir_side = (sign(x − W/2), 0)`; `d_vert = clamp(1 − min(y, H − y)/(H·topWidth))`, `dir_vert =
  (0, sign(y − H/2))` (при `topWidth = 0` ⇒ `d_vert = 0`).
- **panel**: на CPU раз в кадр бисекцией по прямой проекции находятся долготы точек, где экватор
  (`φ = 0`) покидает экран слева и справа — `θ_L < 0 < θ_R`, и широты, где меридиан `θ = 0` покидает
  экран сверху/снизу — `φ_T > 0 > φ_B` (несимметрично при сдвиге `position`). Зона по долготе: ширина
  `w_θ = edgeWidth · (θ_R − θ_L)`; `d_side = clamp(1 − (θ_R − θ)/w_θ)` для `θ > 0`, `clamp(1 − (θ −
  θ_L)/w_θ)` для `θ < 0`; `dir_side = sign(θ)·dirθ`. По широте: `w_φ = topWidth · (φ_T − φ_B)`;
  `d_vert = clamp(1 − (φ_T − φ)/w_φ)` сверху, `clamp(1 − (φ − φ_B)/w_φ)` снизу; `dir_vert = sign(φ)·dirφ`
  (`dirφ` растёт вверх по экрану ⇒ для верхней зоны наружу = вверх, для нижней — вниз). На экваторе зона совпадает с экранной той же ширины, выше/ниже её
  граница изгибается вместе с рядами; вертикальная зона — полосы по широте, т.е. «заходит на верх»
  по той же геометрии.
- Объединение: `distance = max(d_side, d_vert)`, `dir` — направление доминирующей зоны (`d_side ≥
  d_vert ? dir_side : dir_vert`), `perp = rot90(dir)`. Далее `edge = pow(distance, uCurve)`, `warpT`,
  `gateS`, `band`, `fade` — формулы без изменений.
- Замена осей в формулах: `point.x −= uSide·k` → `p −= dir·k`; `point.y += (point.y − midY)·k/h` →
  `p += perp · dv · k / uCardHeight · (1/(|gφ|·Ry))` (перевод сдвига из px панно в px экрана; при
  `uWarpStyle = stretch` и `kink` Prism); смещения выборок `vec2(uSide·span·spread + vel·spread·2,
  jitterY·verticalExtent)` → `dir·(span·spread + vel·spread·2) + perp·(jitterY·verticalExtent)`; aura и
  gate ridge аналогично. Волна: `phase = dv·2π/waveLen`; `waveHeight(p, …)` использует `px = u / (4·
  uCardHeight)` вместо `point.x/uViewSize.x` (нормировка авторской ширины заменена фиксированной — это
  только фаза органической составляющей). `sideSeed` турбулентности: `sign(θ) > 0 ? 13.7 : 3.1` для
  боковых зон, `sign(φ) > 0 ? 21.3 : 8.9` для вертикальных; `rowCoord = (dv + v_r)·uTurbulenceFreq`
  вдоль `perp` — непрерывен по экрану.

### 4.4 Ранний выход и бюджет

- `span = (uAmount + uBlur)·edge·turb + uWarpWaveBlur·warpWindow` как сейчас; **полный цикл только при
  `span ≥ 0.5 || |vel| ≥ 1.5`** (smear меньше 1.5 px невидим) — вне зон при обычных скоростях post-проход
  = одна выборка. Это главный выигрыш: стоимость ≈ `пиксели зон × (count + 12 + 5)` один раз за кадр
  вместо `пиксели всех bleed-мешей × overdraw × count`.
- Геометрические проходы: ≤ 96 карточек + сетка поля; uniform'ы дисперсии грузятся один раз.
- Память: A ≈ `(W + 512)·(H + 160)·ratio²·4` байт, B ≈ `W·H·ratio²·4`; при клампе 5 MP ≈ 30 + 20 MB.

### 4.5 Motion boost без per-card состояния

Скорость контента под пикселем выводится из скоростей рядов и пана:

- `uRowRate[r]` (рад/с) = `speed_r·π/180` (+ 0 при reduced motion); `uPanRate` (рад/с) — сглаженная
  (`0.2`) оценка `ΔΘ0/Δt` между последовательными settings (драг по холсту/пад); `rate = uRowRate[r] +
  uPanRate`.
- `vel_px = rate · dt · pxPerRad` (px за кадр, знак = направление движения по `dirθ`), затем как сейчас:
  `vel = clamp(vel_px · uVelocityGain(1.6) · dispersion.velocity, ±140)`. Проекция на направление зоны:
  `velAlong = vel · dot(dirθ, dir)` используется там, где раньше был скалярный `uVelocity` (extent,
  смещения, drift, motionKick).
- Следствия: нет ключей, карт `centerPositions/velocities/lastSeen`, всплесков и «мигания»; расписание
  rAF: `rows.some(speed ≠ 0) || |uPanRate| > ε` (затухает после драга).

### 4.6 Дизеринг

`ditherPhase(gl_FragCoord.xy + …)` остаётся (паритет с референсом). Если пользователь после перехода
всё ещё видит шиммер — заменить seed на `floor(vec2(u, v))` (паттерн едет вместе с контентом); решение
принять по живому сравнению, контрол не добавлять.

## 5. Toolcraft

### 5.1 Контролы (секция `Edge Zone`, было 5 → станет 7)

| Target | Тип | Значения | Default | Label | Применимость | Описание |
| --- | --- | --- | --- | --- | --- | --- |
| `dispersion.zoneSpace` | `segmented` | `Viewport` / `Panel` (`"viewport"` / `"panel"`) | `"viewport"` | `Zone space` | `conditional: gallery.type == sphere` | «Viewport keeps straight bands at the screen edges; Panel bends the zone and its smear along the curved rows of the panel.» |
| `dispersion.topWidth` | slider continuous, `%`, 0–50, step 1 | — | 0 | `Top and bottom` | `conditional: gallery.type == sphere` | «Adds the same treatment along the top and bottom of the scene; 0 keeps the effect on the sides only.» |

Оба — `performanceRole: responsiveness` (`performanceReason`: «Zone geometry updates one post-pass uniform
set in the retained website renderer.»), `semanticGroup` не обязателен (секция < 8), `orderRole: "detail"`;
порядок: `Edge width → Zone space → Top and bottom → Falloff → Edge fade → Turbulence → Turbulence size`.
Гейтинг селектором из секции `Gallery` допустим: префикс `dispersion` ≠ `gallery`, заголовок «Edge Zone»
не содержит текста ветки (правило `control-layout-dependency-rules.ts`, см. план Delivery 21 §2).
`Edge width` описание уточнить: «Sets how far the effect reaches inward from each side of the scene.»

### 5.2 Значения и протокол

- `hero-dispersion-values.ts`: `heroDispersionTargets.zoneSpace = "dispersion.zoneSpace"`, `topWidth =
  "dispersion.topWidth"`; `HeroDispersionSettings` += `zoneSpace: "viewport" | "panel"`, `topWidth:
  number`; `HERO_DISPERSION_DEFAULTS`: `zoneSpace: "viewport"`, `topWidth: 0`;
  `createHeroDispersionSettingsFromValues` — clamp 0–50, enum с fallback.
- `hero-preview-protocol.ts`: версия +1 (`v12`/`v11` по контексту), `runtimeId` пайплайна — та же версия.
- `hero-preview-pipeline.ts`: `HERO_DISPERSION_CONTROL_DRAG_TARGETS` += `topWidth`,
  `HERO_DISPERSION_CONTROL_CHANGE_TARGETS` += `zoneSpace`.
- `app-acceptance-data.ts`: общий `.map` ownership уже берёт `Object.values(heroDispersionTargets)` —
  новые target'ы попадут автоматически; строки acceptance в списке `[target, label, type, observable]`:
  `[zoneSpace, "Zone space", "segmented", "Panel bends the treated band and its smear along the curved
  rows; Viewport keeps straight vertical bands at the screen edges."]` + `optionCoverage: ["viewport",
  "panel"]`; `[topWidth, "Top and bottom", "slider", "Treated bands appear along the top and bottom of the
  scene and widen with the value; zero removes them."]`; инвентарь `edge-zone` += оба target'а,
  `groupingReason` — «…width, zone space, top/bottom reach, falloff, fade and the turbulence pair…».
  `referenceFeatureInventory.reference.hero-edge-zone.toolcraftMapping` — «…one full-screen post pass with a
  viewport- or panel-space band…». `referenceFeatureInventory.reference.hero-dispersion-optics
  .toolcraftMapping` — заменить «Each card retains one image texture and runs the same bounded loops;
  Motion boost consumes measured CSS card movement…» на «The website renders all cards into one scene
  buffer and runs the bounded loops once per pixel inside the treated bands; Motion boost derives per-pixel
  velocity from row speed and pan rate through the lens field».
- `app-performance.ts`: `performanceRisks` — «The sphere effect runs as one post pass: cost scales with
  treated-band pixels × samples, not with cards or overlap; scene and field buffers add two RGBA8
  framebuffers of viewport size»; `fidelityRisks` — «Panel-space zones follow lens longitude/latitude;
  with extreme bends the band boundary may leave the screen on the equator while remaining visible on
  other rows». Workload-измерения `lens-samples`/`edge-blur-radius` остаются (`count`, `blur`).

### 5.3 Unit-тесты

- `hero-preview.product.test.ts`: кейсы `dispersion.zoneSpace` (`"panel"`), `dispersion.topWidth` (18);
  версия протокола; `hero-dispersion-values` тесты enum/clamp (если файла нет — добавить app-owned
  `hero-dispersion-values.test.ts`).

## 6. Сайт (`recraft-v4-styles/src/components/pages/home/`)

### 6.1 `hero-scene-settings.ts`, `hero-preview-boundary.tsx`

- [ ] `HeroDispersionSettings` += `zoneSpace`, `topWidth`; `numericBounds.dispersionTopWidth: [0, 50]`;
      нормализатор с дефолтами (`viewport`, 0) — старые payload'ы/JSON валидны; `previewProtocolVersion`.

### 6.2 `hero-dispersion-shader.ts` (сейчас реэкспорт) → общий GLSL

- [ ] Вынести из `HERO_DISPERSION_FRAGMENT_SHADER` общие функции (`spectralWeight`, `ditherPhase`,
      `valueHash/valueNoise/fbm`, `waveHeight` с параметром нормировки) в строку
      `HERO_DISPERSION_GLSL_COMMON`; per-card шейдер Rows собирается из неё без изменения поведения.
- [ ] Новый `hero-dispersion-post-shader.ts`: `HERO_DISPERSION_POST_FRAGMENT_SHADER` (§4.2–§4.5),
      `HERO_SCENE_FRAGMENT_SHADER` (только `sampleCard`), `HERO_FIELD_FRAGMENT_SHADER` (кодирование θ/φ),
      `HERO_FIELD_VERTEX_SHADER` (сетка `(θ, φ)` через общую функцию проекции), функции `encode/decode`
      в GLSL и их TS-двойники для тестов.

### 6.3 `hero-sphere-gallery-webgl.ts` → разнести по файлам (каждый ≤ 1000 строк)

- [ ] `hero-sphere-gallery-webgl.ts` — публичный API (`setSettings/setSources/setSize/setActive/
      setReducedMotion/getState/captureFrame/dispose`), расписание кадров, CPU-раскладка, вызов проходов.
- [ ] `hero-sphere-gallery-passes.ts` — программы (scene, field, post), VBO карточки и сетки поля, FBO A/B
      с пересозданием по размеру и контексту, `drawScene(layout)`, `drawField()`, `drawPost(uniforms)`;
      проверка `checkFramebufferStatus`.
- [ ] `hero-sphere-gallery-textures.ts` — кэш текстур (перенос без изменений).
- [ ] Удалить per-card velocity (`centerPositions/velocities/lastSeen`), `setDispersionUniforms` на
      карточку; добавить `uRowRate[6]`, `uPanRate` (сглаживание по settings), бисекцию `θ_L/θ_R/φ_T/φ_B`
      раз в кадр (CPU, ≤ 24 итераций каждая) и её юнит-тест.
- [ ] Расписание: `rows.some(speed ≠ 0) || |panRate| > ε || dirtySettings`.
- [ ] `getState()` += `effect: 'post'` (диагностика), опционально `frameMs` (среднее за 60 кадров) только
      embedded — для сравнения до/после в worklog.

### 6.4 `hero-sphere-gallery.tsx`

- [ ] Атрибут `data-hero-gallery-effect="post"`, `data-hero-gallery-zone-space` — из settings; остальное
      без изменений (`data-hero-gallery-ready`, `onState`).

### 6.5 Rows

- [ ] `hero-dispersion-card.tsx` / per-card рендер — без изменения поведения (общий GLSL из §6.2,
      проверка побайтного паритета скриншотом).

### 6.6 Проверки сайта

- [ ] `pnpm exec oxfmt <файлы>`, `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `git diff
      --check`.
- [ ] Ручной контроль embedded на настройках пользователя: (а) viewport-режим визуально совпадает с
      текущим (скриншоты до/после при `speed = 0`), кроме: нет мигания края, нет скачка у карточек,
      пересекающих центр; (б) при анимации 60 с — ни одного «всплеска» halo/smear; (в) `frameMs` до/после
      при одинаковых настройках (ожидание — снижение в разы при `count 28`, `edgeWidth 30`); (г) `Zone
      space = Panel`: граница зоны изгибается вместе с рядами, smear идёт вдоль ряда; (д) `Top and bottom
      = 20` в обоих режимах; (е) Edge Warp Stretch/Prism, Wave Glass/Ripple, gate — работают в обоих
      режимах; (ж) Rows не изменился; (з) Apply → standalone совпадает.

## 7. Browser-проверки Toolcraft (`e2e/`, app-owned)

- [ ] `dispersion.zoneSpace` (segmented, обе опции) и `dispersion.topWidth` (slider) — через
      `registerHeroPreviewControlTests` с замороженной анимацией; observable — пиксели продукта.
- [ ] Регрессия паритета (app-owned спек): при `zoneSpace = viewport`, `speed = 0` — `snapshot` до/после
      не сравнивается автоматически (разные доставки), но спек проверяет, что `data-hero-gallery-effect
      = "post"` и что включение `topWidth = 30` меняет верхнюю полосу канваса (доля спектральных/
      прозрачных пикселей в верхних 10 % меняется), а `zoneSpace = panel` меняет распределение у краёв.
- [ ] `npm run test:feature -- dispersion.zoneSpace dispersion.topWidth dispersion.edgeWidth
      dispersion.amount dispersion.velocity` (долг прежних browser-спек — по режиму проверки).

## 8. Порядок задач

### Task 0 — Preflight и измерение

- [ ] Перечитать файлы §1, номер Delivery/версию протокола, режим проверки. Снять базовые скриншоты и
      `frameMs` (временно через `performance.now()` вокруг `draw`) на настройках пользователя — для
      сравнения в worklog.

### Task 1 — Toolcraft: контролы и протокол

**Files:** modify `src/app/hero-dispersion-values.ts`, `src/app/hero-dispersion-control-sections.ts`,
`src/app/hero-preview-protocol.ts`, `src/app/hero-preview-pipeline.ts`, `src/app/app-acceptance-data.ts`,
`src/app/app-performance.ts`, `src/app/hero-preview.product.test.ts`.

- [ ] §5. `npm run typecheck`, `pnpm ai:check`, `npm exec vitest run src/app`.

### Task 2 — Сайт: post-проход в экранном режиме (паритет)

**Files (site):** modify `hero-scene-settings.ts`, `hero-preview-boundary.tsx`, `hero-dispersion-shader.ts`,
`hero-card-dispersion-webgl.ts` (только вынос GLSL), `hero-sphere-gallery-webgl.ts`, `hero-sphere-gallery.tsx`;
create `hero-dispersion-post-shader.ts`, `hero-sphere-gallery-passes.ts`, `hero-sphere-gallery-textures.ts`.

- [ ] §4.1, §4.2, §4.4, §4.5 и viewport-ветка §4.3 (`topWidth` включительно). Паритет по §6.6 (а)–(в),
      (ж). Сдать как самостоятельный этап — он уже решает тормоза и мигания.

### Task 3 — Сайт: панельная зона

**Files (site):** modify `hero-dispersion-post-shader.ts`, `hero-sphere-gallery-passes.ts`,
`hero-sphere-gallery-webgl.ts`.

- [ ] Поле B, градиенты, panel-ветка §4.3, бисекция границ. Проверки §6.6 (г)–(е), (з).

### Task 4 — Browser-проверки и worklog

**Files:** create `e2e/product-gallery-effect.spec.ts`; modify спек со slider/segmented-кейсами;
`docs/toolcraft/agent-worklog.md`.

- [ ] §7. Worklog: `Delivery 23 — Single post-pass edge optics with panel-space zones` (request, task type,
      user-visible result, source checked — §1 с оценкой стоимости, docs read, rules applied, view
      interaction `fixed-camera` без изменений, ownership без изменений, decision: scene/field buffers +
      one post pass, per-pixel side/direction, analytic velocity, early-out, panel-space bands and
      top/bottom bands; alternatives: per-card pass with cheaper loop, screen-space only, per-pixel
      velocity buffer instead of analytic rate, WebGL2 MRT; state/output mapping `dispersion.zoneSpace/
      topWidth`, `data-hero-gallery-effect`; performance intent `ordinary-product-work` с измеренным
      `frameMs` до/после как evidence (не «measured performance iteration»); verification; risks).
      Обновить Status (версия протокола), Decisions (Renderer, Performance), Risks.

## 9. Verification note

```md
Verification tier: Tier 3
Reason: Later feature edit replaces the per-card sphere effect with a two-buffer post-process renderer (new framebuffers, shaders, analytic motion boost), adds two Edge Zone controls with conditional applicability, and bumps the versioned bridge; Rows renderer and Toolcraft runtime internals are unchanged.
Run: npm run typecheck; pnpm ai:check; npm exec vitest run src/app; npm run test:feature -- dispersion.zoneSpace dispersion.topWidth dispersion.edgeWidth dispersion.amount dispersion.velocity; app-owned effect spec; website oxfmt/format/lint/typecheck/build + git diff --check; live parity and flicker checks §6.6 embedded and standalone after Apply; frameMs before/after recorded in the worklog.
Skip: repeated npm run verify:delivery; verify:perf (measured performance certification not requested — frameMs is product evidence, not a performance gate); export matrices.
```

## 10. Риски и открытые вопросы

- Паритет по пикселям невозможен точно: смещения теперь в экранных px вдоль `dir`, а не в card-space
  `x` авторской карточки; на экваторе и в экранном режиме разница минимальна, на сильно изогнутых
  карточках smear станет следовать экрану/ряду, а не локальной горизонтали карточки — это и есть
  запрошенное поведение, но пользователь должен подтвердить по живому сравнению.
- Volna/Prism используют `dv` от центра ряда вместо `midY` карточки и фиксированную нормировку
  органической фазы — возможна лёгкая смена рисунка волны; зафиксировать скриншотами.
- Поле B 16-бит на канал через RGBA8: достаточно для масок/градиентов; если на каком-то GPU появятся
  ступеньки в направлении `dir` — перейти на `OES_texture_half_float` при наличии расширения (fallback
  остаётся RGBA8).
- Градиенты конечными разностями у силуэта выпуклого профиля (сосед — фон) — односторонние разности;
  у самого силуэта направление может дрожать на 1 px; маска там обычно `0`.
- Память двух FBO при DPR 2 и больших экранах; кламп backing 5 MP остаётся; при жалобах — B в половинном
  разрешении (маска и направление гладкие).
- Рендер Rows остаётся per-card (16 канвасов) — его стоимость не меняется; если понадобится, тот же
  post-проход можно применить к Rows отдельной доставкой.
- Долг browser-спек прежних доставок сохраняется, если проверки снова не запускаются.
