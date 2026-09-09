# Hero Gallery — картинки по рядам: отдельная загрузка на каждый ряд, только загруженный контент (план реализации)

> **For agentic workers:** план рассчитан на выполнение по задачам (checkbox `- [ ]`) с
> `superpowers:subagent-driven-development` или `superpowers:executing-plans`. Preflight из
> `AGENTS.md` → `docs/toolcraft/workflow.md` обязателен. Этот файл — единственный документ доставки.
>
> **Контекст.** Пользователь хочет наполнять **каждый ряд Sphere отдельным набором картинок**,
> добавлять и удалять ряды, настраивать скорость каждого ряда — и чтобы **показывались только
> загруженные картинки**. Сейчас добавление/удаление рядов и per‑row Offset/Speed уже есть
> (`sphereRows`, collectionActions, 1–6 рядов) — они не меняются; кнопки `+`/`−` пользователь
> подтвердил. Проблема в контенте, по коду (сверено 2026‑08‑24): загрузчик картинок **один на все
> ряды** — fileDrop «Images» (`gallery.images`, секция Gallery Images, applicability `always`), и
> дубли дают два механизма в `splitHeroGallerySourcesByRow`: (1) общий список раскидывается по
> рядам round‑robin (`index % count` — картинку нельзя адресовать в конкретный ряд), (2) **пустой
> ряд добивается всем списком целиком** (`if (row.length === 0) row.push(...sources)`) — при
> числе картинок меньше числа рядов одни и те же картинки оказываются и в своём ряду, и во всех
> «пустых». Третье повторение — зацикливание списка ряда по окружности панели — это устройство
> бесконечной ленты, оно остаётся (см. §1). План вводит по-рядные загрузки и строгие правила
> отображения. Toolcraft + сайт, протокол `текущая версия + 1`
> (на момент написания v17 после Delivery 37 ⇒ станет 18; сверить оба конца). Номер записи
> worklog — следующий свободный (сейчас 38, перепроверить: Deliveries 35 reveal, 36 auto scroll и
> 37 CTA уже выполнены). Режим проверки — уточнить; по умолчанию §6. Коммиты — только по явной
> просьбе пользователя.
>
> **Замечание про «не вижу добавления рядов».** По коду управление рядами на месте: контрол
> «Rows» (`collectionActions`, `sphereRows`) в секции **Gallery**, виден только в режиме Sphere;
> в его заголовке справа две маленькие иконки `−`/`+` (aria «Remove Row»/«Add Row»,
> `+` активна до 6 рядов), под ними Offset/Speed каждого ряда. Кнопки без текста — их легко не
> заметить. Эта доставка (а) добавляет регрессионную браузерную проверку видимости и работы
> `+`/`−` (§2 e2e), (б) делает модель рядов очевидной через секцию «Row Images». Если при
> исполнении живой UI кнопок в Gallery всё же не показывает — остановиться и разобраться как
> отдельный дефект до продолжения.

---

## 1. Модель контента

- **По-рядные загрузки.** Медиа‑ассеты Toolcraft жёстко привязаны к `sourceTarget` своего
  fileDrop и переназначить их нельзя, а `itemControls` у fileDrop документированы только для
  `assetKind: "file"` (schema-reference §92) — поэтому решение: **шесть статических fileDrop**
  «Row 1 images» … «Row 6 images» с таргетами `sphere.rowImages.0` … `sphere.rowImages.5`
  (`assetKind: "image"`, `multiple: true`, `hardMaxItems: 8`, `recommendedMaxItems: 6`). Шесть —
  ровно текущий потолок коллекции рядов (`hardMaxItems: 6`). Дроп с номером больше текущего числа
  рядов просто не рендерится сценой (описание контрола это говорит: «Used while Row N exists»).
- **Строгие правила отображения.**
  1. Ряд i показывает **только** ассеты своего дропа, в порядке медиа. Пустой дроп ⇒ ряд без
     карточек (место ряда в сетке сохраняется: pitch и период `V = n·p` считаются от числа рядов,
     как сейчас). Никакого добивания чужими картинками — паддинг из
     `splitHeroGallerySourcesByRow` удаляется. **Внутри ряда** список по-прежнему зациклен по
     окружности панели (бесконечная лента обязана повторяться): одна картинка в ряду ⇒ она
     повторяется вдоль всего ряда; чтобы повторы встречались реже — класть в ряд больше картинок.
     Это единственное «дублирование», которое остаётся, и оно по построению.
  2. **Legacy‑пул.** Если все шесть по-рядных таргетов пусты, а в старом `gallery.images` ассеты
     есть (текущие загрузки пользователя; переложить их в новые таргеты программно нельзя) —
     сфера распределяет старый пул round‑robin, как сегодня, но уже **без** паддинга пустых
     рядов. Так существующая сцена пользователя не ломается, а как только он кладёт хотя бы один
     ассет в любой Row‑дроп — работает только по-рядная модель.
  3. Авторские портреты (`resolveAuthoredPortraitSources`) остаются **только** как состояние
     «показывать нечего вообще»: ни одного разрешимого загруженного ассета ни в одном ряду и ни в
     legacy‑пуле. Это сохраняет дефолтную витрину, standalone‑сайт (media‑рефы вне Toolcraft не
     разрешаются — как и сегодня) и все существующие e2e без фикстур. Если пользователь захочет
     совсем пустой дефолт — это одна строка, но с переделкой всех пиксельных e2e; в эту доставку
     не входит (§7).
- **Rows‑режим (роллер) не сокращаем:** он продолжает питаться старым `gallery.images`; сам
  контрол «Images» получает applicability `type = rows` (в Sphere он больше не показывается,
  чтобы не путать с по-рядными дропами), описание обновить — убрать фразу про «replace the
  website portraits», оставить точную семантику Rows.

## 2. Toolcraft (`recraft-tools/hero/`)

- [x] **`src/app/hero-gallery-values.ts`** — шесть таргетов `rowImages0…rowImages5`:
      `"sphere.rowImages.0"…".5"`; тип ряда `HeroSphereRow` дополняется
      `images: readonly HeroGalleryImage[]`; `createHeroGalleryImagesFromMediaAssets(mediaAssets, sourceTarget)` —
      параметризовать таргетом (существующий вызов для `gallery.images` сохраняется); сборка
      настроек: `sphere.rows[i] = { offset, speed, images: assetsFor(rowImages[i]) }`, и
      legacy‑правило §1.2 (все шесть пусты + legacy не пуст ⇒ round‑robin распределение
      legacy‑пула по рядам на уровне маппинга). `hero-gallery-values.test.ts` — кейсы: ассеты
      попадают строго в свой ряд; legacy‑распределение включается только при всех пустых
      по-рядных таргетах; unavailable/не‑image ассеты отфильтрованы; порядок медиа сохранён.
- [x] **`src/app/app-schema.ts`** — новая секция «Row Images» (после «Gallery Images»,
      applicability sphere‑only): шесть fileDrop по образцу существующего `images`
      (`assetKind: "image"`, `multiple: true`, `hardMaxItems: 8`, `recommendedMaxItems: 6`,
      `performanceRole: "responsiveness"`, performanceReason про bounded decode), лейблы
      «Row 1 images» … «Row 6 images», описания: «Only these images appear on Row N; an empty
      set leaves Row N blank. Used while Row N exists.» Существующему контролу `images` —
      applicability `{ all: [{ equals: "rows", target: heroGalleryTargets.type }], mode: "conditional" }`
      и обновлённое описание. Секция из 6 контролов — без semanticGroup (< 8).
- [x] **`src/app/app-acceptance-data.ts`** — inventory‑блок новой секции:
      `entity: "Hero gallery row images"`, `entityId: "hero-gallery-row-images"` (свой entityId ⇒ когезия сыта),
      `id: "row-images"`, все шесть таргетов, groupingReason: шесть слотов — по одному источнику
      контента на каждый возможный ряд сферы. У «Gallery Images» — уточнить groupingReason
      (Rows‑режим).
- [x] **`src/app/hero-preview-pipeline.ts`** — все шесть таргетов в media‑import регистрацию
      (рядом с `gallery.images`), чтобы загрузка в любой Row‑дроп доезжала до iframe тем же
      медиа‑каналом.
- [x] **`src/app/hero-preview-protocol.ts`** — `HERO_PREVIEW_PROTOCOL_VERSION` = текущая + 1
      (сверить фактическую); payload рядов получает `images` из values‑типа автоматически;
      `HERO_PREVIEW_DEFAULTS` — ряды с `images: []`.
- [x] **`src/app/hero-product-control-acceptance.ts`** — шесть строк (fileDrop) с
      продукт‑описанием; **`src/app/hero-preview.product.test.ts`** — кейсы по образцу
      существующего `images`: `read: (settings) => settings.gallery.sphere.rows[i]?.images`
      (или эквивалентная форма фактического файла) для представительных рядов 0 и 5.
- [x] Прогнать `app-acceptance.section-*.test.ts` и существующие медиа‑контракты
      (`hero-dispersion-toolcraft.test.ts` затронут не должен быть).
- [x] **e2e** — новый кейс в `e2e/product-gallery-effect.spec.ts` (или соседний медиа‑спек, по
      фактическим хелперам загрузки):
      `browser: per-row images fill only their sphere row`: сперва регрессионная проверка
      управления рядами — кнопки `getByRole("button", { name: "Add Row" })` и
      `{ name: "Remove Row" }` видимы в секции Gallery, клик по «Add Row» добавляет ряд (и его «Row N images» дроп
      начинает питать сцену), «Remove Row» возвращает исходное число; затем реальной загрузкой
      положить PNG‑фикстуру в «Row 1 images» при двух рядах; ожидать: `data-hero-gallery-order` начинается с id
      фикстуры, `data-hero-gallery-signature` изменился, пиксели полосы ряда 1 изменились, полоса
      ряда 2 осталась авторской/пустой по правилу §1 (два снапшота, сравнение областей); удалить
      ассет — сцена возвращается к authored‑витрине (все пусто). Существующие кейсы без загрузок
      остаются зелёными за счёт правила §1.3.
- [x] **Worklog** — запись доставки: модель §1 (шесть статических дропов из‑за ограничений
      fileDrop/`sourceTarget`, строгий per‑row, legacy‑распределение, authored только при полной
      пустоте), протокол +1, отказ от паддинга пустых рядов, фактические проверки §5, риски §7.

## 3. Сайт (`recraft-v4-styles/src/components/pages/home/`)

- [x] **`hero-scene-settings.ts`** — ряд получает `images: HeroGalleryImage[]` (нормализация как
      у текущего `gallery.images`: id/ref строки, transform, размеры ≥ 0, cap 8 на ряд, dedupe по
      `id`); `gallery.images` остаётся (Rows‑режим + legacy). Тест: ряд без поля ⇒ `[]`; мусор в
      `images` отфильтрован.
- [x] **`hero-gallery-sources.ts`** — новая функция
      `resolveHeroGalleryRowSources(gallery): HeroGalleryImageSource[][]`: 1) если хоть один
      `rows[i].images` непуст — по-рядное разрешение через
      `getHeroGalleryMediaEntry` (неразрешимые рефы отбрасываются), пустой ряд ⇒ `[]`; 2) иначе если `gallery.images` разрешим — round‑robin по числу рядов **без паддинга**; 3) иначе — авторские портреты round‑robin (все ряды).
      `createHeroGalleryImageSignature` — учитывать по-рядные списки (включая индекс ряда) с
      прежним sentinel `authored-portraits`. Из `splitHeroGallerySourcesByRow` удалить паддинг
      пустых рядов (`row.push(...sources)`) — она остаётся только для round‑robin ветки; сверить
      прочие вызовы.
- [x] **`hero-sphere-gallery.tsx` / `hero-sphere-gallery-webgl.ts` / `hero-sphere-gallery-passes.ts`**
      — компонент строит `rowSources = resolveHeroGalleryRowSources(...)` и передаёт рендереру
      по-рядную структуру: `setSources(rowSources)` (тип `readonly HeroGalleryImageSource[][]`);
      внутренние вызовы `splitHeroGallerySourcesByRow(sources, rows.length)` в `draw()` и
      компоненте заменяются готовыми списками; `textures.sync` — по плоскому объединению.
      `imageOrder`/`readyIds`/`settledIds` и reveal из выполненной Delivery 35 —
      от плоского объединения по-рядных списков; порядок — ряд за рядом. Пустой ряд не рисует
      карточек, но остаётся в сетке (pitch/период — от `rows.length`, без изменений); пустая
      строка в `layout` уже безопасна (`rowSources[card.rowIndex]?.[card.sourceIndex]` ⇒ карточек
      нет) — убедиться, что `layoutHeroSphereGallery` не делит на ноль при нулевом числе карточек
      ряда (осмотреть и при необходимости ранний `continue` по ряду).
- [x] **`hero-preview-boundary.tsx`** — версия протола = Toolcraft‑значению (+1); медиа‑приём
      не меняется (store ключуется рефом и не знает про таргеты).
- [x] Rows‑режим — без изменений (питается `gallery.images`).

## 4. Целевое поведение

- **M1** — картинки, загруженные в «Row N images», появляются только в ряду N и в порядке
  загрузки; ряд с пустым дропом стоит пустым (место в сетке сохраняется); лишних «чужих» карточек
  нет нигде.
- **M2** — добавление ряда (`+` в Rows) сразу подхватывает его дроп; удаление ряда убирает его
  карточки со сцены, ассеты остаются в дропе и вернутся при повторном добавлении ряда; per‑row
  Offset/Speed работают как раньше.
- **M3** — сцена показывает только загруженный контент, как только загружен хотя бы один ассет
  (по-рядный или legacy‑пул); авторские портреты — только при полностью пустой галерее (свежий
  дефолт, standalone без медиа) — это единственное исключение, согласованное ради дефолтной
  витрины и e2e.
- **M4** — существующие загрузки пользователя (старый общий дроп) продолжают отображаться без
  переим порта через legacy‑распределение; Undo/Reset/persistence работают штатно.
- **M5** — Rows‑режим, дисперсия, пан, авто‑скролл (Delivery 36) и CTA (Delivery 37) — без
  изменений; кнопки «Add Row»/«Remove Row» видимы и работают (регрессия закрыта e2e); протокол
  синхронно поднят с обеих сторон.

## 5. Проверки

- [x] Сайт: RED → GREEN `pnpm dlx tsx --test src/components/pages/home/hero-scene-settings.test.ts src/components/pages/home/hero-sphere-gallery-motion.test.ts src/components/pages/home/hero-sphere-gallery-lifecycle.test.ts src/components/pages/home/hero-dispersion-post-shader.test.ts src/components/pages/home/hero-sphere-layout-phase.test.ts src/components/pages/home/hero-sphere-layout-visibility.test.ts`
      (+ новые юнит‑тесты `resolveHeroGalleryRowSources`: строгий per‑row, legacy‑ветка, authored‑
      ветка, отсутствие паддинга); focused `oxfmt`; `pnpm lint`; `pnpm build`; `git diff --check`.
- [ ] Toolcraft: focused vitest (`hero-gallery-values`, product, section‑тесты); браузерные: новый
      per‑row кейс, `product-gallery-effect.spec.ts` и `product-gallery-pan.spec.ts` — зелёные.
- [ ] Ручные: (а) два ряда, три картинки в Row 1, одна в Row 2 — каждая строго в своём ряду,
      порядок медиа; (б) очистить Row 2 — ряд пуст, ряд 1 не изменился; (в) `+` третий ряд →
      пустой; загрузка в Row 3 наполняет его; `−` ряд — карточки исчезают, ассеты в дропе
      остаются; (г) скорость/Offset каждого ряда крутятся независимо, как раньше; (д) сцена со
      старыми загрузками пользователя (только legacy‑пул) выглядит как до правки, минус паддинг
      пустых рядов; (е) полностью пустая галерея — авторская витрина; (ж) Reset/Undo/повторное
      открытие восстанавливают по-рядные наборы; (з) Apply → standalone: сайт без медиа показывает
      авторскую витрину (как сегодня), консоль без ошибок.
- [ ] Кросс‑проверка с выполненными Deliveries 35–36: reveal ждёт по-рядное объединение картинок
      (пустые ряды не блокируют показ); авто‑скролл прыгает и по пустым рядам без артефактов.

## 6. Verification note

```md
Verification tier: Tier 2
Reason: Content-model feature across Toolcraft schema (six per-row image drops) and website row resolution; protocol +1; renderer passes/uniforms unchanged; defaults and Rows mode preserved.
Run: focused tsx site tests incl. new row-resolution units; toolcraft focused vitest incl. section tests; the new per-row browser case plus product-gallery-effect and product-gallery-pan; oxfmt on touched files; site lint/build; git diff --check; manual checks §5.
Skip: verify:delivery; verify:perf; export matrices; site typecheck/format (pre-existing blockers, record them).
```

## 7. Риски и что сознательно не делаем

- Медиа‑ассет нельзя перевесить на другой `sourceTarget`: старые загрузки остаются в общем пуле и
  показываются через legacy‑распределение; чтобы разложить их по рядам — пользователь перекладывает
  файлы в Row‑дропы вручную (одноразово). Программную миграцию не делаем.
- Шесть статических дропов — потолок рядов (6) зашит в схему дважды (коллекция + дропы);
  расширение потолка потребует правки обоих мест. Вариант «назначать ряд каждой картинке одним
  дропом» отклонён: `itemControls` у fileDrop документированы только для `assetKind: "file"`.
- Авторские портреты при полностью пустой галерее — осознанное исключение из «только загруженные»
  ради дефолтной витрины, standalone и существующих пиксельных e2e; строгий «пустой дефолт» —
  отдельная доставка с переделкой фикстур всех браузерных кейсов.
- Standalone‑сайт по-прежнему не видит Toolcraft‑медиа (рефы не разрешаются вне iframe) — после
  Apply он показывает авторскую витрину; перенос реальных файлов на сайт — отдельная задача.
- Память GPU: worst case 6 × 8 картинок ≤ 2048px; рекомендация 6 на ряд; decode bounded, новых
  проходов/текстур сверх карточных нет. Performance intent — ordinary-product-work.
- Пустой ряд оставляет видимую «полосу фона» — это ожидаемое следствие сохранения сетки; схлопывать
  сетку по пустым рядам не делаем (сломало бы Offset/Speed нумерацию и период панели).
- Показ каждой картинки строго один раз (без зацикливания вдоль ряда) на замкнутой бесконечной
  панели невозможен; вариант «повторы, разделённые пустыми прокладками» — отдельная доставка по
  запросу, в эту не входит.
