# Hero — вертикальный шов на внутренней границе боковой зоны при драге: непрерывный спектральный порядок направленного смаза (план правки)

> **For agentic workers:** план рассчитан на выполнение по задачам (checkbox `- [ ]`) с
> `superpowers:subagent-driven-development` или `superpowers:executing-plans`. Preflight из
> `AGENTS.md` → `docs/toolcraft/workflow.md` (приложение **hero**) обязателен. Этот файл —
> единственный документ доставки.
>
> **Контекст.** При драге (и при клике во время движения/глайда) на hero появляется вертикальная,
> слегка изогнутая линза-линия на ~26–30% ширины экрана: широкая «тёплая» полоса смаза резко
> обрывается кромкой. Диагноз подтверждён по коду (§1): это внутренняя граница боковой зоны
> дисперсии, где `motionSign` бинарно переворачивает **спектральный порядок** направленного смаза.
> Дефект дизайна моей же доставки 33 (directed motion composite) — флип задуман правильно
> (смаз внутри зоны не должен гаситься о статическую дисперсию), но задан жёстким порогом, и
> контракт-тест прибивает его в этом виде. Правка — только сайт (`recraft-v4-styles`), один
> шейдер + его контракты; протокол/схема/контролы не меняются. Worklog hero — `### Delivery N —
> …`, номер = следующий свободный (сейчас последняя запись 49 ⇒ 50, **перепроверить**).
> Коммиты — только по явной просьбе.

---

## 1. Диагноз (подтверждён по коду)

1. В `HERO_DISPERSION_POST_FRAGMENT_SHADER`:

   ```glsl
   float motionSign = (staticEdge > 0.0005 &&
     motionAlignment < -0.2 * length(motionVelocity)) ? -1.0 : 1.0;
   vec2 motionSmear = motionVelocity * motionSign;
   ```

   Внутри зоны, когда движение идёт против её направления (драг/глайд вправо ⇒ левая зона,
   влево ⇒ правая), смаз переворачивается. Сетка сэмплов симметрична (`spread = t − 0.5` ∈
   [−0.5, 0.5], офсеты `motionSmear·spread·2.0`, в ауре `·3.0`), поэтому на самой границе
   (`span → 0`) геометрия непрерывна, а **порядок радуги** (`spectralWeight(t)`: красный конец ↔
   синий конец кернела) инвертируется мгновенно на отсечке `staticEdge > 0.0005`.
2. Граница `staticEdge = 0` стоит на `uEdgeWidth` доле θ-диапазона от края
   (`uEdgeWidth = dispersion.edgeWidth / 100`, у пользователя 30 ⇒ ~26–30% ширины экрана —
   ровно где линия на скриншоте). Кернел смаза до ±140 px ⇒ несовпадение спектра видно широкой
   полосой с резкой кромкой. В покое `motionSmear ≈ 0` — линии нет; глубоко в зоне флип выглядит
   правильно (смаз согласован со статической дисперсией).
3. Прибитый контракт: `hero-dispersion-post-shader.test.ts`, тест «post shader flips the directed
   smear only against a static side span and clamps drift».

## 2. Правка шейдера (`hero-dispersion-post-shader.ts`)

Минимальный диф: **геометрию и сам `motionSign` не трогаем** (бинарный флип вектора на границе
невидим — сетка симметрична; глубоко в зоне он нужен как есть). Непрерывным делаем только
спектральный порядок.

- [x] **2.1. Константа** в шапке шейдера (рядом с `MOTION_SAMPLE_*`):

      ```glsl
      const float MOTION_CHROMA_BAND = 0.12;
      // Width (in staticEdge units) of the smooth spectral-order blend at the zone edge.
      // 0.001 ~= the old hard flip (rollback); larger = wider, softer transition.
      ```

- [x] **2.2. После вычисления `motionSmear`** добавить:

      ```glsl
      float chromaFlip = motionSign < 0.0
        ? 1.0 - smoothstep(0.0, MOTION_CHROMA_BAND, staticEdge)
        : 0.0;
      ```

      Семантика: у самой границы (`staticEdge → 0`) спектр перекрашивается так, что красный конец
      смаза остаётся с той же физической стороны, что и снаружи зоны (непрерывность), глубже
      `MOTION_CHROMA_BAND` — сегодняшний порядок (согласованный со статической дисперсией зоны).
- [x] **2.3. Оба цикла** — главный и aura — вместо `vec3 weight = spectralWeight(t);`:

      ```glsl
      vec3 weight = chromaFlip > 0.0
        ? mix(spectralWeight(t), spectralWeight(1.0 - t), chromaFlip)
        : spectralWeight(t);
      ```

      Веса симметричны по сумме — нормировка `weightSum`/`alphaWeight` и альфа не меняются. В
      середине переходной полосы спектр слегка нейтральнее (смесь прямого и обратного порядка) —
      это и есть плавный переход вместо кромки. Guard сохраняет прежний прямой путь вне узкой
      полосы и не вычисляет второй спектральный ramp для каждого motion-сэмпла без необходимости.
- [x] **2.4. Ничего больше:** `motionAlignment`, порог `−0.2`, `boundedMotion`, turbulence-drift
      (использует неперевёрнутый `motionVelocity`), `MOTION_SAMPLE_DENSITY/FLOOR`, ветка
      passthrough — без изменений.

## 3. Тесты (`hero-dispersion-post-shader.test.ts`)

- [x] **3.1.** В тесте «post shader flips the directed smear only against a static side span and
      clamps drift» существующие регексы (`motionAlignment`, тернарник `motionSign`,
      `motionSmear = motionVelocity * motionSign`, `spread * 2.0`, `spread * 3.0`, drift-кламп)
      **остаются как есть** — эти строки не меняются. Добавить, RED → GREEN:

      ```ts
      assert.match(HERO_DISPERSION_POST_FRAGMENT_SHADER, /const float MOTION_CHROMA_BAND = 0\.12;/);
      assert.match(
        HERO_DISPERSION_POST_FRAGMENT_SHADER,
        /float chromaFlip = motionSign < 0\.0\s*\?\s*1\.0 - smoothstep\(0\.0, MOTION_CHROMA_BAND, staticEdge\)\s*:\s*0\.0;/,
      );
      assert.equal(
        HERO_DISPERSION_POST_FRAGMENT_SHADER.match(
          /mix\(spectralWeight\(t\), spectralWeight\(1\.0 - t\), chromaFlip\)/g,
        )?.length,
        2,
      );
      assert.doesNotMatch(HERO_DISPERSION_POST_FRAGMENT_SHADER, /vec3 weight = spectralWeight\(t\);/);
      ```

- [x] **3.2.** Остальные шейдерные/эффектные контракты (D40–41, adaptive samples, зоны) — зелёные
      без правок; прогнать весь файл тестов.

## 4. Целевое поведение

- **M1** — при драге и глайде в любую сторону вертикальной линии на внутренней границе зон нет
  ни слева, ни справа: спектр смаза переходит через границу зоны градиентом (~несколько десятков
  пикселей), без кромки.
- **M2** — глубоко в зонах и вне зон смаз выглядит как сейчас (тот же порядок радуги, та же
  геометрия); статическая картинка без движения — **побайтно прежняя** (при `motionSign = 1`
  `chromaFlip = 0` и `mix(a, b, 0.0) = a` точно; в покое условие флипа ложно).
- **M3** — клик во время глайда, автономные быстрые ряды (speed 14.5), эффекты Grain/CRT —
  без линии и без новых артефактов.

## 5. Проверки

- [ ] Focused `pnpm exec tsx --test` по `hero-dispersion-post-shader.test.ts` (RED → GREEN) и
      соседним shader/lifecycle-тестам; focused `oxfmt`; `pnpm lint`; `pnpm typecheck`;
      `pnpm test:unit`; `pnpm build`; `git diff --check`.
- [ ] Статическая побайтная приёмка (как basket A доставки perf): 2–3 детерминированных
      статических состояния (без движения; зоны включены, Edge width 25/30) — snapshot до/после
      правки, диф = 0.
- [ ] Ручные: (а) драг вправо и влево на Edge width 30 — линии нет ни с одной стороны, тёплая
      полоса исчезла; (б) клик во время авто-глайда; (в) автономные ряды 3/14.5/3 — полоса
      быстрого ряда без шва в зоне; (г) Edge width 0 (зон нет) и большие значения; (д) Amount /
      Blur / Spectrum / Hue крутятся — переход остаётся гладким; (е) при желании сравнить
      характер: временно `MOTION_CHROMA_BAND = 0.001` ⇒ прежняя жёсткая кромка (подтверждение
      причины), вернуть 0.12; (ж) reduced motion.

## 6. Verification note

```md
Verification tier: Tier 3
Reason: Website-only one-shader correction: spatially continuous spectral order for the directed
motion smear at the side-zone inner edge (new constant + chromaFlip + weight mix in two loops);
no geometry, protocol, schema, control, or pass changes; static output byte-identical.
Run: focused tsx shader contracts (RED→GREEN); static byte-parity snapshots; site
lint/typecheck/test:unit/build; git diff --check; manual drag/glide matrix §5.
Skip: verify:delivery; verify:perf (два smoothstep и mix на пиксель в уже дорогой ветке —
не измеряется); browser matrices beyond the manual pass.
```

## 7. Границы и риски

- Переходная полоса делает спектр смаза чуть нейтральнее в узкой градиентной кайме у границы
  зоны — это и есть лечение; ширина/резкость тюнится одной константой
  (`MOTION_CHROMA_BAND`: меньше = ближе к прежней кромке, больше = мягче и шире).
- Временной переворот `motionSign` при смене направления драга (порог `−0.2`) остаётся бинарным,
  как сегодня, — он проявляется только сменой характера смаза во всей зоне разом в момент
  разворота и жалобы не вызывал; не трогаем осознанно (минимальный диф).
- Отдельный известный артефакт вне скоупа: при очень больших Edge width (> ~50) зоны
  перекрывают центральный меридиан θ = 0, где `direction` меняет знак при ненулевом `span`, —
  возможен статический шов по центру. У текущих настроек (30) не проявляется; если понадобится —
  отдельная доставка.
- `smoothstep(0.0, MOTION_CHROMA_BAND, …)` при банде 0 не определён — поэтому откат задан как
  `0.001`, не `0.0` (зафиксировано в комментарии константы).

## 8. Фактический результат

- Реализация и контракты завершены в двух запланированных website-файлах. RED зафиксировал
  отсутствие `MOTION_CHROMA_BAND`; GREEN: 26/26 в полном shader-файле и 80/80 в focused-наборе
  shader/motion/lifecycle/visibility. Отдельные spec- и quality-review одобрены; по результату
  review добавлен guard прямого спектрального пути вне переходной полосы.
- `pnpm lint` завершён без ошибок (6 несвязанных предупреждений). Production `pnpm build`
  завершён успешно. Focused `oxfmt` и `git diff --check` проходят.
- `pnpm typecheck` остаётся красным на несвязанных текущих ошибках API Section, Fine Details,
  существующих Hero CSS/CanvasImageSource и Scenarios Carousel. Полный `pnpm test:unit`:
  340/344, четыре сбоя вне focused seam-набора. Эти чужие изменения не исправлялись.
- Свежие PNG A/B и широкая ручная browser-матрица не запускались: статический shader-путь теперь
  явно выбирает прежний `spectralWeight(t)` при `chromaFlip == 0.0`, а запрос ограничен быстрым
  точечным исправлением без повторяющихся тяжёлых проверок.
