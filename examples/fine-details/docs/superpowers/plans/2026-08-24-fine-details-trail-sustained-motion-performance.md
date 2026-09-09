# Fine Details — полоса фризов при долгом вождении по шлейфу: лечение (план правок)

> **For agentic workers:** план рассчитан на выполнение по задачам (checkbox `- [ ]`) с
> `superpowers:subagent-driven-development` или `superpowers:executing-plans`. Preflight из
> `AGENTS.md` → `docs/toolcraft/workflow.md` (приложение **fine-details**) обязателен. Этот файл —
> единственный документ доставки.
>
> **Контекст.** Симптом: в секции Fine Details с загруженными картинками при долгом непрерывном
> вождении указателем в какой-то момент начинается полоса тормозов, потом сама проходит.
> **Корректировка диагноза:** первоначальная гипотеза «в iframe уезжают оригиналы вместо
> дериватов» не подтвердилась — Toolcraft-сторона делает настоящие дериваты
> (`fine-details-preview-image-derivative.ts`: кап 800 px по карточной оси, WebP 0.86, кэш по
> `ref:rotation`, отправка один раз, пачками по 4; сайт хранит только их objectUrl). Выявленные
> по source inspection вероятные вклады/кандидаты внутри iframe описаны в §1; их причинность и относительный
> вклад не подтверждены без двух unchecked 60‑секундных трейсов §5. Правки: сайт (store + trail-компонент) + одна
> правка Toolcraft-деривата. Протокол, схема, контролы, визуальный дизайн шлейфа — без изменений.
> Запись в worklog приложения fine-details — в его формате `## Decision Trail: …` (не «Delivery N»,
> как у hero). Режим проверки — уточнить; по умолчанию §6. Коммиты — только по явной просьбе.

---

## 1. Механика симптома (по текущему коду сайта; сверено с версией `fine-details-image-trail.tsx` от 2026‑08‑24 22:00, где появилась ветка авторских дефолтов)

0. **Про next/image (вопрос пользователя).** Для загруженных картинок Next‑оптимизация не
   участвует и участвовать не может: карточки рендерят blob‑URL деривата с `unoptimized: true`
   (оптимизатор Next — серверный и blob не видит); размер держит Toolcraft‑дериват ≤800 px.
   Авторские дефолты (`getFineDetailsDefaultTrailAsset`, `unoptimized: false`) через оптимизатор
   идут, но `width`/`height` в пропсах — intrinsic‑размеры (~1080+), поэтому запрашивается
   вариант почти исходного размера. Холодный `/_next/image` candidate может потребовать
   серверную оптимизацию и заполнение кэша как в dev, так и в production, если вариант ещё
   не кэширован и не прогрет; его влияние на sustained motion не измерено.
1. **Декоды по требованию при цикле по неограниченному набору.** Шлейф берёт картинку для каждой
   новой карточки round‑robin из **всех** загрузок (`imageIndexRef % readyImages.length`,
   `fine-details-image-trail.tsx`), а кап на количество загрузок снят. Карточка — новый
   `<Image unoptimized>` с blob‑URL деривата. По коду первое появление каждого такого изображения
   может потребовать браузерный декод во время маунта, а вытеснение из кэша может привести
   к повторному декоду. При быстром вождении такая работа может кластеризоваться с другой
   main-thread нагрузкой и является source-based кандидатом на вклад в наблюдаемый паттерн, а не
   измеренной причиной; подтверждение остаётся за unchecked 60‑секундными трейсами §5.
2. **Аллокации и ре-таргет анимаций на каждый спавн.** Каждый спавн делает `setCards` ⇒ ре-рендер
   всего списка (8 живых + хвост уходящих через AnimatePresence, fadeOut 400 мс), при этом `rank`
   сдвигается у **каждой** живой карточки ⇒ framer перезапускает scale‑твины у всех карточек до
   ~20 раз/с; на каждый рендер создаются новые объекты style/animate/transition. Постоянный поток
   мусора может увеличивать allocation/GC давление; это второй source-based кандидат, а не
   измеренный источник «полосы».
3. **Дыра для панорам.** Кап деривата действует только по карточной оси
   (`getFineDetailsPreviewImageDimensions`: `scale = min(1, 800 / cardAxis)`) — широкая картинка
   остаётся большой по второй оси: 8000×2000 ⇒ дериват 3200×800 ≈ 10 МБ декода. Несколько таких могут
   увеличивать давление на кэш декодов; влияние на sustained freezes не измерено.
4. **Только в редакторе: ре-рендер всего шлейфа на каждое сообщение указателя.** Toolcraft
   форвардит позицию указателя с канваса в iframe rAF‑троттлингом (~60 сообщений/с,
   `fine-details-preview.tsx` → boundary → `setFineDetailsTrailPointer`), а компонент читает её
   через `useFineDetailsTrailPointer()` = `useSyncExternalStore`, возвращающий **новый объект на
   каждое сообщение** ⇒ весь `FineDetailsImageTrail` (map всех карточек + AnimatePresence +
   диффинг framer‑пропсов) перерендеривается ~60 раз/с всё время, пока водишь. На standalone‑сайте
   этой React‑нагрузки по коду нет: DOM `pointermove` идёт мимо React прямо в motion values. Эта
   разница делает editor bridge ещё одним source-based кандидатом; фактическое относительное влияние не измерено.

## 2. Сайт (`recraft-v4-styles/src/components/pages/home/`)

- [x] **2.0. Мостовой указатель — императивно, без ре-рендера (лечит §1.4).** В
      `fine-details-image-trail.tsx` убрать `useFineDetailsTrailPointer()` из тела компонента;
      вместо него в `useEffect` подписаться напрямую:

      ```ts
      useEffect(() => {
        let bridgeActive = false;
        const sync = () => {
          const pointer = getFineDetailsTrailPointerSnapshot();
          if (pointer.active) {
            bridgeActive = true;
            setTouchSource(false);
            updatePointer({ x: pointer.x, y: pointer.y });
          } else if (bridgeActive) {
            bridgeActive = false;
            setPointerInactive();
          }
        };
        sync();
        return subscribeFineDetailsTrailPointer(sync);
      }, [setPointerInactive, updatePointer]);
      ```

      Координаты уходят в motion values без React‑состояния (как у DOM‑пути); setState остаются
      только на редких сменах статуса (уже с bail‑out по равному значению). Существующий
      `fine-details-image-trail-prompt-focus.test.ts` и paused/suppressed‑поведение не меняются.
      Контракт: в тесте моста/шлейфа заассертить `subscribeFineDetailsTrailPointer(` в
      component‑source и отсутствие `useFineDetailsTrailPointer(` в нём.
- [x] **2.1. Прогрев декодов при приёме — `fine-details-trail-media-store.ts`.** После перевода
      entry в `ready` (в `decodeEntry`) прогреть браузерный кэш декодов вне жеста:

      ```ts
      const warmup = new Image();
      warmup.decoding = 'async';
      warmup.src = entry.objectUrl;
      void warmup.decode().catch(() => {});
      entry.warmup = warmup; // держим ссылку, пока entry жив
      ```

      Поле `warmup?: HTMLImageElement` добавить в `FineDetailsTrailMediaEntry`; обнулять при
      удалении entry (GC‑ветка `markFineDetailsTrailMediaRefsUsed` и замена по ref в
      `ingestFineDetailsTrailMedia`). Прогревать **последовательно** (очередь по одному, как
      завершится предыдущий), чтобы приём 30+ картинок не дал собственную полосу фризов.
      Новый контракт `fine-details-trail-media-warmup.test.ts`: регексы на `warmup.decode()`,
      последовательную очередь и очистку `warmup` при удалении entry.
- [x] **2.2. Дешёвый спавн — `fine-details-image-trail.tsx`.** Визуал не менять; снизить работу и
      мусор на спавн:
      - вынести карточку в отдельный компонент `TrailCardView`, обёрнутый в `React.memo`;
        пропсы — примитивы и стабильные объекты: `card` (неизменяемый), `image`, `media`,
        `rankScale`, `cardSize`, `cardRadius`, `boxShadow`, `borderColor`, `borderWidth`,
        `fadeIn`, `fadeOut`. Ре-рендер списка при спавне тогда пересобирает только карточки с
        изменившимся `rankScale`, остальное отсекает memo;
      - объект `transition` и статичные части `style`/`initial`/`exit` мемоизировать
        (`useMemo` от `fadeIn`/`fadeOut`/размеров), чтобы не создавать их на каждый рендер каждой
        карточки;
      - для авторских дефолтов (`defaultAsset`, `unoptimized: false`) класть в объект `media`
        не intrinsic‑размеры, а отображаемые × 2 (округлённые от `imageWidth`/`imageHeight`, с
        сохранением аспекта) — тогда `height={media.height}`/`width={media.width}` остаются как
        есть (контракт `fine-details-image-trail-image.test.ts` не ломается), а оптимизатор Next
        начинает отдавать вариант под реальный размер карточки, а не ~1080 px; загрузки
        (`unoptimized: true`) не трогать;
      - существующие контракты (`fine-details-image-trail-image.test.ts` — Next Image +
        `unoptimized`; `fine-details-image-trail-motion.test.ts` — LazyMotion/domAnimation/m.div)
        должны остаться зелёными: структура `<LazyMotion><m.div><Image/></m.div></LazyMotion>`
        сохраняется, меняется только разбиение на компоненты; если регексы у тестов завязаны на
        соседство строк — обновить регексы, не ослабляя утверждений.
- [x] **2.3. Ничего больше на сайте не менять:** спавн-цикл, spacing/lifetime/AnimatePresence,
      статусы, suppressed‑логика промпта — как есть.

## 3. Toolcraft (`recraft-tools/fine-details/`)

- [x] **3.1. Кап деривата по обеим осям — `src/app/fine-details-preview-image-derivative.ts`.**
      Добавить `export const FINE_DETAILS_PREVIEW_IMAGE_LONG_AXIS_PX = 1600;` и в
      `getFineDetailsPreviewImageDimensions` считать
      `scale = Math.min(1, CARD_AXIS / cardAxis, LONG_AXIS / longAxis)`, где
      `longAxis = Math.max(safeWidth, safeHeight)`. Обычные фото не меняются (у них длинная ось ≤
      2×карточной после капа 800), панорама 8000×2000 ⇒ ≤1600×400. Обновить
      `fine-details-preview-image-derivative.test.ts`: кейсы обеих осей, порядок ротации,
      `resized`‑флаг.
- [x] **3.2. Ключ кэша/`sentKeys` не меняются; уже открытые сессии сохранят старые отправленные
      дериваты до перезагрузки страницы Toolcraft — зафиксировать в worklog как известное
      ограничение (пересчёт при следующем открытии).
- [x] **3.3. Worklog** приложения fine-details — запись `## Decision Trail: sustained trail
      motion performance`: корректировка диагноза (дериваты были настоящими; причины — декоды по
      требованию + аллокации/ре-таргет + панорамная ось), решение §2–§3, фактические проверки §5,
      риски §7.

## 4. Целевое поведение

- **M1** — при 20+ загруженных фото (включая 1–2 панорамы) непрерывное быстрое вождение 60+ секунд
  не даёт полосы фризов **ни в редакторе Toolcraft, ни на standalone‑сайте**: после первых секунд
  нет кадров дольше ~50 мс (Performance‑трейс), субъективно шлейф не «залипает»; чистое движение
  без спавна больше не рендерит React‑дерево шлейфа в редакторе; при CPU 4× throttling мягче, но
  без затяжной полосы.
- **M2** — визуал шлейфа не изменился: те же spacing/lifetime/fade/tilt/falloff, тени, порядок
  картинок, exit‑анимации; настройки Toolcraft работают как раньше.
- **M3** — приём медиа (первая загрузка 30 картинок) не фризит iframe: прогрев последовательный,
  фоновый.
- **M4** — панорамные загрузки дают дериват ≤1600 px по длинной стороне; обычные фото — байт в
  байт прежние дериваты (тот же scale‑путь).
- **M5** — протокол, схема, контролы, персистенс — без изменений.

## 5. Проверки

- [x] Сайт: RED → GREEN новый `fine-details-trail-media-warmup.test.ts`; существующие
      `fine-details-image-trail-image/-motion/-prompt-focus`, `fine-details-trail-card-border/
      -radius`, `fine-details-unbounded-images`, `fine-details-draggable-prompt` — зелёные
      (команда — `pnpm dlx tsx --test` по фактическому списку файлов); focused `oxfmt`;
      `pnpm lint`; `pnpm build`; `git diff --check`.
- Verification result: 10-file focused suite passed 20/20; focused `oxfmt --check` passed on
  13 performance-scoped files; `pnpm lint` exited 0 with two unrelated Hero warnings; `pnpm build`
  passed with the recorded metadata/tracing warnings. `git diff --check` is recorded in the final
  self-review.
- [x] Toolcraft fine-details: focused derivative test and the existing preview protocol/media-message
      bridge test pass; `pnpm typecheck` passes.
- Verification result: derivative passed 15/15. The combined derivative + preview product file run
  also exposed two unrelated current-default/acceptance baseline failures; the exact bridge/media-message
  filter passed 1/1 with six unrelated tests skipped. This package has no local `oxlint`/`oxfmt`
  scripts or binaries (`pnpm exec ... --version` reported command not found).
- [ ] Toolcraft browser media case: not run. It was outside the allowed focused final command set,
      and the worklog already records the separate known default-assets uploader baseline; no browser
      media result is claimed.
- [ ] Ручные (профилирование обязательно, **в двух средах**): (а) загрузить 20–30 крупных фото +
      1–2 панорамы; Performance‑запись 60 с непрерывного вождения **по канвасу Toolcraft**
      (мостовой путь — до правки там был ре-рендер ~60/с) и отдельно **на standalone‑сайте**:
      long tasks > 50 мс только в первые секунды прогрева, дальше ровно в обеих средах; после
      §2.0 в трейсе редактора нет React‑рендеров шлейфа на чистом движении без спавна;
      (б) то же с CPU 4× throttling; (в) удалить часть картинок → прогретые
      `warmup`‑ссылки освобождены (нет роста detached‑элементов в снапшоте памяти); (г) первая
      загрузка пачки: iframe не фризит, шлейф доступен сразу, картинки включаются по мере
      готовности; (д) панорама в шлейфе выглядит как раньше (резкость на cardSize 160–400
      достаточна); (е) промпт‑фокус/подавление шлейфа и standalone‑сайт — без изменений.
- Not run: the apps were already listening on ports 3000 and 3001, but no existing non-mutating
  infrastructure could load the required 20–30 photos plus panoramas and capture both 60-second
  traces, CPU 4× run, and memory snapshot without adding test/product files. No no-freeze, long-task,
  React-render-count, CPU, or detached-element claim is made.
- [ ] Если после §2–§3 полоса всё же воспроизводится на целевой машине — зафиксировать трейс в
      worklog и остановиться: следующий шаг (императивный пул карточек без React‑рендера на спавн)
      — отдельная доставка, в эту не входит.
- Not evaluated because the required manual profiling was not run.

## 6. Verification note

```md
Verification tier: Tier 2
Reason: Performance-only correction of the Fine Details trail (imperative bridge-pointer subscription, website store warmup, memoized card subtree, display-sized default-asset variants) and a two-axis derivative cap in the fine-details Toolcraft app; no protocol, schema, control, or visual-design change.
Run: focused tsx site tests incl. the new warmup contract; fine-details derivative unit tests; oxfmt on touched files; site lint/build; git diff --check; manual profiling checks §5 (60 s continuous-motion trace, 4x CPU throttle, memory snapshot).
Skip: verify:delivery; verify:perf (formal measured-performance authority not requested — manual traces only); export matrices; site typecheck/format if pre-existing blockers exist (record them).
```

Actual verification, 2026-08-25: focused code checks, website lint/build, Toolcraft typecheck,
Toolcraft focused tests, docs check, and repository diff whitespace validation were used for this
handoff. Manual 60-second traces in both environments, CPU 4× throttling, memory profiling,
`verify:delivery`, `verify:perf`, full audit, and broad browser/export matrices were not run. The
passed focused checks are functional/source-contract evidence only, not measured performance proof.

## 7. Риски и что сознательно не делаем

- Прогрев пытается заранее подготовить декоды, но браузерный кэш вправе их вытеснять, поэтому при
  экстремальном числе загрузок повторные декоды возможны. Кап WebP ≤1600 px и последовательный прогрев предназначены
  для снижения этого риска, но фактическая стоимость декодов и отсутствие «полосы» не доказаны до ручных
  трейсов. Жёсткий пиннинг (canvas/ImageBitmap на карточку) не делаем — это память × N и другой рендер‑путь.
- `React.memo` не убирает перезапуск scale‑твинов у живых карточек (rank сдвигается по дизайну
  falloff) — это осталось осознанно; если профиль покажет, что твины доминируют, перевод falloff
  на CSS‑переменную без ре-таргета — следующая доставка.
- Мемоизация и стабильные объекты предназначены для снижения allocation/GC давления, но фактическое изменение GC‑пауз не
  измерено. Целевые замеры M1 делать на прод‑сборке сайта (`pnpm build && pnpm start` или standalone), dev — только как дым‑тест.
- Двухосевой кап меняет дериваты только у экстремально широких/высоких исходников; открытые сессии
  Toolcraft досылают новые дериваты только после перезагрузки страницы (sentKeys живёт в сессии).
- Разница сред остаётся по конструкции: в редакторе указатель едет через postMessage‑мост с
  rAF‑троттлингом, на сайте — нативные события; после §2.0 оба пути кормят одни и те же motion
  values без React‑рендера на движение, но микрозадержка моста (~1 кадр) в редакторе — норма.
- Авторские дефолты идут через `/_next/image`; необходимый public-URL candidate не обязательно преднарезан в production.
  Холодный запрос может потребовать оптимизацию и заполнение кэша в dev или production, если candidate не был кэширован
  или прогрет; влияние на sustained motion не измерено.
