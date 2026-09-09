# Hero Gallery — скачок карусели после авто-прыжка: убрать горизонтальный wrap авто-смещения (план правок)

> **For agentic workers:** план рассчитан на выполнение по задачам (checkbox `- [ ]`) с
> `superpowers:subagent-driven-development` или `superpowers:executing-plans`. Preflight из
> `AGENTS.md` → `docs/toolcraft/workflow.md` обязателен. Этот файл — единственный документ доставки.
>
> **Контекст.** После завершения авто-прыжка (Delivery 36) иногда происходит резкий горизонтальный
> скачок контента карусели между соседними кадрами; бывает сериями («после первого раза может
> подряд несколько раз»), затем надолго исчезает. Причина найдена (переписка 2026‑08‑24, два
> соседних кадра записи). **Correction to prior diagnosis:** план Delivery 36 утверждал, что
> «+2 к `pan.x` — тот же контент (ряды замкнуты по окружности)» — это неверно: замкнута только
> линза, а тайлинг карточек — бесконечная лента с собственным периодом; исполнитель реализовал
> wrap по плану, ошибка — в плане. Правка — только сайт (`recraft-v4-styles`), протокол, схема,
> контролы не меняются. Номер записи worklog — следующий свободный (сейчас 42, перепроверить).
> Режим проверки — уточнить; по умолчанию §6. Коммиты — только по явной просьбе.

---

## 1. Диагноз (по текущему коду)

1. При завершении прыжка `advanceHeroAutoScrollGlide` (`hero-sphere-gallery-motion.ts`)
   заворачивает накопленное смещение в `[0, 2)` **по обеим осям** через
   `wrapHeroAutoScrollOffset`.
2. По вертикали wrap бесшовный: 2 pan‑единицы = ровно вертикальный период панели `V = n·pitch`.
3. По горизонтали — нет. Сдвиг `pan.x` на 2 — это `Θ0 ± 2π`. Линза 2π‑периодична, но
   `layoutHeroSphereGallery` тайлит ряд с периодом `period_row = Σ(ширина_карточки + gap)` px и
   перечисляет копии в u‑окне `[(−π−Θ0)·rx, (π−Θ0)·rx]`: после скачка Θ0 на ±2π в ту же точку
   экрана попадает копия, сдвинутая на `±(2π·rx mod period_row)` px — при текущих настройках
   (rx 680 ⇒ 2π·rx ≈ 4273 px, периоды рядов ~1400–1800 px) это мгновенный сдвиг на ~600–1100 px,
   **у каждого ряда свой**.
4. Смаз скачок не маскирует: оценщик скорости пана берёт кратчайшую периодическую дельту
   (`getHeroPeriodicPanDelta`), wrap для него невидим — телепорт резкий, ровно как на кадрах.
5. Прерывистость и серии: `offset.x` — случайное блуждание по ±0.1–0.45 за прыжок; скачок
   случается только на пересечении границы 0/2, а сразу после wrap смещение оказывается возле
   границы — следующие прыжки легко пересекают её снова; потом блуждание уходит — тихо.

## 2. Правка (сайт, `recraft-v4-styles/src/components/pages/home/`)

- [x] **2.1. `hero-sphere-gallery-motion.ts`** — в завершении глайда внутри
      `advanceHeroAutoScrollGlide` заворачивать только вертикаль:

      ```ts
      const wrapped = {
        x: state.target.x,
        y: wrapHeroAutoScrollOffset(state.target.y),
      };
      ```

      `wrapHeroAutoScrollOffset` остаётся (используется для `y`). Больше ничего в автомате не
      менять: `beginHeroAutoScrollGlide` строит `target.x = offset.x ± амплитуда` от
      неограниченного значения корректно, `currentRow` считается от `offset.y` (по-прежнему
      в [0, 2)). `getHeroPeriodicPanDelta` оставить как есть: покадровые дельты глайда ≤ ~0.1
      pan‑единицы, кратчайшая дельта для них тождественна, а для шва wrap по `y` она по-прежнему
      нужна.
- [x] **2.2. Убедиться, что ничто не полагается на `offset.x ∈ [0, 2)`:** grep по
      `autoScrollOffset`/`autoScroll.offset` — рендерер (`effectivePan`), атрибут
      `data-hero-gallery-auto-scroll` (`toFixed(4)`), сброс при выключении
      (`createHeroAutoScrollState` ⇒ `{0, 0}`) — всё совместимо с неограниченным `x`; зафиксировать
      результат grep в worklog.
- [x] **2.3. Точность (обоснование в worklog, без кода):** блуждание растёт как `0.3·√N` —
      после 10⁴ прыжков `|x| ≈ 30` (Θ0 ≈ 100 рад). CPU‑математика — float64; в шейдер θ уходит
      по-карточно через `uThetaCenter` (float32): относительная точность 2⁻²³ при |θ| ~ 100 даёт
      ошибку ~10⁻⁵ рад ≈ субпиксель. Ограничение не требуется; если когда-нибудь захочется
      ограниченного смещения — компенсация фазой ряда `∓(2π·rx mod period_row)` в момент wrap,
      отдельной доставкой (§7).

## 3. Тесты

- [x] **3.1. `hero-sphere-gallery-motion.test.ts`** (RED → GREEN):
      - тест `'auto-scroll completion wraps both coordinates and zero delta leaves state
        unchanged'` переписать: завершение **сохраняет `x` как есть** (кейсы `target.x = 2.3 ⇒
        offset.x = 2.3`; `target.x = −0.4 ⇒ −0.4`) и заворачивает только `y` в `[0, 2)`;
        zero‑delta часть оставить;
      - тест `'periodic pan deltas stay continuous across x and y wraps in both directions'` —
        оставить (хелпер не меняется);
      - новый тест‑доказательство причины: `layoutHeroSphereGallery` на маленькой фикстуре
        (1 ряд, 2 источника с разными аспектами, ненулевой gap) при `pan.x` и `pan.x + 2` даёт
        **разные** экранные раскладки (карточка у центра экрана имеет другой `sourceIndex` или
        `centerX` сдвинут больше допуска), а при `pan.x + ε` — непрерывно близкие; в комментарии
        зафиксировать: поэтому горизонтальный wrap авто-смещения запрещён.
- [x] **3.2. Существующие контракты** (`hero-dispersion-post-shader.test.ts`,
      lifecycle, layout, e2e `browser: auto scroll…` в `product-gallery-pan.spec.ts`, включая
      сброс `0.0000:0.0000` при выключении свитча) должны остаться зелёными без правок.

## 4. Целевое поведение

- **M1** — ни один авто-прыжок не даёт мгновенного смещения контента: смена кадров у карусели
  всегда непрерывна (кроме самого глайда с его смазом); серии скачков возле бывшей границы
  исчезают полностью.
- **M2** — вертикальное поведение не изменилось (wrap по `y` остаётся бесшовным по построению);
  выбор целевого ряда, длительность, easing, паузы (драг/reduced motion/visibility/snapshot) —
  как были.
- **M3** — выключение свитча по-прежнему мгновенно возвращает `0.0000:0.0000`; Undo/драг/Reset без
  изменений; Rows-режим не затронут.

## 5. Проверки

- [x] Сайт: `pnpm dlx tsx --test src/components/pages/home/hero-sphere-gallery-motion.test.ts src/components/pages/home/hero-dispersion-post-shader.test.ts src/components/pages/home/hero-sphere-gallery-lifecycle.test.ts src/components/pages/home/hero-sphere-layout-phase.test.ts src/components/pages/home/hero-sphere-layout-visibility.test.ts`
      (сначала RED на переписанном wrap‑тесте и новом тесте причины); focused `oxfmt`;
      `pnpm lint`; `pnpm build`; `git diff --check`.
- [x] Toolcraft browser: `browser: auto scroll jumps the Sphere to another spot` и
      `browser: dispersion.velocity changes the embedded hero output` — зелёные без правок.
- [x] Ручные (настройки пользователя, свитч авто-скролла вкл): Interval 1, Jump time 0.3 — дать
      машине прыгать 3–5 минут (сотни прыжков, блуждание многократно пройдёт бывшую границу):
      ни одного покадрового телепорта карусели; затем Interval 5 — обычный ритм, то же; драг во
      время прыжка и после — без скачков; выключение свитча — мгновенный возврат к authored и
      `0.0000:0.0000`.

## 6. Verification note

```md
Verification tier: Tier 2
Reason: One-line website correction of the auto-scroll completion wrap (vertical only) plus contract updates; no protocol, schema, control, renderer-pass, or Toolcraft change.
Run: focused tsx motion/shader/lifecycle/layout tests (RED→GREEN); oxfmt on touched files; site lint/build; git diff --check; the two existing browser cases; manual long-run jump soak §5.
Skip: verify:delivery; verify:perf; export matrices; site typecheck/format if pre-existing blockers exist (record them).
```

## 7. Риски и что сознательно не делаем

- `offset.x` теперь неограничен — это осознанно: рост — случайное блуждание `~0.3·√N`, точности
  float64/float32 хватает с запасом на любые реальные сессии (§2.3). Жёсткий предел не вводим.
- Вариант «ограниченное смещение + компенсация фазой ряда на `2π·rx mod period_row`» отклонён в
  этой доставке: трогает бухгалтерию фаз/carry у каждого ряда и добавляет новый шов при смене
  состава ряда; вернуться к нему только если неограниченный `x` когда-нибудь помешает.
- Кратчайшая периодическая дельта в оценщике скорости остаётся для шва `y`; для `x` она
  тождественна на реальных покадровых дельтах — поведение смаза не меняется.
