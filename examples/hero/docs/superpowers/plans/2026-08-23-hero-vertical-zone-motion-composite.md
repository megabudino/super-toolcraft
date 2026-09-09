# Hero Gallery — резкий «купол» в верхней/нижней зоне при движении: направленный смаз вместо диска и снятие композитного mix (план правок)

> **For agentic workers:** план рассчитан на выполнение по задачам (checkbox `- [ ]`) с
> `superpowers:subagent-driven-development` или `superpowers:executing-plans`. Preflight из
> `AGENTS.md` → `docs/toolcraft/workflow.md` обязателен. Этот файл — единственный документ доставки.
>
> **Контекст.** Delivery 32 (план `2026-08-22-hero-motion-smear-fixes.md`) выполнен, но симптом A —
> резкая область в форме купола у верхней кромки Sphere во время драга — остался. Причина: диагноз
> симптома A в том плане относился к **боковому** пути post-шейдера (`sideOffset`), а верхняя/нижняя
> зона после Deliveries 28–30 считается **отдельной веткой** (`verticalDominant`): статика и движение
> там свёрнуты в изотропный диск, а результат целиком подмешивается к резкой сцене по
> `smoothstep(verticalDistance)`. Правка `motionSign` из Delivery 32 этой ветки не касается, поэтому
> купол и не ушёл. Настройки воспроизведения — `herosettings 3.json` (`Dispersion 120`, `Blur 22`,
> `Top and bottom 4`, `Edge width 30`, `Motion boost 0.8`, `Turbulence 0.7 / 130`, `Aura 0.6`,
> `Refraction 22 / Width 63 / Offset 33`, `Bend X 50`, `Bend Y 99`, `Depth 1250`, `Perspective 1660`).
> Изменений протокола (v14), схемы, контролов и Rows нет — только сайт. Номер записи worklog —
> следующий свободный (сейчас 33, перепроверить). Режим проверки — уточнить; по умолчанию §6.
> Коммиты — только по явной просьбе пользователя.

---

## 1. Диагноз (текущий `hero-dispersion-post-shader.ts`, `HERO_DISPERSION_POST_FRAGMENT_SHADER`)

Номера строк — по состоянию файла на 2026‑08‑23 00:12; перед правкой сверить.

```glsl
// 337
float verticalDominant = verticalDistance > sideDistance ? 1.0 : 0.0;
// 360–361
float motionSign = dot(direction, motionVelocity) < 0.0 ? -1.0 : 1.0;
vec2 motionSmear = motionVelocity * motionSign;
// 438–441
float verticalTransition = smoothstep(0.0, 1.0, verticalDistance);
float verticalDispersionSpan = dispersionExtent;
float verticalSampleRadius = (verticalDispersionSpan + verticalExtent) * verticalTransition;
float verticalMotionRadius = length(motionVelocity);
// 495–504 (главный цикл)
vec2 sideOffset = direction * span * spread + motionSmear * spread * 2.0 +
  perpendicular * ((jitterY * 2.0 - 1.0) * verticalExtent);
vec2 verticalOffset = diskSampleOffset(direction, perpendicular, jitterX, jitterY,
  verticalSampleRadius + verticalMotionRadius);
vec2 offset = verticalDominant > 0.5 ? verticalOffset : sideOffset;
// 535–545 (aura) — то же: диск радиуса verticalAuraRadius + verticalMotionRadius * 1.5
// 587–588
float verticalTreatmentMix = mix(1.0, verticalTransition, verticalDominant);
color = mix(sampleScene(point), color, verticalTreatmentMix);
```

**Механизм купола.**

1. Внутри линзы вне зон (`sideDistance = verticalDistance = 0`) пиксель идёт по боковому пути с
   `span = 0`: `offset = motionSmear · spread · 2`. Это и есть «драг искажает всю галерею» — направленный
   смаз длиной `2·|v|` вдоль скорости (при драге `|v|` — десятки px, до клипа 140). Статическими зонами
   он намеренно не гейтится (Delivery 30).
2. Как только `verticalDistance > 0` (внутренняя граница верхней зоны, изолиния `φ = φ_top − 0.04·Δφ`),
   пиксель переключается на вертикальную ветку: смаз движения заменяется диском радиуса
   `verticalSampleRadius + |v|`, а затем **весь** результат подмешивается к резкой сцене:
   `color = mix(sampleScene(point), color, smoothstep(verticalDistance))`. У внутренней границы
   `verticalTransition → 0`, т.е. `color → sampleScene(point)` — резко. Далее по зоне резкость убывает
   по smoothstep, но полная сила достигается только у внешней кромки.
3. Итог во время движения: по одну сторону изолинии — полный смаз `±|v|`, по другую — резкая сцена.
   Изолиния на экране изогнута линзой (через `Bend X`/`Depth`), отсюда «купол». При настройках
   пользователя зона у центральной колонки ≈ 71 px высотой (4 % от видимого диапазона φ ≈ 1.97 рад при
   `Ry = 480`, `Rz·bendY = 1237`, `f = 1660`), так что купол — это ровно она.
4. В статике купола нет, потому что `verticalSampleRadius ∝ staticEdge → 0` у границы и с обеих сторон
   изолинии картинка резкая. Дефект виден только когда в `color` есть то, чего нет в
   `sampleScene(point)`, — смаз движения.

**Почему так получилось.** Deliveries 28–30 боролись с «дублирующей полосой» наверху, переводя
направленную дисперсию, refraction и смаз движения в диск и добавляя mix; Delivery 31 нашла реальную
причину полосы — `CLAMP_TO_EDGE` за пределами scene‑буфера (поле 80 px), а Delivery 32 её устранила
(прозрачность вне буфера, поле 256 px). Диск и mix остались как обходные пути без причины; mix при
этом гасит смаз движения, которого «обходить» не требовалось. Боковые зоны (`sideOffset`) смаз не
гасят, и на них купола нет — это и подтверждает механизм.

**Сопутствующее (правится тем же планом).** `motionSign` сейчас переворачивает знак по
`dot(direction, motionVelocity) < 0` везде, включая центр (`direction = sideDirection`). При чисто
вертикальном драге в центре `dot ≈ 0` и знак определяется шумом квантованных градиентов поля ⇒ порядок
спектра смаза меняется от пикселя к пикселю (цветной зерновой шум на кромках карточек); при
горизонтальном движении знак меняется на колонке `θ = 0` (шов порядка спектра посреди картинки).
Переворот нужен только там, где направленный статичный `direction·span` может взаимно погаситься с
движением, — в боковых зонах.

## 2. Правка (только `hero-dispersion-post-shader.ts`, фрагментный post‑шейдер)

Принцип: **смаз движения один и тот же во всех ветках** (`motionSmear · spread · 2` в главном цикле,
`· 3` в aura), статичная оптика верхней/нижней зоны остаётся диском, но входит в него с мягким
onset’ом через радиус, а не через подмешивание к резкой сцене. То, что mix делал со статичными
слагаемыми (aura, gate), переносится на их коэффициенты напрямую.

- [x] **2.1. Знак смаза — только против статичного бокового span.** Заменить строки 360–361:

```glsl
  // The smear sign only matters where a directed static span could cancel it:
  // inside side ownership. Centre and top/bottom keep the raw velocity order.
  float motionAlignment = dot(direction, motionVelocity);
  float motionSign = (verticalDominant < 0.5 && staticEdge > 0.0005 &&
    motionAlignment < -0.2 * length(motionVelocity)) ? -1.0 : 1.0;
  vec2 motionSmear = motionVelocity * motionSign;
```

`staticEdge` и `verticalDominant` объявлены выше (строки 349 и 337). Порог `−0.2·|v|` (cos 101.5°):
переворот только при реально антипараллельном движении; около‑перпендикулярные случаи шумовые и не
переворачиваются. В центре (`staticEdge = 0`) и в вертикальной ветке (нет направленного статичного
слагаемого) знак всегда `+1` ⇒ смаз непрерывен через внутреннюю границу верхней/нижней зоны.

- [x] **2.2. Onset и коэффициент зоны.** Заменить строки 437–441 (комментарий + четыре объявления):

```glsl
  // Vertical lens treatment: static optics enter an isotropic disk whose radius
  // ramps in with the zone onset; drag/row motion stays the same directed smear
  // as the centre so the zone is never sharper than its surroundings.
  float verticalTransition = smoothstep(0.0, 1.0, verticalDistance);
  float verticalOnset = verticalTransition * verticalTransition;
  float zoneGain = mix(1.0, verticalTransition, verticalDominant);
  float verticalDispersionSpan = dispersionExtent;
  float verticalSampleRadius = (verticalDispersionSpan + verticalExtent) * verticalOnset;
```

`verticalMotionRadius` удалить. `verticalOnset = t²` приближает прежнюю статичную картину (раньше радиус
× `t` и затем цвет × `t`); `zoneGain` — ровно тот множитель, который mix применял к aura и gate.
Блок турбулентности (`span *= modulation; verticalDispersionSpan *= modulation;
verticalSampleRadius *= modulation;`) не менять.

- [x] **2.3. Refraction в вертикальной ветке** (строка 473): `verticalSampleRadius += gateRefractionRadius * verticalTransition;` → `verticalSampleRadius += gateRefractionRadius * verticalOnset;`. Боковая ветка (`point += direction * gateRefractionRadius;`) без изменений.

- [x] **2.4. Главный цикл** (строки 495–504) — `sideOffset` не трогать, `verticalOffset` заменить:

```glsl
      vec2 sideOffset = direction * span * spread + motionSmear * spread * 2.0 +
        perpendicular * ((jitterY * 2.0 - 1.0) * verticalExtent);
      vec2 verticalOffset = motionSmear * spread * 2.0 + diskSampleOffset(
          direction,
          perpendicular,
          jitterX,
          jitterY,
          verticalSampleRadius
        );
      vec2 offset = verticalDominant > 0.5 ? verticalOffset : sideOffset;
```

`sampleValidity`/`verticalSceneValidity` и ранний выход `activeSampleSpan < 0.5 && length(motionVelocity) < 1.5` — без изменений.

- [x] **2.5. Aura** (строки 519 и 535–545):

```glsl
    float auraGain = uAura * staticEdge * min(haloSwing, 1.6) * zoneGain;
    ...
        float verticalAuraRadius = (
          verticalDispersionSpan * 2.6 + verticalExtent * 2.5 + 12.0
        ) * verticalOnset * haloSwing;
        vec2 verticalAuraOffset = motionSmear * spread * 3.0 + diskSampleOffset(
            direction,
            perpendicular,
            jitterX,
            jitterY,
            verticalAuraRadius
          ) + perpendicular * haloWave * 34.0;
```

`verticalAuraMotionRadius` удалить; `sideAuraOffset` и `auraSampleValidity` без изменений.

- [x] **2.6. Gate glow** (строка 568): `float gateGain = uGateGlow * band * zoneGain;`. Остальной блок gate без изменений (в боковых зонах `zoneGain = 1`).

- [x] **2.7. Удалить композит** — строки 587–588 (`verticalTreatmentMix` и `color = mix(sampleScene(point), color, verticalTreatmentMix);`) удалить целиком. Следующие строки (`outsideAuthoredContent` … `gl_FragColor`) не менять.

**Почему это эквивалентно по статике и чинит движение.** Старый mix `mix(S, C, t)` гасил три вещи в
`C`: (а) статичный диск — теперь его радиус `R·t²` вместо `R·t` + цвет `×t`; (б) aura и gate — теперь
`×t` через `zoneGain` напрямую (то же самое); (в) смаз движения — больше не гасится, это и есть
исправление. У внутренней границы (`verticalDistance → 0`): радиус → 0, `zoneGain → 0`, `auraGain → 0`
(∝ `staticEdge`), `verticalOffset → motionSmear·spread·2` = точно `sideOffset` центра при `span = 0`.
У внешней кромки (`verticalDistance = 1`) результат совпадает с прежним (там `t = 1`). Дополнительных
выборок нет; одна выборка `sampleScene(point)` из mix исчезает.

**Не делать:** не возвращать `verticalMotionRadius`; не гейтить смаз движения статичной зоной; не менять
`sideOffset`/`sideAuraOffset`, оценщик скорости (`hero-sphere-gallery-motion.ts`), поле scene‑буфера,
число выборок, проходы, uniform’ы, протокол.

## 3. Целевое поведение

- **M1** — при вертикальном драге вниз и вверх верхняя и нижняя зоны размыты не слабее центра; на
  внутренней границе зоны нет ни резкого купола, ни видимой линии; картина симметрична верх/низ.
- **M2** — статика (`speed = 0` у всех рядов, без пана): вне верхней/нижней зон snapshot побайтно
  совпадает с состоянием до правки; внутри зон — мягкий подъём размытия от границы к кромке без линии;
  у самой кромки картина прежняя.
- **M3** — боковые зоны: статика без изменений; при горизонтальном драге к центру внутри боковой зоны
  нет резкой изолинии (переворот знака сохранён там, где он нужен).
- **M4** — при чисто вертикальном драге в центре нет цветного зернового шума на кромках карточек; при
  горизонтальном движении нет шва порядка спектра на колонке `θ = 0`.
- **M5** — Rows, протокол v14, uniform’ы, проходы `scene→field→post`, число выборок — без изменений.

## 4. Файлы

**Сайт (`recraft-v4-styles/src/components/pages/home/`):**

- [x] `hero-dispersion-post-shader.ts` — §2 (2.1–2.7); обновить комментарий над блоком (2.2).
- [x] `hero-dispersion-post-shader.test.ts` — контрактные тесты сверяют текст шейдера, их надо
      переписать (сначала RED, затем GREEN):
  - `'post shader aligns directed motion smear and stabilizes turbulence drift'` → переименовать в
    `'post shader flips the directed smear only against a side static span and clamps drift'`;
    регекс `motionSign` заменить на
    `/float motionAlignment = dot\(direction, motionVelocity\);/` и
    `/float motionSign = \(verticalDominant < 0\.5 && staticEdge > 0\.0005 &&\s*motionAlignment < -0\.2 \* length\(motionVelocity\)\) \? -1\.0 : 1\.0;/`;
    остальные проверки (`motionSmear`, `· 2.0`, `· 3.0`, `drift`) оставить.
  - `'top and bottom composite 2D dispersion through a soft boundary without changing side offsets'`
    → `'top and bottom ramp static optics through a soft onset without a sharp-scene composite'`:
    оставить `verticalDominant`, `diskSampleOffset(`, `verticalTransition`, `sideOffset`, `offset =`,
    `auraOffset =` и `doesNotMatch(/verticalOffset\s*=\s*direction \* (?:span|verticalDispersionSpan)/)`;
    заменить регекс радиуса на
    `/float verticalSampleRadius = \(verticalDispersionSpan \+ verticalExtent\) \* verticalOnset;/`;
    добавить `match` на `/float verticalOnset = verticalTransition \* verticalTransition;/`,
    `/float zoneGain = mix\(1\.0, verticalTransition, verticalDominant\);/`,
    `/float auraGain = uAura \* staticEdge \* min\(haloSwing, 1\.6\) \* zoneGain;/`,
    `/float gateGain = uGateGlow \* band \* zoneGain;/`; две последние проверки
    (`verticalTreatmentMix`, `color = mix(sampleScene(point), color, …)`) заменить на
    `doesNotMatch(/verticalTreatmentMix/)` и `doesNotMatch(/color = mix\(sampleScene\(point\), color/)`.
  - `'top and bottom drag motion stays radial while side drag motion stays directed'` → заменить на:

    ```ts
    test('top and bottom drag motion stays directed and continuous with the centre', () => {
      assert.doesNotMatch(HERO_DISPERSION_POST_FRAGMENT_SHADER, /verticalMotionRadius/);
      assert.doesNotMatch(HERO_DISPERSION_POST_FRAGMENT_SHADER, /verticalAuraMotionRadius/);
      assert.match(
        HERO_DISPERSION_POST_FRAGMENT_SHADER,
        /vec2 sideOffset = direction \* span \* spread \+ motionSmear \* spread \* 2\.0/,
      );
      assert.match(
        HERO_DISPERSION_POST_FRAGMENT_SHADER,
        /vec2 verticalOffset = motionSmear \* spread \* 2\.0 \+ diskSampleOffset\(\s*direction,\s*perpendicular,\s*jitterX,\s*jitterY,\s*verticalSampleRadius\s*\);/,
      );
      assert.match(
        HERO_DISPERSION_POST_FRAGMENT_SHADER,
        /float verticalAuraRadius = \(\s*verticalDispersionSpan \* 2\.6 \+ verticalExtent \* 2\.5 \+ 12\.0\s*\) \* verticalOnset \* haloSwing;/,
      );
      assert.match(
        HERO_DISPERSION_POST_FRAGMENT_SHADER,
        /vec2 verticalAuraOffset = motionSmear \* spread \* 3\.0 \+ diskSampleOffset\(\s*direction,\s*perpendicular,\s*jitterX,\s*jitterY,\s*verticalAuraRadius\s*\) \+ perpendicular \* haloWave \* 34\.0;/,
      );
    });
    ```

  - `'top and bottom ignore vertically out-of-scene taps without changing side motion'` — удалить
    последнюю проверку `/verticalSampleRadius \+ verticalMotionRadius/`; остальное оставить.
  - `'top and bottom boundary refraction stays radial while side refraction stays directed'` —
    `/verticalSampleRadius \+= gateRefractionRadius \* verticalTransition;/` →
    `/verticalSampleRadius \+= gateRefractionRadius \* verticalOnset;/`; остальное оставить.
  - Остальные тесты файла (кодек поля, последовательность проходов, прозрачность вне буфера, ранний
    выход, warp‑wave, lens‑зоны, Fast Refresh, v14, `fieldAt`) должны остаться зелёными без правок.
- [x] `hero-sphere-gallery-passes.ts`, `hero-sphere-gallery-webgl.ts`, `hero-sphere-gallery-motion.ts`,
      `hero-sphere-gallery.tsx`, `hero-preview-boundary.tsx` — без изменений.

**Toolcraft (`recraft-tools/hero/`):** схема, протокол, контролы, e2e — без изменений.
`docs/toolcraft/agent-worklog.md` — запись Delivery 33 (website‑only, Tier 2) с обязательным пунктом
«Correction to prior diagnosis»: Delivery 32 чинила только боковой/центральный путь; купол давали
изотропный диск (Delivery 30) и полнозонный композит (Delivery 28) вертикальной ветки, введённые
против полосы, настоящая причина которой (`CLAMP_TO_EDGE`) устранена в Deliveries 31–32. Записать
решение §2, неизменность v14/проходов/выборок, фактически выполненные проверки §5 и риски §7.

## 5. Проверки

- [x] Сайт: `pnpm dlx tsx --test src/components/pages/home/hero-dispersion-post-shader.test.ts src/components/pages/home/hero-sphere-gallery-motion.test.ts src/components/pages/home/hero-sphere-gallery-lifecycle.test.ts src/components/pages/home/hero-sphere-layout-phase.test.ts src/components/pages/home/hero-sphere-layout-visibility.test.ts`
      (RED на новых контрактах до правки шейдера, GREEN после); `pnpm exec oxfmt` на двух файлах;
      `pnpm lint`; `pnpm build`; `git diff --check`. `pnpm typecheck` и `pnpm format` по‑прежнему
      блокированы pre‑existing находками вне доставки — зафиксировать, не «чинить» попутно.
- [ ] Ручные (Toolcraft → Sphere, импорт `herosettings 3.json`, сервера как в Delivery 32):
  - (а) длинный реальный драг вниз, затем вверх, по ≥ 4 кадра с зажатым указателем: верхняя зона
    размыта как центр, купола/линии на внутренней границе нет, низ симметричен (M1);
  - (б) статика при `speed = 0` у всех рядов и без пана: snapshot до/после — вне верхней/нижней зон
    побайтно совпадает, внутри — мягкий подъём без линии (M2); вернуть скорости рядов;
  - (в) горизонтальный драг к центру и от центра: в боковых зонах нет резкой изолинии, статика боковых
    зон не изменилась (M3);
  - (г) медленный чисто вертикальный драг: на кромках карточек в центре нет цветного зерна; при
    автодвижении рядов (`speed 14.5`) нет шва на центральной колонке (M4);
  - (д) `Top and bottom = 0` — картина в точности как до правки (вертикальная ветка не активна);
    `Top and bottom = 20` — купол отсутствует и при широкой зоне; вернуть `4`;
  - (е) Rows — без изменений; Apply → standalone совпадает с iframe (M5).
- [x] Toolcraft browser: `e2e/product-gallery-effect.spec.ts` — кейсы
      `browser: lens top-bottom bands change Sphere pixels` и
      `browser: dispersion.velocity changes the embedded hero output` (запускать напрямую, как в
      Delivery 32, если `test:feature` снова не собирает discovery).

## 6. Verification note

```md
Verification tier: Tier 2
Reason: Website-only correction of the Sphere post pass vertical-zone kernel; no schema, protocol, runtime, pass, or workload-dimension change.
Run: focused tsx tests for post-shader/motion/lifecycle/layout; website oxfmt on touched files, lint, build, git diff --check; the two product-gallery-effect browser cases; manual checks §5 on herosettings 3.json.
Skip: verify:delivery; verify:perf; export matrices; typecheck/format (pre-existing blockers, record them).
```

## 7. Риски и что сознательно не делаем

- Статичная картина верхней/нижней зоны в середине зоны станет чуть иной: вместо «резкое + полупрозрачный
  размытый слой» — равномерное размытие меньшего радиуса (`R·t²`). У границы и у кромки — как раньше.
  Если пользователь сочтёт середину зоны слабее/сильнее, крутить только `verticalOnset`
  (`t²` ↔ `t`), а не возвращать mix.
- Швы порядка спектра смаза: при драге к центру по горизонтали знак переворачивается на внутренней
  границе боковой зоны (раньше — на колонке `θ = 0`); это смена красный↔синий на кромках, не резкость.
  Полностью убрать можно только независимым `spread` для движения (ахроматичный смаз) — отдельное
  решение, без запроса не делать.
- Жёсткий tie‑break `sideDistance ≥ verticalDistance` в углах остаётся (линейное ядро ↔ диск); это
  существующий шов, не предмет этой доставки.
- Верхняя/нижняя зона остаётся изотропным диском (ахроматичное зерно, а не направленная «радужная»
  дисперсия как на боках). Теперь, когда причина полосы (`CLAMP_TO_EDGE`) устранена, направленную
  дисперсию наверх можно вернуть тем же кодом, что на боках (форма из плана Delivery 28,
  `2026-08-22-hero-top-bottom-2d-blur.md`, + onset для gate refraction в узкой зоне). Это отдельный
  план — только по запросу пользователя.
