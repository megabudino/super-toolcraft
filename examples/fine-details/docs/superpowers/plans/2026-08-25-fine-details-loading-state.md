# Fine Details — стейт «Loading»: три квадрата-плейсхолдера с шиммером до появления карусели (план реализации)

> **For agentic workers:** план рассчитан на выполнение по задачам (checkbox `- [ ]`) с
> `superpowers:subagent-driven-development` или `superpowers:executing-plans`. Preflight из
> `AGENTS.md` → `docs/toolcraft/workflow.md` (приложение **fine-details**) обязателен. Этот файл —
> единственный документ доставки.
>
> **Контекст.** Сейчас у секции два стейта, синхронизированных между Toolcraft и сайтом:
> `trail` → (сабмит промпта в standalone‑моке `FineDetailsHomepageMock`) → `carousel`. В реальности
> сабмит запускает генерацию, поэтому нужен промежуточный стейт **до появления картинок**:
> «Loading» — **три квадрата** с теми же спеками, что у карточек карусели (текущая
> auto-height геометрия, радиус,
> горизонтальный гап из настроек Carousel), **без тени**, и по ним идёт стандартная
> лоадинг‑анимация — градиент, проходящий **сверху вниз**. В Toolcraft это третий пункт сегмента
> «Images» (третий «таб»/стейт), редактируемый как обычное состояние. Поток становится
> `trail → loading → carousel`. Toolcraft + сайт, протокол приложения `FINE_DETAILS_PREVIEW_VERSION`
> = текущая + 1 (сейчас 7 ⇒ 8; сверить оба конца). Запись в worklog — в формате приложения
> `## Decision Trail: …`. Режим проверки — уточнить; по умолчанию §6. Коммиты — только по явной
> просьбе.

---

## 1. Модель

- **Стейт.** `FineDetailsImagesMode` расширяется до `'carousel' | 'loading' | 'trail'`. В
  Toolcraft сегмент «Images» получает третий пункт в порядке реального потока:
  `Trail | Loading | Carousel`. Loading — полноценный редактируемый стейт: пока он выбран, в
  iframe видны плейсхолдеры, и слайдеры Text gap / Corner radius / Gap карусели действуют на них
  живьём. Старая ссылка на Height была адаптирована: в текущем продукте `carousel.height` удалён,
  а размер карточек автоматически выводится из общей типографической полосы и Text gap.
- **Плейсхолдеры.** Ровно **3 квадрата** (константа `FINE_DETAILS_LOADING_CARD_COUNT = 3`, осознанно не
  привязана к «Images shown» карусели — §7). Каждый: ширина = высота = текущей auto-height
  геометрии общей полосы (с тем же клампом до 800px и Text gap, что у карусели),
  `border-radius = carousel.radius`,
  горизонтальный зазор = `carousel.gap`; **без тени и без рамки**. Ряд центрирован в той же
  полосе между «Try it» и «Your way» (переиспользовать измерение полосы карусели —
  `bandTop`/`bandHeight` с тем же `measurementKey`), слой тот же (обёртка стейт‑перехода,
  `z-[5]`), под промпт‑блоком.
- **Шиммер.** Стандартный skeleton: нейтральная базовая заливка + бегущий сверху вниз градиент.
  CSS‑модуль: фон `linear-gradient(180deg, base 0%, highlight 50%, base 100%)` высотой 200%,
  keyframes двигают `background-position` сверху вниз, `1.6 s linear infinite`, одна фаза у всех
  трёх квадратов. Текущие CSS‑переменные используют непрозрачные нейтральные цвета base
  `#d1d1d1` и highlight `#ededed`. `prefers-reduced-motion` выключает анимацию и gradient image,
  оставляя статичную базовую заливку.
- **Переходы.** `FineDetailsImageStateTransition` уже кросс-фейдит стейты по ключу
  `settings.imagesMode` — добавляется ветка `loading` (длительность как у trail, 0.25 c).
  Standalone‑мок: сабмит промпта ⇒ `'loading'`, затем таймер
  `FINE_DETAILS_HOMEPAGE_LOADING_DURATION_MS = 2600` ⇒ `'carousel'` (именованная константа с комментарием, что в
  реальной интеграции её заменит завершение генерации; очистка таймера при анмаунте; повторный
  сабмит во время loading перезапускает таймер). В Toolcraft переключение стейтов — только
  сегментом, никаких таймеров в редакторе.

## 2. Toolcraft (`recraft-tools/fine-details/`)

- [x] **2.1. `fine-details-carousel-values.ts`** — union режима + `'loading'`; нормализация
      строгая (неизвестное ⇒ `'trail'`). Юнит‑тесты значения.
- [x] **2.2. Секции** (`fine-details-trail-control-sections.ts` / соседний файл карусели):
      сегмент «Images» — три пункта `Trail | Loading | Carousel` (описание: Loading — стейт
      ожидания генерации). Applicability: слайдеры **Text gap / Corner radius / Gap** →
      `oneOf: ['carousel', 'loading']` (грамматика applicability поддерживает `oneOf`,
      schema-reference §175); все остальные контролы карусели (Images shown, Speed,
      hover/drag/download-настройки, если есть) — только `equals: 'carousel'`; Trail‑секции — как
      были (`equals: 'trail'`). Прогнать `app-acceptance.section-dependencies` /
      `control-applicability`.
- [x] **2.3. Протокол** — `FINE_DETAILS_PREVIEW_VERSION` +1 с обеих сторон; payload несёт тот же
      `imagesMode` с новым допустимым значением.
- [x] **2.4. Acceptance/product** — сегмент: третий вариант с product-observable доказательством
      (`data-fine-details-image-state="loading"` + плейсхолдеры в iframe); product‑test читает
      `settings.imagesMode === 'loading'`; inventory секции не меняет состав таргетов (новых
      контролов нет) — обновить только описания, если они перечисляют варианты.
- [x] **2.5. e2e** — кейс `browser: loading state shows three shimmer placeholders`: сегментом
      выбрать Loading ⇒ в iframe `data-fine-details-image-state="loading"`, ровно 3 элемента
      `[data-fine-details-loading-card]`; computed style: `box-shadow: none`, `border-radius`
      равен слайдеру, ширина = высоте; сменить Text gap реальным drag слайдера ⇒ размер меняется;
      анимация активна (computed `animation-name` ≠ none) и keyframes дают вертикальное движение
      вниз, `reducedMotion: 'reduce'` ⇒ none/static background; вернуть Carousel/Trail — прежние
      стейты живы. Отдельный кейс standalone‑мока доказывает submit ⇒ `loading`, перезапуск
      2600ms дедлайна, итоговый `carousel` и очистку при навигации/анмаунте.
- [x] **2.6. Worklog** — `## Decision Trail: Fine Details loading state`: модель §1 (3 фиксированных
      квадрата на спеках карусели, без тени, вертикальный шиммер, мок‑таймер 2.6 с как замена
      будущей генерации), протокол +1, фактические проверки §5, границы §7.

## 3. Сайт (`recraft-v4-styles/src/components/pages/home/`)

- [x] **3.1. `fine-details-settings.ts`** — union `'carousel' | 'loading' | 'trail'`
      (строка ~92), нормализация `imagesMode` (сейчас тернарник ⇒ расширить; неизвестное ⇒
      `'trail'`); тест нормализации.
- [x] **3.2. Новый `fine-details-loading-placeholders.tsx` + css‑модуль** — компонент по §1:
      принимает `carousel`‑настройки (textGap/radius/gap) и `measurementKey`; переиспользует
      измерение полосы карусели (вынести общий хук/утилиту из `fine-details-image-carousel.tsx`
      или её `fine-details-carousel-geometry.ts` — не дублировать ResizeObserver‑логику);
      разметка: обёртка `data-fine-details-loading` + три `div[data-fine-details-loading-card]`
      с инлайн size/radius и классом шиммера; `pointer-events: none` (ховер‑паузы и драг тут не
      нужны); reduced‑motion media‑query в css‑модуле.
- [x] **3.3. `fine-details-image-state-transition.tsx`** — тройной выбор по `imagesMode`:
      `trail` ⇒ trail, `loading` ⇒ `FineDetailsLoadingPlaceholders`, `carousel` ⇒ карусель;
      duration для loading = 0.25.
- [x] **3.4. `fine-details-homepage-mock.tsx`** — `handlePromptSubmit` ⇒ `'loading'` +
      `FINE_DETAILS_HOMEPAGE_LOADING_DURATION_MS` таймер ⇒ `'carousel'`; cleanup в `useEffect`; повторный сабмит
      перезапускает; комментарий про будущую генерацию.
- [x] **3.5. `fine-details-preview-boundary.tsx`** — версия протокола +1; приём `imagesMode`
      без изменений формы.
- [x] **3.6. Контракты** — `fine-details-loading.test.ts`: проверки на
      `FINE_DETAILS_LOADING_CARD_COUNT = 3`, отсутствие box-shadow, вертикальный градиент
      (`180deg`) и keyframes в css‑модуле, reduced‑motion ветку, переиспользование
      band‑измерения; обновить `fine-details-homepage-mock.test.ts` (submit ⇒ loading ⇒ таймер ⇒
      carousel) и тест стейт‑перехода (три ветки). Существующие trail/carousel‑тесты — зелёные.

## 4. Целевое поведение

- **M1** — в Toolcraft сегмент «Images» имеет три стейта; в Loading видны ровно три квадрата на
  спеках карусели (высота/радиус/гап реагируют на слайдеры живьём), без тени, по центру полосы
  между текстами, под промптом; по ним идёт плавный градиентный лоадер сверху вниз.
- **M2** — standalone‑мок: сабмит промпта ⇒ trail плавно сменяется loading, через ~2.6 с ⇒
  carousel; переходы кросс-фейдом как сейчас; reduced motion — мгновенные смены и статичные
  плейсхолдеры.
- **M3** — Trail и Carousel стейты, их контролы, ховер/драг/download карусели — без изменений;
  Apply переносит выбранный стейт в settings-owned Toolcraft preview; standalone‑мок на каждом
  mount начинает с Trail и владеет дальнейшим режимом в рамках сессии. Старые
  сохранённые настройки (без 'loading') работают как раньше.
- **M4** — протокол синхронно поднят; персистенс/Undo сегмента штатные.

## 5. Проверки

- [x] Сайт: focused loading/mock/settings контракты зелёные 19/19; standalone browser lifecycle
      зелёный 1/1; scoped `oxfmt --check` зелёный. `pnpm typecheck` запущен и остаётся заблокирован
      пятью существующими API Section/Fine Details regex/Hero ошибками вне loading‑изменений.
      `pnpm lint` и `pnpm build` здесь не запускались по границе Tier 2; финальный gate остаётся
      родительской проверкой.
- [x] Toolcraft: 32 focused values/sections/applicability/protocol/readiness проверки
      зелёные; единственная 33-я aggregate product assertion по‑прежнему падает на 39
      прежних ошибок;
      aggregate product-worklog validator сохраняет 42 прежние structural‑ошибки исторического
      multi-entry формата, остальные focused worklog rules зелёные 77/77; `pnpm docs:check` зелёный;
      `pnpm typecheck` зелёный; оба точечных browser‑кейса зелёные 2/2. Точный
      `pnpm test:feature -- images.mode` обнаруживает metadata, но до browser startup блокируется
      прежним отсутствующим peer‑тестом `browser: carousel.count changes the embedded Fine Details output`.
      Repository-root `git diff --check` зелёный.
- [ ] Ручные: (а) переключение трёх стейтов сегментом — мгновенно и обратимо; (б) в Loading
      покрутить Text gap/Radius/Gap — квадраты следуют, всегда по центру полосы, на тексты не
      налезают; (в) шиммер ровный, направление сверху вниз, на дефолтном и на тёмном фоне секции
      читается; (г) standalone: сабмит → loading → carousel, а драг промпта в Loading
      остаётся отключён;
      (д) reduced motion; (е) Apply и перезагрузка.

## 6. Verification note

```md
Verification tier: Tier 2
Reason: New third images state in the fine-details app (segmented option + website loading placeholders reusing carousel specs), protocol +1; no new controls, media, or render-pass changes.
Run: focused site tsx tests incl. the placeholder contracts; fine-details vitest incl. section/applicability validators; the two exact browser cases; Toolcraft and site typecheck; scoped oxfmt; git diff --check.
Skip: verify:delivery; verify:perf; export matrices; site lint/build and manual checks §5 in this subtask; record pre-existing validator/typecheck blockers without weakening focused browser proof.
```

## 7. Границы и риски

- Квадратов ровно три (по решению пользователя) и они не привязаны к «Images shown»; если позже
  захочется «лоадеров столько, сколько будет картинок» — это замена одной константы на
  `carousel.count`, отдельной правкой.
- Никаких новых контролов у Loading нет: auto-height от общей полосы и Text gap, радиус и гап
  приходят из настроек карусели — осознанно, чтобы плейсхолдеры всегда совпадали по геометрии с
  будущими карточками. Плановая ссылка на `carousel.height` устарела: текущий продукт удалил этот
  target; возвращать его нельзя. Свой контрол скорости шиммера не делаем (константа в css).
- Цвета шиммера — непрозрачные CSS‑переменные, подобранные под светлый дефолтный фон; чтение на
  необычном тёмном фоне остаётся границей ручного визуального просмотра.
- Мок‑таймер 2.6 с — временная замена реальной генерации; при интеграции API заменяется колбэком
  завершения, стейт‑машина уже готова.
