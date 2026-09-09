# Hero Gallery — полоса шума сверху: диагноз и полное удаление верхне-нижней зоны (эффект остаётся только по бокам)

> **For agentic workers:** план рассчитан на выполнение по задачам (checkbox `- [ ]`) с
> `superpowers:subagent-driven-development` или `superpowers:executing-plans`. Preflight из
> `AGENTS.md` → `docs/toolcraft/workflow.md` обязателен. Этот файл — единственный документ доставки.
>
> **Контекст.** После Delivery 33 резкий купол при движении ушёл, но пользователь видит вверху
> сцены полосу тёмного зерна во всю ширину (скриншот в переписке; настройки — `herosettings 3.json`:
> `Dispersion 120`, `Blur 22`, `Top and bottom 4`, `Edge width 30`, `Turbulence 0.7 / 130`,
> `Aura 0.6`, `Gate glow 0.55 / Width 63 / Offset 33 / Refraction 22`, `Motion boost 0.8`).
> Решение пользователя: **верхне-нижнюю зону убрать целиком**, эффект остаётся только в боковых
> зонах. Это удаление контрола `Top and bottom` и всей вертикальной ветки: Toolcraft + сайт,
> протокол v14 → v15 (прецедент — Delivery 26, удаление `zoneSpace`, v13 → v14). Обе рабочие копии
> правятся синхронно, коммиты — только по явной просьбе пользователя. Номер записи worklog —
> следующий свободный (сейчас 34, перепроверить). Режим проверки — уточнить; по умолчанию §7.

---

## 1. Диагноз: что это за полоса

Полоса — это **сама статическая оптика верхней зоны**, а не остаток бага движения. Механика по
текущему `hero-dispersion-post-shader.ts` (состояние 2026‑08‑23 01:01, строки указаны по нему):

1. **Ядро зоны — изотропный 2D‑диск** (`diskSampleOffset`, строки 504–510), введённый Delivery 28.
   Радиус при настройках пользователя: `(uAmount + uBlur/2)·staticEdge·verticalOnset·modulation`
   ≈ до `131 · 1 · 1.6 ≈ 210 px` у кромки холста (`modulation` до 1.6 от Turbulence 0.7). На диск
   площадью `π·R²` приходится всего 32 выборки с белым джиттером (`ditherPhase`) ⇒ примерно одна
   выборка на клетку ~40×40 px ⇒ сильный стохастический спекл. Боковые зоны с теми же настройками
   не зернят, потому что их 32 выборки лежат на **линии** (`direction·span·spread`, шаг ~4 px) —
   плотность на порядок выше, а спектральные веса упорядочены вдоль линии, а не рассыпаны по кругу.
2. **Тёмный цвет зерна** — прозрачные промежутки. Диск затягивает в карточные пиксели прозрачные
   тэпы из зазоров (`cards.gap 35`, `rowGap 17`) и из‑за premultiplied‑альфы каждый такой тэп
   затемняет цвет и опускает альфу — сквозь полосу проступает шахматка холста (видна на скриншоте).
   Финальный блок `outsideAuthoredContent` (строки 593–597) над зазорами дополнительно оставляет
   только спектральную кайму с малой альфой ⇒ «грязные» цветные крапинки.
3. **Пятнистость** — Turbulence: `modulation = 0.55…1.6` по fbm модулирует радиус вдоль зоны ⇒
   зерно сбивается в кляксы. Aura (12 выборок на диске радиусом до ~2.6× основного, gain
   `0.6·staticEdge·zoneGain`) и gate glow (`0.55`, ширина 63 px на зоне высотой ~71 px, с
   `zoneGain`) подсвечивают внешнюю половину зоны и делают зерно контрастнее.
4. **Почему полоса «осталась»**: зерно генерировалось зоной с Delivery 28 всегда, но полнозонный
   mix к резкой сцене частично маскировал его у внутренней границы, а при движении поверх лежал
   резкий купол. Delivery 33 (по плану) убрала купол и маску — зона впервые показала свою
   настоящую оптику. Форма полосы во всю ширину — это и есть зона: на верхних φ она покрывает все
   видимые θ.

Честный вывод: диск на 32 выборках при таких радиусах физически не может быть гладким; лечение
(сотни тэпов или отдельный separable‑blur проход) дороже, чем ценность эффекта, и пользователь
решил зону убрать. При `Top and bottom = 0` уже сейчас вся вертикальная ветка мертва
(`verticalDistance = 0` ⇒ боковой путь), поэтому удаление обязано быть **побайтно эквивалентно
текущему шейдеру при `topWidth = 0`** — это главный инвариант доставки.

## 2. Сайт (`recraft-v4-styles/src/components/pages/home/`)

- [x] **2.1. `hero-dispersion-post-shader.ts`** — удалить вертикальную ветку из
  `HERO_DISPERSION_POST_FRAGMENT_SHADER` (номера строк сверить перед правкой):
  - строка 153: `uniform float uTopWidth;` — удалить;
  - строки 298–301: хелпер `verticalSceneValidity` — удалить целиком;
  - строки 303–313: хелпер `diskSampleOffset` — удалить целиком;
  - строка 325 (`vec2 dirPhi = …`) — удалить (после правок не используется; `gradients.zw` в
    `panelToScreenPerp` и glass‑ветке остаётся);
  - строки 326–348 (зоны и рамка) привести к виду:

    ```glsl
      float thetaWidth = max((uPanelBounds.y - uPanelBounds.x) * uEdgeWidth, 1e-5);
      float sideDistance = uEdgeWidth <= 0.0 ? 0.0 : field.x < 0.0
        ? clamp(1.0 - (field.x - uPanelBounds.x) / thetaWidth, 0.0, 1.0)
        : clamp(1.0 - (uPanelBounds.y - field.x) / thetaWidth, 0.0, 1.0);
      vec2 sideDirection = (field.x < 0.0 ? -1.0 : 1.0) * dirTheta;

      float distance = sideDistance;
      vec2 direction = sideDirection;
      vec2 perpendicular = vec2(-direction.y, direction.x);
      float panelAngularWidth = (uPanelBounds.y - uPanelBounds.x) * uEdgeWidth;
      float panelRadiansPerPixel = length(gradients.xy);
      float activeZonePixels = panelAngularWidth / max(panelRadiansPerPixel, 1e-5);
      activeZonePixels = clamp(activeZonePixels, 1.0, max(uScreenSize.x, uScreenSize.y));
    ```

    (удалены `phiWidth`, `verticalDistance`, `verticalDirection`, `verticalDominant` и оба
    тернарника по `sideDistance >= verticalDistance`);
  - строки 362–365 (`motionSign`) — убрать условие `verticalDominant < 0.5 &&`:

    ```glsl
      float motionAlignment = dot(direction, motionVelocity);
      float motionSign = (staticEdge > 0.0005 &&
        motionAlignment < -0.2 * length(motionVelocity)) ? -1.0 : 1.0;
    ```

  - строки 441–448: удалить комментарий и `verticalTransition` / `verticalOnset` / `zoneGain` /
    `verticalDispersionSpan` / `verticalSampleRadius`; **`verticalExtent` (строка 440) остаётся** —
    это перпендикулярная полутолщина размытия бокового пути из референсного шейдера, к зоне
    отношения не имеет, не переименовывать;
  - блок турбулентности (451–469): `sideSeed` упростить до
    `float sideSeed = field.x > 0.0 ? 13.7 : 3.1;`, из применения модуляции удалить строки
    `verticalDispersionSpan *= modulation;` и `verticalSampleRadius *= modulation;`;
  - refraction (476–482) — безусловно боковая форма:

    ```glsl
      if (uGateRefraction > 0.01 && staticEdge > 0.0005) {
        point += direction * gateRefractionRadius;
      }
    ```

  - ранний выход (485–486): удалить `activeSampleSpan`, условие —
    `if (span < 0.5 && length(motionVelocity) < 1.5) {`;
  - главный цикл (494–524): оставить одно смещение и простое накопление без validity:

    ```glsl
          vec2 offset = direction * span * spread + motionSmear * spread * 2.0 +
            perpendicular * ((jitterY * 2.0 - 1.0) * verticalExtent);
          vec4 texel = sampleScene(point + offset);
          accumulated += texel.rgb * weight;
          weightSum += weight;
          float luminanceWeight = (weight.r + weight.g + weight.b) / 3.0;
          alpha += texel.a * luminanceWeight;
          alphaWeight += luminanceWeight;
        }
        color = vec4(accumulated / max(weightSum, vec3(1e-5)), alpha / max(alphaWeight, 1e-5));
    ```

    (`sideOffset`/`verticalOffset`/`sampleValidity`/`validWeight`/`validSampleCount` и тернарник
    после цикла удаляются; `weightSum` из `vec3` весов не бывает нулевым);
  - aura (526–571): `float auraGain = uAura * staticEdge * min(haloSwing, 1.6);`; в цикле одно
    смещение и простое накопление:

    ```glsl
            vec2 auraOffset = direction * (span * 2.6 + 24.0) * haloSwing * spread +
              motionSmear * spread * 3.0 + perpendicular *
              ((jitterY * 2.0 - 1.0) * (verticalExtent * 2.5 + 12.0) + haloWave * 34.0);
    ```

    (`verticalAuraRadius`/`verticalAuraOffset`/`auraSampleValidity` удаляются, веса — как в главном
    цикле без validity);
  - gate glow (574): `float gateGain = uGateGlow * band;`;
  - хвост (`outsideAuthoredContent`, `uFade`) — без изменений.

  **Инвариант:** новый шейдер обязан быть алгебраически эквивалентен текущему при `uTopWidth = 0`
  (тогда `verticalDistance = 0`, `verticalDominant = 0`, `zoneGain = 1`, `sampleValidity = 1`,
  `activeSampleSpan = span`, боковой seed турбулентности) — правка ничего не меняет ни в боках, ни
  в центре, ни в Rows.

- [x] **2.2. `hero-sphere-gallery-passes.ts`** — удалить `'uTopWidth'` из списка locations
  (строка 212) и загрузку `gl.uniform1f(post.locations.uTopWidth, dispersion.topWidth / 100);`
  (строка 349). `uPanelBounds` остаётся vec4 как есть (θ‑границы используются; φ‑границы —
  геометрия панели, `getHeroPanelZoneBounds` и его тесты не трогать).

- [x] **2.3. `hero-scene-settings.ts`** — удалить поле `topWidth` из типа dispersion (строка 22),
  дефолт `topWidth: 0` (165), границы `dispersionTopWidth: [0, 50]` (256) и строку клампа в
  нормализации (514). Старые JSON с `dispersion.topWidth` должны молча игнорироваться — так же,
  как уже игнорируется `zoneSpace`.

- [x] **2.4. `hero-preview-boundary.tsx`** — `const previewProtocolVersion = 14;` → `15`
  (строка 16). Больше в файле упоминаний topWidth нет.

- [x] **2.5. `hero-scene-settings.test.ts`** — переписать тест
  `'normalizes lens-only post-effect zone settings…'`: вход с
  `dispersion: { zoneSpace: 'panel', topWidth: 18 }` нормализуется без ошибок, и в результате
  `Object.hasOwn(….dispersion, 'topWidth') === false` и `'zoneSpace' === false`; проверку
  `defaultHeroSceneSettings.dispersion` дополнить отсутствием `topWidth`.

- [x] **2.6. `hero-dispersion-post-shader.test.ts`** — контрактные тесты (сначала RED, потом GREEN):
  - `'post shader flips the directed smear only against a side static span and clamps drift'` —
    регекс `motionSign` заменить на
    `/float motionSign = \(staticEdge > 0\.0005 &&\s*motionAlignment < -0\.2 \* length\(motionVelocity\)\) \? -1\.0 : 1\.0;/`;
  - `'post shader gates the expensive loops at the exact visible-motion threshold'` — регекс →
    `/if \(span < 0\.5 && length\(motionVelocity\) < 1\.5\)/`;
  - `'post shader defines its only static zone on the lens field'` — удалить проверки `phiWidth`,
    `verticalDistance`, `verticalDirection` и тернарники; вместо них
    `/panelAngularWidth\s*=\s*\(uPanelBounds\.y - uPanelBounds\.x\) \* uEdgeWidth/` и
    `/panelRadiansPerPixel\s*=\s*length\(gradients\.xy\)/`; остальное (uZoneSpace‑запреты,
    `thetaWidth`, `sideDistance`, `sideDirection`, `activeZonePixels`) оставить;
  - четыре теста `'top and bottom …'` (ramp static optics / drag motion stays directed / ignore
    vertically out-of-scene taps / boundary refraction) — **удалить** и заменить одним:

    ```ts
    test('the lens defines side zones only, with no vertical treatment left', () => {
      assert.doesNotMatch(HERO_DISPERSION_POST_FRAGMENT_SHADER, /uTopWidth/);
      assert.doesNotMatch(
        HERO_DISPERSION_POST_FRAGMENT_SHADER,
        /verticalDistance|verticalDominant|verticalDirection|verticalTransition|verticalOnset/,
      );
      assert.doesNotMatch(
        HERO_DISPERSION_POST_FRAGMENT_SHADER,
        /diskSampleOffset|verticalSceneValidity|verticalSampleRadius|verticalDispersionSpan|verticalAuraRadius|zoneGain/,
      );
      assert.doesNotMatch(HERO_DISPERSION_POST_FRAGMENT_SHADER, /phiWidth/);
      assert.match(
        HERO_DISPERSION_POST_FRAGMENT_SHADER,
        /vec2 offset = direction \* span \* spread \+ motionSmear \* spread \* 2\.0 \+\s*perpendicular \* \(\(jitterY \* 2\.0 - 1\.0\) \* verticalExtent\);/,
      );
      assert.match(
        HERO_DISPERSION_POST_FRAGMENT_SHADER,
        /vec2 auraOffset = direction \* \(span \* 2\.6 \+ 24\.0\) \* haloSwing \* spread \+\s*motionSmear \* spread \* 3\.0 \+ perpendicular \*\s*\(\(jitterY \* 2\.0 - 1\.0\) \* \(verticalExtent \* 2\.5 \+ 12\.0\) \+ haloWave \* 34\.0\);/,
      );
      assert.match(
        HERO_DISPERSION_POST_FRAGMENT_SHADER,
        /if \(uGateRefraction > 0\.01 && staticEdge > 0\.0005\) \{\s*point \+= direction \* gateRefractionRadius;\s*\}/,
      );
      assert.match(HERO_DISPERSION_POST_FRAGMENT_SHADER, /float gateGain = uGateGlow \* band;/);
    });
    ```

  - `'sphere pass wiring and gallery diagnostics expose only the lens zone contract on protocol v14'`
    — переименовать на v15, регекс boundary → `/const previewProtocolVersion = 15;/`, добавить
    `assert.doesNotMatch(passesSource, /uTopWidth|topWidth/);`;
  - остальные тесты файла остаются без правок и должны быть зелёными.

## 3. Toolcraft (`recraft-tools/hero/`)

- [x] **3.1. `src/app/hero-dispersion-values.ts`** — удалить `topWidth` из карты таргетов
  (`"dispersion.topWidth"`, строка 17), из типа (48), из дефолтов (78) и из чтения/клампа
  (129–131). `hero-dispersion-values.test.ts` — удалить блок клампа `topWidth`.
- [x] **3.2. `src/app/hero-dispersion-control-sections.ts`** — удалить контрол `topWidth`
  («Top and bottom») из секции `edge-zone`; если `zoneGeometryReason` больше нигде не
  используется — удалить константу. В секции остаётся 5 контролов, порог semanticGroup (≥8) не
  задевается.
- [x] **3.3. `src/app/hero-preview-pipeline.ts`** — удалить `heroDispersionTargets.topWidth` из
  `HERO_DISPERSION_CONTROL_DRAG_TARGETS`.
- [x] **3.4. `src/app/hero-preview-protocol.ts`** — `HERO_PREVIEW_PROTOCOL_VERSION = 14` → `15`
  (payload dispersion типизирован через `HeroDispersionSettings`, поле уйдёт из 3.1
  автоматически — проверить компиляцию).
- [x] **3.5. Acceptance** — `src/app/app-acceptance-data.ts`: удалить
  `heroDispersionTargets.topWidth` из targets секции `edge-zone` (строка ~521) и убрать
  «top/bottom reach» из её `groupingReason`; `src/app/hero-product-control-acceptance.ts`: удалить
  строку «Top and bottom» (~445).
- [x] **3.6. Тесты Toolcraft** — `hero-dispersion-toolcraft.test.ts`: убрать `"topWidth"` из
  ожидаемого списка контролов секции, ожидание формы контрола, упоминания в списках
  pipeline/acceptance (строки ~79–150); `hero-preview.product.test.ts`: удалить кейс с
  `acceptanceId: heroDispersionTargets.topWidth` (~199–201).
- [x] **3.7. e2e** —
  - `e2e/product-effects-preview.spec.ts`: удалить строку `{ acceptanceId: target.topWidth, action: "slider" }`;
  - `e2e/product-gallery-effect.spec.ts`: удалить тест
    `browser: lens top-bottom bands change Sphere pixels` (и `topAndBottomRegions`, если больше не
    используется); в тесте `browser: dispersion.velocity changes the embedded hero output` удалить
    получение и обнуление слайдера `topWidth` (остального не менять — `Edge width = 0` уже
    изолирует движение);
  - удалить `e2e/product-gallery-zone-arc.spec.ts`, `e2e/hero-gallery-zone-arc-helpers.ts` и
    `e2e/hero-gallery-zone-arc-helpers.test.ts` — сперва grep’ом убедиться, что хелперы не
    импортирует никто, кроме этой пары (общие `hero-gallery-snapshot-helpers` и
    `hero-preview-browser-helpers` не трогать).
- [x] **3.8. Финальный grep обеих реп**: `topWidth|uTopWidth|verticalDominant|diskSampleOffset` —
  вне `docs/` (worklog, старые планы) совпадений быть не должно. Проверить
  `hero-applied-settings.json` на сайте: ключа `topWidth` там нет — если появился после Apply,
  удалить. Продуктовые и e2e-источники чисты; имена остались только в
  отрицательных unit-контрактах, которые доказывают их отсутствие; в
  `hero-applied-settings.json` ключа нет.
- [x] **3.9. Worklog** — запись Delivery 34 в `docs/toolcraft/agent-worklog.md`: диагноз полосы
  (§1 — зерно 2D‑диска зоны, прозрачные зазоры, турбулентность; маска mix скрывала его до
  Delivery 33), решение пользователя убрать зону, протокол v15, инвариант «эквивалентно
  `topWidth = 0`», фактические проверки §5 и риски §6.

## 4. Целевое поведение

- **M1** — верх и низ сцены чистые: в статике — резкие карточки без полосы зерна, при драге — тот
  же направленный всекарточный смаз, что в центре; никаких зонных полос, куполов и подсветки.
- **M2** — боковые зоны не изменились ни в статике, ни в движении (вся правка эквивалентна
  `Top and bottom = 0`).
- **M3** — контрола «Top and bottom» больше нет; секция Edge Zone валидна; импорт старых JSON с
  `dispersion.topWidth` (в т.ч. `herosettings 3.json`) проходит без ошибок, поле игнорируется.
- **M4** — протокол v15 согласован с обеих сторон: iframe доходит до ready, настройки и Pan
  применяются, snapshot работает; Rows и Apply → standalone без изменений.

## 5. Проверки

- [ ] **Опорный снимок до правки:** в текущем Toolcraft выставить `Top and bottom = 0` (остальные
  настройки пользователя не менять) и снять snapshot через существующий протокольный запрос —
  после правки тот же snapshot при тех же настройках должен совпасть (допуск — побайтно; это
  прямое доказательство инварианта §2.1). Вернуть значения пользователя. **Блокер:** Browser API не
  открыл `contentWindow` iframe для v14 snapshot-запроса и не дал эмуляцию reduced motion; PNG/hash
  не подменялись скриншотом и не фабриковались.
- [x] Сайт: RED → GREEN `pnpm dlx tsx --test src/components/pages/home/hero-dispersion-post-shader.test.ts src/components/pages/home/hero-scene-settings.test.ts src/components/pages/home/hero-sphere-gallery-motion.test.ts src/components/pages/home/hero-sphere-gallery-lifecycle.test.ts src/components/pages/home/hero-sphere-layout-phase.test.ts src/components/pages/home/hero-sphere-layout-visibility.test.ts`;
      focused `oxfmt` на затронутых файлах; `pnpm lint`; `pnpm build`; `git diff --check`
      (typecheck/format — pre‑existing блокеры, зафиксировать и не чинить попутно). GREEN 32/32; focused
      `oxfmt`, lint, build и diff-check прошли; lint/build сохранили только известные warning.
- [ ] Toolcraft: `pnpm test` (vitest, включая обновлённые dispersion‑тесты); браузерные кейсы
      напрямую: `dispersion.velocity changes the embedded hero output` и матрица
      `product-effects-preview` без topWidth; убедиться, что удалённые spec’и не оставили битых
      импортов (`pnpm exec tsc`‑аналог проекта или прогон Playwright discovery). **Частично:** focused Vitest
      77/77, velocity 1/1 и discovery 297 тестов / 51 файл прошли. Матрица прошла 24/25; последний
      неизменённый `auraGate.refraction` оборвался из-за `Execution context was destroyed` при навигации;
      повторный 14-минутный прогон не делался. `pnpm test` остановлен pre-existing integrity-запретом
      на protected-evidence import в `product-gallery-effect.spec.ts:15`, который уже есть в `HEAD`.
- [ ] Ручные (импорт `herosettings 3.json`): (а) статика — верхней полосы зерна нет, верх резкий;
      (б) драг вниз/вверх/вбок — равномерный смаз по всей галерее, без полос и куполов; (в) бока —
      прежние дисперсия/aura/gate; (г) контрол «Top and bottom» отсутствует, консоль без ошибок,
      `data-hero-gallery-passes = scene→field→post`, ready на v15; (д) Rows и Apply → standalone. **Частично:** точный старый JSON
      импортирован без alert; значения восстановились, `Top and bottom` отсутствует, один ready WebGL
      канвас показывает `scene→field→post`, console errors 0, статический верх без полосы. Полная ручная
      матрица драга и Rows/Apply → standalone не повторялись.

## 6. Риски

- Протокольная пара: пока обе рабочие копии не обновлены, iframe с несовпадающей версией молча
  игнорирует сообщения — правку выполнять в одной доставке и проверять ready в конце.
- Пользовательские сохранённые пресеты с `dispersion.topWidth` продолжают импортироваться (поле
  игнорируется); вернуть эффект наверх после удаления можно только новой доставкой с новым
  протокольным полем — осознанное решение пользователя.
- В хранилище значений Toolcraft может остаться осиротевший ключ `dispersion.topWidth` из прежних
  сессий — он ни на что не влияет; ничего не мигрировать.

## 7. Verification note

```md
Verification tier: Tier 2
Reason: Coordinated feature removal (control + protocol field + shader branch) across Toolcraft and the website; side-zone rendering must stay byte-equivalent to topWidth = 0.
Run: baseline snapshot equivalence check; focused tsx site tests; toolcraft vitest; the dispersion.velocity and product-effects-preview browser cases; oxfmt on touched files; site lint/build; git diff --check; manual checks §5 on herosettings 3.json.
Skip: verify:delivery; verify:perf; export matrices; site typecheck/format (pre-existing blockers, record them).
```
