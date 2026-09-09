# Hero Gallery — зона эффекта всегда повторяет линзу (план правки)

> **For agentic workers:** план рассчитан на выполнение по задачам (checkbox `- [ ]`) с
> `superpowers:subagent-driven-development` или `superpowers:executing-plans`. Перед правками
> обязателен preflight из `AGENTS.md` → `docs/toolcraft/workflow.md`. Этот файл — единственный документ
> доставки (диагноз §1, дизайн §2–§3, план §4–§8).
>
> **Контекст.** Delivery 25 (план `2026-08-21-hero-dispersion-post-pass.md`) перевела эффект краёв Sphere
> в один post-проход и добавила в секцию `Edge Zone` два контрола: `Zone space` (`Viewport` / `Panel`,
> default `Viewport`) и `Top and bottom`. Пользователь включил `Top and bottom` и увидел прямую
> горизонтальную полосу сверху (скриншот): «эффект дисперсии не выгибается как я просил… выгибаться
> должен тоже как линза». Номер записи worklog — следующий свободный (**Delivery 26**, перепроверить),
> протокол — следующий (**v14**, сейчас v13).

---

## 1. Диагноз

Факты (`recraft-v4-styles/src/components/pages/home/hero-dispersion-post-shader.ts`,
`hero-sphere-gallery-motion.ts`, `hero-sphere-gallery-passes.ts`; Toolcraft `hero-dispersion-values.ts`,
`hero-dispersion-control-sections.ts`):

- Post-шейдер содержит две ветки маски. `uZoneSpace < 0.5` (**Viewport**, дефолт и в Toolcraft, и в
  нормализаторе сайта): `sideDistance` и `verticalDistance` считаются **от экранных координат**
  (`min(point.x, W − point.x) / (W·edgeWidth)`, `min(point.y, H − point.y) / (H·topWidth)`), направление —
  `(±1, 0)` / `(0, ±1)`. Это прямые полосы у краёв экрана по построению; `Top and bottom` в этом режиме —
  ровно та прямая полоска со скриншота: одинаковая толщина по всей ширине, прямая нижняя граница
  (при `5 %` ≈ 50 px).
- `uZoneSpace ≥ 0.5` (**Panel**): маска считается **из поля линзы** `B` (θ, φ на пиксель): боковые
  полосы — по долготе относительно `θ_L/θ_R` (где экватор покидает экран), верх/низ — по широте
  относительно `φ_T/φ_B` (где меридиан `θ = 0` покидает экран); направление smear'а — градиенты
  `∇θ`/`∇φ`. Граница такой полосы — изолиния `φ = const` (или `θ = const`) поверхности, на экране она
  изгибается вместе с рядами. На скриншоте у линии нет ни малейшего изгиба при сильном боковом
  увеличении карточек — в Panel-режиме это невозможно.
- Вывод: причина — **выбранный режим `Viewport`** (дефолт), а не ошибка изгиба. Подтверждение за
  одну минуту: в Toolcraft → `Edge Zone` → `Zone space` → `Panel`; во фрейме атрибут
  `[data-hero-gallery] data-hero-gallery-zone-space` должен стать `panel`. Если после этого полоска
  остаётся прямой — см. §7 (ветка отладки); план ниже написан так, что закрывает оба случая.
- Продуктовый вывод: режим прямых полос противоречит требованию «эффект выгибается как линза» и
  избыточен — при плоской линзе (`Bend X = Bend Y = 0`) изолинии и так прямые. Переключатель убираем,
  Sphere всегда использует зону по линзе.

Геометрия Panel-режима, которую пользователю важно знать заранее (цифры для настроек, близких к
скриншоту: `H ≈ 1000`, главная точка `cy ≈ 440`, `Ry ≈ 1500`, боковое увеличение у краёв ≈ 1.6):

- Верхняя полоса — изолиния широты `φ_T − w`, где `φ_T` — широта верхней кромки экрана **в центральной
  колонке**. Её толщина в центре равна `Top and bottom · H` (при `5 %` ≈ 50 px), к бокам она
  **поднимается вместе с рядами** и при сильном боковом увеличении уходит за верх экрана: при `5 %`
  изолиния в боковых колонках оказывается на ~180 px выше кромки, т.е. у углов эффекта нет. Чтобы
  полоса доходила до углов, её толщина в центре должна быть не меньше широты выхода угловой колонки
  (здесь ≈ 160–220 px, т.е. 16–22 %). Это не дефект, а следствие того, что полоса параллельна рядам:
  ряды у верха точно так же уходят за экран по бокам.
- Боковые полосы — изолинии долготы `θ_R − w`: на экваторе ширина ровно `Edge width` (как в прежнем
  виде), у верхних/нижних рядов (увеличенных по X при `Bend Y > 0`) полоса немного у́же (для
  реалистичных настроек — на десятки px).
- Альтернативная привязка «по углу» (полоса гарантированно доходит до углов, в центре толще) —
  одна строка в `getHeroPanelZoneBounds` (минимум широты/долготы выхода по видимым колонкам/рядам
  вместо центральной). Не включаем: тогда `Top and bottom = 5 %` даёт в центре ~220 px, контрол
  перестаёт быть интуитивным. Оставляем привязку к центру; при желании пользователя — см. §7.

## 2. Целевое поведение

- **Z1** — в Sphere зона эффекта всегда определяется на поверхности линзы: боковые полосы по долготе,
  верх/низ по широте, направление smear'а вдоль рядов/колонок. Контрол `Zone space` удаляется.
- **Z2** — `Top and bottom` остаётся (0 = выкл); его описание прямо говорит, что полоса параллельна
  рядам и у боков поднимается вместе с ними.
- **Z3** — для выпуклого профиля (классический fisheye, `Bend < 0`), когда силуэт шара внутри экрана,
  полосы привязываются к **силуэту**, а не к кромке экрана (сейчас поиск границы не находит пересечения
  с кромкой и возвращает `±π`/`±85°` — эффект у обода шара пропадает).
- **Z4** — Rows не меняется; старые persisted-значения (`zoneSpace` в localStorage Toolcraft и tracked
  JSON сайта) игнорируются без ошибок.

## 3. Изменения

### 3.1 Toolcraft

- `hero-dispersion-values.ts`: удалить `heroDispersionTargets.zoneSpace`, тип `HeroDispersionZoneSpace`,
  поле `zoneSpace` из `HeroDispersionSettings`/`HERO_DISPERSION_DEFAULTS`/`createHeroDispersionSettingsFromValues`.
- `hero-dispersion-control-sections.ts`: убрать контрол `zoneSpace` из `Edge Zone` (остаётся 6:
  `Edge width → Top and bottom → Falloff → Edge fade → Turbulence → Turbulence size`); описание
  `Top and bottom`: «Adds bands along the top and bottom of the scene that follow the curved rows:
  the value is the band thickness at the centre, and the band rises with the rows toward the sides;
  0 keeps the effect on the sides only.»; описание `Edge width`: «…the band follows the curved columns of
  the panel; the value is its width at the equator.»
- `hero-preview-pipeline.ts`: убрать target из `HERO_DISPERSION_CONTROL_CHANGE_TARGETS`.
- `hero-product-control-acceptance.ts` / `app-acceptance-data.ts`: удалить строку acceptance и
  `optionCoverage` для `zoneSpace`, target из инвентаря `edge-zone` и из ownership-`map` (он берёт
  `Object.values(heroDispersionTargets)` — уйдёт сам); `groupingReason` без «zone space»;
  `referenceFeatureInventory.reference.hero-edge-zone.toolcraftMapping` — «…one full-screen post pass with
  bands defined on the lens surface…».
- `hero-preview-protocol.ts`: `HERO_PREVIEW_PROTOCOL_VERSION = 14`, `runtimeId` v14.
- Тесты: `hero-preview.product.test.ts`, `hero-dispersion-values.test.ts`, `hero-dispersion-toolcraft.test.ts`
  — убрать кейсы `zoneSpace`, версия 14.

### 3.2 Сайт

- `hero-scene-settings.ts`: удалить `zoneSpace` из типа/дефолтов/нормализатора (лишний ключ во входе
  игнорируется); `hero-scene-settings.test.ts` обновить; `hero-preview-boundary.tsx`:
  `previewProtocolVersion = 14`.
- `hero-dispersion-post-shader.ts`: удалить uniform `uZoneSpace` и ветку Viewport; оставить только
  lens-ветку (`uPanelBounds`, градиенты, `panelZonePixels`). Без изменений формул Panel-ветки.
- `hero-sphere-gallery-passes.ts`: убрать загрузку `uZoneSpace`.
- `hero-sphere-gallery.tsx`: убрать `data-hero-gallery-zone-space`.
- `hero-sphere-gallery-motion.ts` → `findProjectionBoundary` (Z3): при сканировании от 0 к `end`
  запоминать максимум (для правой/верхней границы) или минимум (левой/нижней) спроецированной
  координаты; если пересечения с целью (`0` / `W` / `H`) не нашлось до того, как проекция стала
  невалидной (`w ≤ NEAR`) или начала возвращаться назад (силуэт), возвращать угол этого экстремума, а
  не `end`. Юнит-тест: выпуклая линза с `Rx` меньше полуширины экрана → `thetaRight` = угол силуэта
  (производная проекции по углу меняет знак), вогнутая с камерой внутри → прежнее поведение.

## 4. Browser-проверки (`e2e/`, app-owned)

- [ ] `product-gallery-effect.spec.ts` / `product-effects-preview.spec.ts`: убрать выбор `Zone space`
      и ожидание `data-hero-gallery-zone-space`; кейс `dispersion.topWidth` оставить (пиксели верхней
      полосы меняются).
- [ ] Проверка изгиба (app-owned, через `snapshot`): при `Top and bottom = 25`, `speed = 0`,
      `Bend X = 100`: в декодированном снимке найти нижнюю границу обработанной области (первая строка
      сверху, где доля спектральных/размытых пикселей падает) в центральной колонке и в колонках
      `±35 %` ширины — у боков граница должна быть **выше** (меньше `y`) не менее чем на 8 % высоты.
      При `Bend X = Bend Y = 0` — границы равны (прямая линия). Это фиксирует «полоса параллельна рядам».
- [ ] `npm run test:feature -- dispersion.topWidth dispersion.edgeWidth` (остальной долг — по режиму
      проверки).

## 5. Порядок задач

### Task 0 — Подтверждение

- [ ] Переключить `Zone space` → `Panel` на текущих настройках пользователя, снять скриншот верхней
      полосы; ожидание — дуга, поднимающаяся к бокам. Если прямая — сначала §7.

### Task 1 — Toolcraft

**Files:** modify `src/app/hero-dispersion-values.ts`, `src/app/hero-dispersion-control-sections.ts`,
`src/app/hero-preview-pipeline.ts`, `src/app/hero-product-control-acceptance.ts`,
`src/app/app-acceptance-data.ts`, `src/app/hero-preview-protocol.ts`, тесты из §3.1.

- [ ] §3.1. `npm run typecheck`, `pnpm ai:check`, `npm exec vitest run src/app`.

### Task 2 — Сайт

**Files (site):** modify `hero-scene-settings.ts`, `hero-scene-settings.test.ts`, `hero-preview-boundary.tsx`,
`hero-dispersion-post-shader.ts`, `hero-sphere-gallery-passes.ts`, `hero-sphere-gallery.tsx`,
`hero-sphere-gallery-motion.ts`, `hero-sphere-gallery-motion.test.ts`.

- [ ] §3.2. `pnpm exec oxfmt <файлы>`, `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.
- [ ] Ручной контроль: `Top and bottom` 5 / 15 / 25 — дуга, толщина в центре соответствует проценту,
      у боков поднимается; боковые полосы на экваторе той же ширины, что раньше; `Bend X = Bend Y = 0`
      — прямые полосы; выпуклый профиль с силуэтом внутри экрана — полосы у обода шара; Rows без
      изменений; Apply → standalone совпадает.

### Task 3 — Browser-проверки и worklog

- [ ] §4. Worklog `Delivery 26 — Lens-anchored edge zones only` (request, task type Tier 2, user-visible
      result, source checked — §1 с объяснением Viewport/Panel, decision: remove viewport bands, keep
      centre-anchored lens bands, silhouette-aware bounds; alternatives: corner-anchored bands (rejected:
      thickness semantics), keeping the selector with Panel default (rejected: redundant with flat lens);
      state/output mapping (`zoneSpace` removed, v14); verification; risks). Обновить Status/Decisions.

## 6. Verification note

```md
Verification tier: Tier 2
Reason: Later focused edit removes one Edge Zone selector, bumps the versioned bridge to v14, deletes the viewport mask branch from the post shader, and makes zone bounds silhouette-aware; no new interaction surfaces or runtime internals change.
Run: npm run typecheck; pnpm ai:check; npm exec vitest run src/app; npm run test:feature -- dispersion.topWidth dispersion.edgeWidth; app-owned arc check; website oxfmt/format/lint/typecheck/build + git diff --check; manual checks in Task 2 embedded and standalone after Apply.
Skip: repeated verify:delivery; verify:perf; export matrices.
```

## 7. Ветка отладки (только если Panel тоже даёт прямую полосу)

- Проверить во фрейме `data-hero-gallery-passes="scene→field→post"` и `data-hero-gallery-effect="post"`.
- Снять поле `B`: временно отрисовать `fieldTarget` в default framebuffer (или `snapshot` с флагом) и
  убедиться, что `φ` меняется по вертикали и изолинии изогнуты; проверить `uPanelBounds`
  (`getHeroPanelZoneBounds`) — `phiTop > 0 > phiBottom`, `thetaLeft < 0 < thetaRight`, и что они
  меняются при изменении `Bend X/Depth`.
- Проверить, что `setProjectionUniforms` для field-прохода получает те же `uBendX/uBendY/uRz`, что и
  scene-проход (иначе поле считается для другой линзы, и изолинии не совпадают с карточками).

## 8. Риски

- После удаления `Viewport` прямые полосы доступны только через плоскую линзу — осознанно.
- Тонкая верхняя полоса при сильном боковом увеличении не достигает углов (геометрия §1); если
  пользователь захочет гарантированное покрытие углов — включить привязку по углу (одна строка,
  §1) или добавить контрол `Zone anchor` (Centre / Corner) отдельной доставкой.
- Старые persisted-состояния с `zoneSpace` молча теряют ключ — поведение становится «Panel».
