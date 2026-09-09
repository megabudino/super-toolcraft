# Hero Gallery — filmic grain и CRT на время движения: два настраиваемых эффекта поверх моушн-блюра (план реализации)

> **For agentic workers:** план рассчитан на выполнение по задачам (checkbox `- [ ]`) с
> `superpowers:subagent-driven-development` или `superpowers:executing-plans`. Preflight из
> `AGENTS.md` → `docs/toolcraft/workflow.md` обязателен (маршруты «Schema, controls…»,
> «Renderer, canvas output…»; Plan-фаза до правок, Implementation перед кодом, Verification перед
> пруфом). Этот файл — единственный документ доставки.
>
> **Контекст.** Пользователь: «на время скролла добавим два эффекта, которые можно включить и
> настроить: filmic grain и CRT; только на время драга или перемещения; накладывание на текущий
> моушн-блюр». По коду (сверено 2026-08-24): у Sphere-галереи уже есть оффскрин-пайплайн
> `scene → field → post` (`hero-sphere-gallery-passes.ts`, `HERO_SPHERE_PASS_SEQUENCE`), и
> моушн-блюр — это фуллскрин пост-пасс `HERO_DISPERSION_POST_FRAGMENT_SHADER` с
> `uPanRate`/`uFrameDt`/`uBlur`/`uRowRates`/`uSamples`, сэмплирующий `sceneTarget`. Значит оба
> эффекта встраиваются в **тот же пост-фрагмент после блюр-выборки** — буквально «поверх
> текущего моушн-блюра», без нового пасса и фреймбуфера.
>
> **Обе стороны.** Toolcraft-инструмент `recraft-tools/hero` (две новые секции контролов,
> values, acceptance) → протокол настроек **v18 ⇒ v19** (сверить оба конца; формат settings
> расширяется двумя блоками) → сайт `recraft-v4-styles` (нормализатор, юниформы, шейдер,
> гейтинг движения). Номер записи worklog — следующий свободный (сейчас предположительно **39**,
> но он может быть занят доставкой «upload activates row» — перепроверить оба). Режим проверки —
> уточнить; по умолчанию §6. Коммиты — только по явной просьбе пользователя.

---

## 1. Модель: эффекты живут только в движении

1. **Один энвелоп движения на оба эффекта.** В `hero-sphere-gallery-webgl.ts` уже есть
   сглаженный `panMotion` (`stepHeroAngularMotionState`, `motionSmoothing 0.3`) — драг пада,
   драг по холсту, инерция и auto-scroll glide все проходят через `panRate`. Новый
   `effectsEnvelope ∈ [0,1]`: `smoothstep(ENVELOPE_V0, ENVELOPE_V1, |panRate|)`, дополнительно
   сглаженный во времени тем же паттерном (плавный attack ~120 мс / decay ~250 мс — константы),
   чтобы зерно и CRT **проявлялись и гасли**, а не мигали. Постоянное вращение рядов
   (`rows[].speed`, `uRowRates`) энвелоп **не** поднимает — «перемещение» = пан, как просил
   пользователь. `reducedMotion` (уже приходит в `drawPost`) форсит энвелоп в 0.
2. **Ноль цены в покое.** В шейдер эффекты входят предмноженными на энвелоп
   (`uGrain = amount·envelope`, `uCrt = …·envelope`); при 0 ветка `if` пропускает весь код
   (константный бранч по юниформе), CPU не делает ничего нового. Выключенные свитчи ⇒ юниформы 0
   всегда ⇒ пиксельный выход байт-в-байт как сейчас (идентичность для регрессий и снапшотов).
3. **Порядок в фрагменте:** существующая блюр-цепочка → (CRT chroma внутри неё, §2.2) →
   scanline/маска/flicker (CRT) → filmic grain → существующие edge/aura ступени как есть.

## 2. Дизайн эффектов (шейдер)

### 2.1 Filmic grain

Процедурное анимированное зерно, модулирующее итоговый цвет после блюра (сэмплинга сцены не
требует): `n = hash(floor(fragCoord / grainSize), floor(uEffectTime · GRAIN_FPS 24))`,
центрированный (`n − 0.5`), с luma-взвешиванием (сильнее в средних тонах — «filmic»):
`color.rgb += uGrain · (n − 0.5) · GRAIN_LUMA_CURVE(luma)`. Монохромное зерно (одно значение на
все каналы). Новый аккумулируемый `uEffectTime` (wrap по 1000 с) — из существующего `frameDt` в
`drawPost`; зерно «кипит» на 24 кадра/с независимо от FPS.

### 2.2 CRT

- **Chroma shift (RGB-расщепление):** внутри существующей блюр-петли каждый сэмпл берёт каналы
  раздельно: `r = scene(uv + chromaDir·uCrtChroma)`, `g = scene(uv)`,
  `b = scene(uv − chromaDir·uCrtChroma)` (`chromaDir` — горизонталь; ×3 texture fetch на сэмпл
  **только** в ветке `uCrt > 0`, else-путь сохраняет текущий одиночный fetch байт-в-байт).
  Так хрома автоматически «наложена на моушн-блюр» — размазана той же цепочкой.
- **Scanlines:** мультипликативные горизонтальные линии
  `1 − uCrtScanlines·envelopeLine(fract(fragCoord.y / uCrtPitch))` (мягкий синус-профиль, без
  алиасинга на ретине — pitch в CSS-px, множится на DPR из `uBackingSize/uScreenSize`).
- **Aperture-маска:** лёгкая вертикальная RGB-триада с тем же pitch по X (доля от scanlines,
  константа MASK_SHARE 0.5 — отдельный контрол не нужен).
- **Flicker:** глобальная модуляция яркости `1 − uCrtFlicker·FLICKER_DEPTH·(0.5+0.5·sin(2π·f·t))`,
  f ≈ 11 Гц от `uEffectTime` — едва заметное «дыхание трубки».

## 3. Контролы (инструмент) и настройки (сайт)

Две новые секции после «Dispersion & Aura» / «Boundary Aura», гейт `gallery.type == "sphere"`
(прецедент: Lens, Row Images), паттерн-хелпер из `hero-dispersion-control-sections.ts`:

**Секция `motion-grain` — «Motion Grain»** (3 контрола, semanticGroup `grain`):

| Контрол | Target | Диапазон | Дефолт |
|---|---|---|---|
| Grain (switch) | `effects.grain.enabled` | — | false |
| Amount | `effects.grain.amount` | 0–100 % /1 | 45 |
| Size | `effects.grain.size` | 1–8 px /0.5 | 2.5 |

**Секция `motion-crt` — «CRT»** (5 контролов, semanticGroup `crt`):

| Контрол | Target | Диапазон | Дефолт |
|---|---|---|---|
| CRT (switch) | `effects.crt.enabled` | — | false |
| Scanlines | `effects.crt.scanlines` | 0–100 % /1 | 55 |
| Line pitch | `effects.crt.pitch` | 2–16 px /1 | 4 |
| Chroma shift | `effects.crt.chroma` | 0–8 px /0.25 | 1.5 |
| Flicker | `effects.crt.flicker` | 0–100 % /1 | 20 |

Amount/Scanlines и т.д. активны при включённом свитче своей секции (conditional на
`effects.*.enabled`, селектор в той же секции — валидатор зависимостей доволен). Описания
проговаривают правило: «виден только во время драга/пана, плавно гаснет в покое, ложится поверх
моушн-блюра». `performanceRole: "responsiveness"` (юниформы того же пасса; workload не растёт).
Дефолт обоих свитчей **false** — существующие сцены/снапшоты байт-в-байт.

**Сайт (`hero-scene-settings.ts`):** `HeroSceneSettings.effects = { grain: { enabled, amount,
size }, crt: { enabled, scanlines, pitch, chroma, flicker } }` + numericBounds
(`grainAmount [0,1]`, `grainSize [1,8]`, `crtScanlines [0,1]`, `crtPitch [2,16]`,
`crtChroma [0,8]`, `crtFlicker [0,1]`) + дефолты и нормализация по паттерну dispersion; старые
JSON без блока ⇒ дефолты (выключено).

## 4. Задачи

- [ ] **Preflight** обеих сторон (`AGENTS.md` инструмента и сайта, workflow-маршруты; перечитать
      `hero-sphere-gallery-passes.ts`, `hero-dispersion-post-shader.ts`,
      `hero-sphere-gallery-webgl.ts`, `hero-dispersion-control-sections.ts`,
      `hero-scene-settings.ts`, протокол v18 на обоих концах).
- [ ] **Инструмент:** `hero-effects-values.ts` (targets/defaults/reader по паттерну
      gallery-values) + `hero-effects-control-sections.ts` (две секции §3) + подключение в
      `app-schema.ts`; протокол `HERO_PREVIEW_PROTOCOL_VERSION = 19` + сериализация блока
      `effects` в settings message; acceptance-инвентарь (две сущности: «Motion grain»,
      «CRT overlay») и строки контролов; persistence-строка расширяется одним grain- и одним
      crt-таргетом.
- [ ] **Сайт, настройки:** нормализатор + bounds + дефолты + тест
      (`hero-scene-settings.test.ts`) на кламп/фолбэк/старый JSON; приёмник протокола v19
      (сверить константу на обоих концах — расхождение уже валит handshake-тест).
- [ ] **Сайт, энвелоп:** в `hero-sphere-gallery-webgl.ts` — `effectsEnvelope` из `panMotion`
      (`smoothstep` + attack/decay константы), аккумулируемый `effectTime`; `reducedMotion ⇒ 0`;
      прокинуть в `drawPost` (`envelope`, `effectTime`).
- [ ] **Сайт, пост-пасс:** юниформы `uGrain`, `uGrainSize`, `uCrt` (предмноженный максимум CRT),
      `uCrtScanlines`, `uCrtPitch`, `uCrtChroma`, `uCrtFlicker`, `uEffectTime` в
      `hero-sphere-gallery-passes.ts` (locations + uniform1f в `drawPost`, предмножение на
      envelope на CPU) + шейдерные ветки §2 в `HERO_DISPERSION_POST_FRAGMENT_SHADER`
      (после блюр-петли; chroma внутри петли за веткой `uCrt > 0`).
- [ ] **Worklog Delivery N** (следующий свободный, перепроверить): запрос дословно, решения —
      один энвелоп движения от пана (не от rows speed), эффекты в существующем пост-пассе (без
      нового фреймбуфера/пасса), chroma внутри блюр-петли (ветка, else-путь нетронут), оба
      свитча off по умолчанию; отклонённые альтернативы — второй фуллскрин-пасс с новым
      RenderTarget (лишний пасс и аллокация ради того, что делается ветками в текущем),
      CSS/DOM-оверлей зерна (не ляжет под edge/aura ступени и не совпадёт со снапшот-протоколом),
      постоянные эффекты с ручным «only while moving» тумблером (пользователь просил только в
      движении), привязка к rows-вращению (это не драг).

## 5. Тесты

- [ ] **Инструмент:** values-reader (клампы/фолбэки/розница %→доли); schema/acceptance
      мета-сьюты; protocol handshake v19; quiet-run e2e: включить Grain+CRT, драгнуть пад — во
      время глайда снапшоты grain-on/off различаются, после остановки (энвелоп угас) совпадают
      со снапшотом эффекты-off; выключенные свитчи ⇒ хэши идентичны базовым.
- [ ] **Сайт:** normalizer bounds/legacy-JSON; юнит энвелопа (0 в покое, 0 при reducedMotion,
      монотонный по |panRate|, плавный decay); шейдер-компиляция с новыми юниформами
      (паттерн `hero-dispersion-post-shader.test.ts`); существующие 64/64 сцены-сьюты зелёные.
- [ ] **Ручная проверка (dev):** драг пада и холста — зерно «кипит», сканлайны/хрома читаются
      поверх смаза и плавно гаснут за ~¼ с после отпускания; auto-scroll jump тоже зажигает;
      покой — чисто; reduced motion — чисто; Apply — блок `effects` уезжает в
      `hero-applied-settings.json`, standalone-страница читает его.

## 6. Верификация

`pnpm ai:check` инструмента; фокусные vitest обеих сторон (§5); quiet-run e2e кейс; ручная
матрица §5; без аггрегатных гейтов и measured performance (эффекты — ветвящиеся юниформы того же
пасса; худший случай ×3 texture fetch в блюр-петле только при включённом CRT и активном драге —
записать как performance-risk строку, не как workload dimension).

## 7. Риски

- **×3 fetch в блюр-петле при CRT:** только в драге и только при включённом свитче; если на
  слабом GPU дёргается — санкционированный твик: халвинг `uSamples` при `uCrt > 0` (константа),
  не отдельный пасс.
- **Ретина/DPR:** pitch и grain size — в CSS-px, пересчёт через `uBackingSize/uScreenSize`;
  проверить на DPR 1 и 2, чтобы сканлайны не алиасились (синус-профиль, не step).
- **Снапшот-протокол:** снапшот во время глайда теперь зависит от фазы зерна — e2e сравнивает
  хэши только в покое либо grain-on/off в одном кадре (`uEffectTime` детерминирован от
  накопленного frameDt — при снапшоте зафиксировать время).
- **Протокол v19:** бампить синхронно на обоих концах, иначе handshake-тест красный.
- **Константы — вкус:** `ENVELOPE_V0/V1`, attack/decay, `GRAIN_FPS 24`, `GRAIN_LUMA_CURVE`,
  `MASK_SHARE 0.5`, `FLICKER_DEPTH`, f=11 Гц и дефолты секций — именованные константы, один
  тюнинг-проход на живом драге до заморозки в worklog.
