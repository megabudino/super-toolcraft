# Hero — шов на границе зоны всё ещё виден при быстром движении: скоростно-адаптивная ширина спектрального перехода (план-коррекция к Delivery 50)

> **For agentic workers:** план рассчитан на выполнение по задачам (checkbox `- [ ]`) с
> `superpowers:subagent-driven-development` или `superpowers:executing-plans`. Preflight из
> `AGENTS.md` → `docs/toolcraft/workflow.md` (приложение **hero**) обязателен. Этот файл —
> единственный документ доставки.
>
> **Контекст.** Delivery 50 (по плану `2026-08-25-hero-zone-edge-motion-seam.md` — моему)
> реализована корректно: `chromaFlip` + guard-mix в обоих циклах, статика побайтно прежняя.
> Пользователь: **линия при драге/клике-в-движении всё ещё видна**. Повторная диагностика (§1)
> подтвердила и место, и механизм, но нашла ошибку масштаба в моём плане: ширина перехода была
> фиксированной и в нелинейных единицах — на скорости кернел смаза в разы длиннее полосы
> перехода, и инверсия спектра остаётся видимой узкой «щипкой». Правка — только сайт, тот же
> один шейдер + контракты; протокол/контролы не меняются. Плюс попутный баг: undefined `clamp`
> при Count < 8 (§2.3 — у пользователя Count = 6). Worklog hero — `### Delivery N — …`, номер =
> следующий свободный (сейчас последняя 50 ⇒ 51, **перепроверить**). Коммиты — только по явной
> просьбе.

---

## 1. Диагностика (численная, воспроизводимая)

1. **Скриншот бага, поколоночный анализ** (профили яркости/теплоты/резкости по столбцам):
   самый сильный вертикальный разрыв — канал «тепло−холод» (R−B) на **26–27.3% ширины** (низ
   кадра ~27.3%, верх ~26% — линия слегка изогнута). Порт проекции линзы на настройках
   пользователя кладёт **внутреннюю границу левой зоны на 25.3%** (θ-кривая, изгиб по высоте
   совпадает). Место подтверждено: это граница зоны, диагноз Delivery 50 по месту был верен.
2. **Симуляция шейдера по сканлинии** (порт всех величин зоны на applied-настройках: edgeWidth
   25, amount 200, blur 22, curve 1.4, velocity 0.8): после Delivery 50 все величины через
   границу **непрерывны** при медленном движении — на «спокойной» проверке дефект и не виден.
3. **Ошибка масштаба.** Модель спектрального центроида (разнос масс красного и синего вдоль
   кернела) через границу:

   | вариант | шаг разноса, px на 2px экрана, при \|mv\| = 18 / 70 / 140 |
   |---|---|
   | до Delivery 50 (жёсткий флип) | 28.7 / 111.2 / 222.4 — исходная линия |
   | Delivery 50 (полоса 0.12 в staticEdge) | 2.1 / 6.1 / **11.4** — линия уже, чуть левее, но жива |
   | адаптивная полоса (§2) | 1.8 / 2.7 / **3.1** |

   Причина: полоса перехода задана константой `0.12` в **staticEdge**-единицах — при curve 1.4
   это ~72 px экрана, а кернел смаза на скорости — до **280 px** (клип 140 × 2). Инверсия
   ±110 px сжимается в полосу уже собственного следа → видимая «щипка»-линия при быстром
   драге, глайде и клике во время движения. Ширина перехода обязана масштабироваться с длиной
   кернела и быть линейной по экрану (`distance`, не `staticEdge`).
4. **Попутный дефект** (не причина линии, но реальный): `activeSamples = clamp(…,
   MOTION_SAMPLE_FLOOR, float(uSamples))` — у пользователя `Count = 6`, а
   `MOTION_SAMPLE_FLOOR = 8.0` ⇒ `clamp(x, 8.0, 6.0)` с min > max — **undefined в GLSL**
   (результат зависит от GPU). Внесён моей же perf-доставкой (floor предполагал Count ≥ 8).

## 2. Правка шейдера (`hero-dispersion-post-shader.ts`)

- [ ] **2.1. Константы** — заменить `MOTION_CHROMA_BAND` на:

      ```glsl
      const float MOTION_CHROMA_BAND_MIN = 0.15; // zone-distance units at rest
      const float MOTION_CHROMA_BAND_MAX = 0.9;
      const float MOTION_CHROMA_KERNEL_PAD = 24.0; // px
      ```

- [ ] **2.2. Формула** — строку
      `float chromaFlip = motionSign < 0.0 ? 1.0 - smoothstep(0.0, MOTION_CHROMA_BAND, staticEdge) : 0.0;`
      заменить на:

      ```glsl
      float chromaBand = clamp(
        (2.0 * length(motionVelocity) + MOTION_CHROMA_KERNEL_PAD) / activeZonePixels,
        MOTION_CHROMA_BAND_MIN,
        MOTION_CHROMA_BAND_MAX
      );
      float chromaFlip = motionSign < 0.0 ? 1.0 - smoothstep(0.0, chromaBand, distance) : 0.0;
      ```

      (`activeZonePixels` и `distance` уже вычислены выше по коду). Семантика: ширина полосы
      перекраски = длина кернела смаза (2·|mv|) + запас, нормированная на ширину зоны в
      пикселях; на скорости переход растягивается почти на всю зону, в покое/медленно — узкий
      (0.15), т.е. вид Delivery 50 при спокойном движении сохраняется. Guard-mix в двух циклах
      (`chromaFlip > 0.0 ? mix(…) : spectralWeight(t)`) — **не трогать**, он остаётся как есть.
- [ ] **2.3. Undefined clamp** — перед `int activeSamples = …`:

      ```glsl
      float sampleFloor = min(MOTION_SAMPLE_FLOOR, float(uSamples));
      ```

      и в формуле `clamp(ceil(motionKernel * MOTION_SAMPLE_DENSITY), sampleFloor, float(uSamples))`.
      При Count ≥ 8 поведение прежнее; при Count < 8 ветка движения детерминированно использует
      Count сэмплов (= поведению до perf-доставки), undefined уходит.

## 3. Тесты (`hero-dispersion-post-shader.test.ts`), RED → GREEN

- [ ] **3.1.** В тесте Delivery 50 заменить регексы:
      - `/const float MOTION_CHROMA_BAND = 0\.12;/` → три регекса на новые константы
        (`MOTION_CHROMA_BAND_MIN = 0\.15`, `MOTION_CHROMA_BAND_MAX = 0\.9`,
        `MOTION_CHROMA_KERNEL_PAD = 24\.0`);
      - регекс формулы `chromaFlip` → два новых:
        `/float chromaBand = clamp\(\s*\(2\.0 \* length\(motionVelocity\) \+ MOTION_CHROMA_KERNEL_PAD\) \/ activeZonePixels,\s*MOTION_CHROMA_BAND_MIN,\s*MOTION_CHROMA_BAND_MAX\s*\);/`
        и `/float chromaFlip = motionSign < 0\.0 \? 1\.0 - smoothstep\(0\.0, chromaBand, distance\) : 0\.0;/`;
      - оставить без изменений: счётчик `chromaFlip > 0\.0` === 2, счётчик mix === 2,
        `doesNotMatch /vec3 weight = spectralWeight\(t\);/`, все регексы тернарника
        `motionSign`/`motionSmear`/drift.
- [ ] **3.2.** Тест адаптивных сэмплов (perf-доставка): найти регекс, прибивающий
      `clamp(ceil(motionKernel * MOTION_SAMPLE_DENSITY), MOTION_SAMPLE_FLOOR, float(uSamples))`,
      заменить на вариант с `sampleFloor` + новый регекс на строку
      `float sampleFloor = min(MOTION_SAMPLE_FLOOR, float(uSamples));`.
- [ ] **3.3.** Остальные shader/effect-контракты — зелёные без правок; прогнать весь файл.

## 4. Целевое поведение

- **M1** — линии на границах зон нет ни при какой скорости: медленный драг, быстрый драг,
  авто-глайд, клик во время глайда; обе стороны; тёплой «щипки»-полосы нет.
- **M2** — статика побайтно прежняя (`motionSign = 1` ⇒ `chromaFlip = 0` ⇒ guard выбирает
  `spectralWeight(t)`; snapshot-паритет как в Delivery 50).
- **M3** — при медленном встречном движении вид зоны ≈ Delivery 50 (полоса минимальная 0.15);
  при быстром — спектр зоны плавно переходит в прямой порядок почти по всей ширине (всё равно
  всё в сильном смазе); откат/тюнинг: `MAX = MIN` ⇒ узкая фиксированная полоса как в D50.
- **M4** — при Count < 8 ветка движения детерминирована (Count сэмплов) на всех GPU; при
  Count ≥ 8 — поведение не меняется.

## 5. Проверки

- [ ] Focused `pnpm exec tsx --test` по `hero-dispersion-post-shader.test.ts` и соседним
      shader/lifecycle-тестам (RED → GREEN); focused `oxfmt`; `pnpm lint`; `pnpm typecheck`;
      `pnpm test:unit`; `pnpm build`; `git diff --check`.
- [ ] Статический побайтный снапшот-паритет (2 состояния с зонами, без движения) — diff = 0.
- [ ] Ручные, **обязательно на быстрых жестах** (именно там жил остаток): (а) резкий драг
      вправо и влево; (б) клик во время авто-глайда; (в) авто-прыжок (duration 0.3);
      (г) медленный драг; (д) Edge width 0 / 25 / 50; (е) Count 6 и 16 — смаз в центре живой,
      без артефактов; (ж) Grain/CRT включены (как у пользователя); (з) reduced motion.
      Приёмка — лично пользователем на его настройках.

## 6. Verification note

```md
Verification tier: Tier 3
Reason: Follow-up website-only shader correction to Delivery 50: the chroma-flip transition width
now scales with the motion-kernel length in screen-linear zone-distance units (three constants +
one formula), plus a deterministic sample floor fixing an undefined GLSL clamp when Count < 8.
Static output stays byte-identical.
Run: focused tsx shader contracts (RED→GREEN); static byte-parity snapshots; site
lint/typecheck/test:unit/build; git diff --check; fast-gesture manual matrix §5 with explicit user
sign-off.
Skip: verify:delivery; verify:perf (same per-fragment cost class); browser e2e beyond the manual pass.
```

## 7. Границы и риски

- Диагноз и модель подтверждены численно (профили скриншота + порт шейдера + центроидная
  модель, шаги в §1.3), но финальный судья — глаз пользователя на живой странице; если
  остаточная неоднородность останется видимой, следующая ручка — `MOTION_CHROMA_BAND_MIN`
  вверх (0.2–0.25) или `MOTION_CHROMA_KERNEL_PAD` вверх; крайний вариант — убрать флип совсем
  (`chromaFlip = 0` навсегда: спектр всегда прямой, зона теряет «согласованность» радуги со
  статикой при встречном движении — одна строка).
- При Count = 6 смаз на скорости объективно шумный (6 сэмплов на кернел до 280 px) — это
  качество, выбранное контролом Count, а не дефект; если пользователь захочет чище — поднять
  Count в Toolcraft, кода не требует. Зафиксировать фразой в worklog.
- Глубокая часть зоны при быстром встречном движении теперь показывает почти прямой порядок
  спектра (раньше — обратный): в сильном смазе различие не читается; при сомнении — сравнить
  бок о бок до/после на быстром глайде.
- Центральный шов при Edge width > ~50 (перекрытие зон через θ = 0) — по-прежнему отдельная
  известная тема, вне скоупа.
