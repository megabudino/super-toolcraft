# Hero Gallery — сцена появляется одним готовым кадром: без плоской заглушки на старте, быстрый плавный reveal (план правок)

> **For agentic workers:** план рассчитан на выполнение по задачам (checkbox `- [ ]`) с
> `superpowers:subagent-driven-development` или `superpowers:executing-plans`. Preflight из
> `AGENTS.md` → `docs/toolcraft/workflow.md` обязателен. Этот файл — единственный документ доставки.
>
> **Контекст.** При загрузке Sphere пользователь сначала видит плоские карточки, и только потом они
> «становятся выпуклыми». Причина найдена (переписка 2026‑08‑24): плоская стадия — это DOM‑заглушка
> `data-hero-gallery-fallback` в `hero-sphere-gallery.tsx`, задуманная для браузеров без WebGL, но
> показываемая **по умолчанию**: начальное состояние `renderer: 'fallback'` попадает и в SSR‑HTML, а
> переключение на `webgl` происходит только на тике `setInterval(…, 250)` после гидратации. После
> скрытия заглушки выпуклые карточки допоявляются поштучно, потому что `drawScene` пропускает
> карточку без готовой текстуры, а текстуры декодируются асинхронно. Решение пользователя: сцену
> показывать **только когда она готова целиком**, появление — быстрое и плавное (fade). Правка —
> только сайт (`recraft-v4-styles`), протокол v15, схема и контролы Toolcraft не меняются. Номер
> записи worklog — следующий свободный (сейчас 35, перепроверить). Режим проверки — уточнить; по
> умолчанию §6. Коммиты — только по явной просьбе пользователя.

---

## 1. Целевая механика

1. Плоская заглушка рендерится **только при доказанном отсутствии WebGL** (создание рендерера
   бросило исключение, потерян контекст, не собрались FBO). На сервере и до пробы — ничего.
2. WebGL‑canvas держится прозрачным (`opacity: 0`) и включается одним fade ~180 мс, когда
   **все стартовые текстуры устоялись** (`ready` или `error`) и рендерер готов. Страховка: если
   какая‑то текстура не устоялась за 3 с — показываем всё равно (недогруженные карточки допоявятся
   как сейчас, но уже внутри показанной сцены).
3. Переключение состояний — без таймерной задержки: пуш‑уведомление из кэша текстур + синхронное
   чтение состояния сразу после создания рендерера. Интервал 250 мс остаётся только фоновым
   рефрешем диагностики (`phases`/`turns`).
4. Чтобы окно «фон без сцены» было коротким: `image.decode()` вместо `onload` (декод вне главного
   потока) и preload авторских карточек через `react-dom` `preload()` — раньше их скачивание
   провоцировала сама плоская заглушка (`<Image>`), после её удаления preload обязателен, иначе
   старт станет медленнее.

## 2. Сайт (`recraft-v4-styles/src/components/pages/home/`)

- [x] **2.1. `hero-sphere-gallery-textures.ts`**
  - `loadSourceImage` — декод через `image.decode()` (ветка `source.bitmap` без изменений):

    ```ts
    const image = new Image();
    image.decoding = 'async';
    image.src = source.textureUrl ?? source.url;
    image.decode().then(
      () => resolve(image),
      () => {
        if (image.complete && image.naturalWidth > 0) resolve(image);
        else reject(new Error(`Could not load hero gallery source ${source.id}.`));
      },
    );
    ```

  - Сигнатура фабрики: `createHeroSphereTextureCache(gl, schedule, onSettled?: () => void)`; в
    `ensure` в обеих ветках промиса после присвоения `entry.status` и вызова `schedule()` добавить
    `onSettled?.();`.
  - В интерфейс кэша добавить `getSettledSourceIds(sources): string[]` — id источников со статусом
    `'ready'` **или** `'error'` (симметрично `getReadySourceIds`).

- [x] **2.2. `hero-sphere-gallery-webgl.ts`**
  - В `HeroSphereGalleryRendererState`: `renderer: 'fallback' | 'pending' | 'webgl'` (значение
    `'pending'` использует только компонент до пробы; `getState()` его никогда не возвращает) и
    новое поле `settledIds: readonly string[]`.
  - `let stateListener: (() => void) | null = null;`; оба места создания кэша (старт и
    `handleContextRestored`) — `createHeroSphereTextureCache(gl, schedule, () => stateListener?.())`.
  - В API рендерера: `setStateListener(listener: (() => void) | null): void`.
  - `getState()` дополнительно возвращает `settledIds: textures.getSettledSourceIds(sources),`.

- [x] **2.3. `hero-sphere-gallery.tsx`** — ядро правки:
  - `import { preload } from 'react-dom';`
  - Константы:

    ```tsx
    const pendingRendererState: HeroSphereGalleryRendererState = {
      effect: 'post',
      phases: [],
      readyIds: [],
      renderer: 'pending',
      settledIds: [],
      turns: 0,
    };
    const revealTimeoutMs = 3000;
    ```

    `fallbackRendererState` остаётся (добавить `settledIds: []`) — он теперь означает именно
    «WebGL недоступен».
  - Начальное состояние: `useState<HeroSphereGalleryRendererState>(pendingRendererState)`; в
    mount‑эффекте стартовый сброс — тоже `setRendererState(pendingRendererState)`; ветка `catch`
    остаётся с `setRendererState(fallbackRendererState)` (это единственный вход в плоскую
    заглушку, плюс поздний `'fallback'` из `getState()` при потере контекста). Массив зависимостей
    эффекта `}, [HERO_DISPERSION_POST_FRAGMENT_SHADER]);` не менять — на нём контракт Fast Refresh.
  - Сразу после существующего вызова `syncSize();` добавить две строки:

    ```tsx
    syncSize();
    renderer.setStateListener(() => setRendererState(renderer.getState()));
    setRendererState(renderer.getState());
    ```

    В cleanup эффекта перед `renderer.dispose()` — `renderer.setStateListener(null);`.
  - Reveal‑состояние (после вычисления `ready`):

    ```tsx
    const settledSet = new Set(rendererState.settledIds);
    const settled = imageOrder.every((id) => settledSet.has(id));
    const [revealed, setRevealed] = useState(false);
    useEffect(() => {
      if (revealed || rendererState.renderer !== 'webgl') return;
      if (settled) {
        setRevealed(true);
        return;
      }
      const timer = window.setTimeout(() => setRevealed(true), revealTimeoutMs);
      return () => window.clearTimeout(timer);
    }, [revealed, rendererState.renderer, settled]);
    ```

    `revealed` — липкий до анмаунта: последующие замены картинок из Toolcraft сцену не прячут.
    Пустой список источников ⇒ `settled = true` ⇒ показ сразу после готовности WebGL.
  - Canvas — плавное появление и наблюдаемость:

    ```tsx
    data-hero-gallery-revealed={revealed ? 'true' : 'false'}
    style={{ opacity: revealed ? 1 : 0, transition: 'opacity 180ms ease-out' }}
    ```

    (остальные атрибуты canvas, включая `data-dispersion-ready`, без изменений; семантика
    `data-hero-gallery-ready` на корне не меняется — это по‑прежнему «все текстуры ready»).
  - Preload авторских источников — в теле компонента при рендере:

    ```tsx
    for (const source of sources) {
      if (source.url.startsWith('/')) {
        preload(source.textureUrl ?? source.url, { as: 'image' });
      }
    }
    ```

    (react-dom дедуплицирует; медиа из Toolcraft приходят с `bitmap`/blob‑URL и в ветку не
    попадают; React 19 эмитит `<link rel="preload">` и при SSR — проверить в HTML ответа).
  - Разметка заглушки не меняется; условие показа остаётся `renderer === 'fallback'`, которое
    теперь недостижимо без реальной пробы.

- [ ] **2.4. `hero-scene-settings.ts`** — в `HeroGalleryRenderState.renderer` расширить союз:
  `'fallback' | 'pending' | 'webgl'` (строка ~128). Проверить `grep -rn "data-hero-gallery-renderer"`
  в обеих репах: ожидание везде «дождаться `webgl`», транзитный `pending` никого не ломает —
  зафиксировать результат grep в worklog.

  Этот исходный пункт намеренно оставлен незакрытым после review: `pending` реализован только в
  локальном состоянии компонента и не передаётся через `HeroGalleryRenderState`/протокол v15,
  валидаторы которого по-прежнему принимают только итоговые `fallback | webgl`. Grep и контракт
  транспорта подтверждают эту безопасную границу.

- [x] **2.5. Контракты — `hero-sphere-gallery-lifecycle.test.ts`** (файл уже читает
  `componentSource` и `rendererSource`; сначала RED, потом GREEN):

  ```ts
  test('the flat fallback renders only after a failed WebGL probe', () => {
    assert.match(componentSource, /useState<HeroSphereGalleryRendererState>\(pendingRendererState\)/);
    assert.match(componentSource, /renderer: 'pending',/);
    assert.match(componentSource, /catch \{\s*setRendererState\(fallbackRendererState\);/);
    assert.match(
      componentSource,
      /syncSize\(\);\s*renderer\.setStateListener\(\(\) => setRendererState\(renderer\.getState\(\)\)\);\s*setRendererState\(renderer\.getState\(\)\);/,
    );
    assert.doesNotMatch(componentSource, /useState<HeroSphereGalleryRendererState>\(fallbackRendererState\)/);
  });

  test('the scene reveals once as one settled frame with a bounded wait', () => {
    assert.match(componentSource, /const revealTimeoutMs = 3000;/);
    assert.match(componentSource, /const settled = imageOrder\.every\(\(id\) => settledSet\.has\(id\)\);/);
    assert.match(componentSource, /window\.setTimeout\(\(\) => setRevealed\(true\), revealTimeoutMs\)/);
    assert.match(componentSource, /opacity: revealed \? 1 : 0, transition: 'opacity 180ms ease-out'/);
    assert.match(componentSource, /data-hero-gallery-revealed=\{revealed \? 'true' : 'false'\}/);
    assert.match(componentSource, /preload\(source\.textureUrl \?\? source\.url, \{ as: 'image' \}\)/);
    assert.match(rendererSource, /settledIds: textures\.getSettledSourceIds\(sources\),/);
  });

  test('texture decode settles through image.decode with a completed-image fallback', () => {
    const texturesSource = readFileSync(
      new URL('./hero-sphere-gallery-textures.ts', import.meta.url),
      'utf8',
    );
    assert.match(texturesSource, /image\.decode\(\)\.then\(/);
    assert.match(texturesSource, /image\.complete && image\.naturalWidth > 0/);
    assert.match(texturesSource, /getSettledSourceIds/);
  });
  ```

  Существующие контракты (Fast Refresh в `hero-dispersion-post-shader.test.ts`, зависимость
  эффекта, GL‑cleanup lifecycle‑тестов) должны остаться зелёными без правок; если oxfmt разобьёт
  прописанные строки иначе — сперва поправить регексы под фактический форматтер, не ослабляя их.

## 3. Toolcraft (`recraft-tools/hero/`)

Схема, протокол (v15), контролы, пайплайны — **без изменений**. Только:

- [x] Проверить grep’ом, что e2e не завязаны на старое поведение «заглушка видна до webgl»
      (`data-hero-gallery-fallback` в e2e не упоминается; `data-hero-gallery-renderer` везде
      ожидает итоговое `webgl`); хелпер `waitForWebsitePreview` ждёт `data-hero-gallery-ready="true"`
      — семантика не изменилась.
- [x] Запись Delivery 35 в `docs/toolcraft/agent-worklog.md`: причина (SSR/дефолтная заглушка +
      таймер 250 мс + поштучные текстуры), решение (заглушка только при реальном отсутствии WebGL,
      reveal одним кадром с fade 180 мс и страховкой 3 с, `image.decode`, preload), явное указание,
      что снапшот‑протокол и пиксельные e2e читают GL‑буфер и от `opacity` не зависят, фактические
      проверки §5, компромисс про no‑JS (§6 риски).

## 4. Целевое поведение

- **M1** — при загрузке standalone‑сайта и Toolcraft‑iframe плоские карточки не появляются ни на
  один кадр: фон → один плавный fade (~180 мс) целиком готовой выпуклой сцены на своих местах.
- **M2** — на медленной сети сцена ждёт готовности, но не дольше ~3 с после готовности WebGL;
  после принудительного показа догружающиеся карточки допоявляются уже внутри видимой сцены.
- **M3** — при реальном отсутствии WebGL (проба бросила исключение / контекст потерян) плоская
  заглушка показывается, как и раньше.
- **M4** — Fast Refresh и смена типа Rows↔Sphere не дают плоской вспышки (максимум — повторный
  короткий fade). Rows‑режим и Apply → standalone не меняются.
- **M5** — семантика `data-hero-gallery-ready`, снапшот‑протокол, пиксельные e2e и производительность
  проходов не меняются; добавленный `data-hero-gallery-revealed` — только наблюдаемость.

## 5. Проверки

- [x] Сайт: RED → GREEN `pnpm dlx tsx --test src/components/pages/home/hero-sphere-gallery-lifecycle.test.ts src/components/pages/home/hero-dispersion-post-shader.test.ts src/components/pages/home/hero-sphere-gallery-motion.test.ts src/components/pages/home/hero-scene-settings.test.ts src/components/pages/home/hero-sphere-layout-phase.test.ts src/components/pages/home/hero-sphere-layout-visibility.test.ts`;
      focused `oxfmt` на затронутых файлах; `pnpm lint`; `pnpm build`; `git diff --check`
      (typecheck/format — pre‑existing блокеры, зафиксировать).
- [ ] Ручные: (а) жёсткая перезагрузка standalone и Toolcraft‑iframe (обычная сеть и DevTools
      Slow 3G, пустой кэш): плоских карточек нет ни в одном кадре, сцена появляется одним fade;
      на Slow 3G — не дольше ~3 с ожидания после старта WebGL; (б) в SSR‑HTML ответа сервера нет
      разметки заглушки и есть `<link rel="preload">` на авторские карточки; (в) проверка ветки
      отсутствия WebGL: временно бросить исключение первой строкой
      `createHeroSphereGalleryRenderer`, увидеть плоскую заглушку, откатить правку и убедиться по
      `git diff`, что временная строка удалена; (г) Fast Refresh правка шейдера — без плоской
      вспышки; (д) загрузка своих изображений через Toolcraft: сцена не прячется, новые карточки
      появляются в видимой сцене; (е) Rows‑режим и Apply → standalone.

  Выполнены normal reload, детерминированный эквивалент медленной/неустоявшейся загрузки с
  таймаутом, SSR, временный no‑WebGL probe с полным откатом, Rows и ручной Apply. Отдельный
  визуальный прогон shader Fast Refresh и загрузка своих изображений не выполнялись, поэтому весь
  составной пункт остаётся незакрытым; sticky source replacement покрыт исполняемыми контрактами.
- [x] Toolcraft browser: `browser: dispersion.velocity changes the embedded hero output` и любой
      кейс со снапшотом (например, существующий pixel‑кейс боковых зон) — зелёные без правок.

## 6. Verification note

```md
Verification tier: Tier 2
Reason: Website-only startup/reveal change of the Sphere gallery component and texture cache; no schema, protocol, pass, uniform, or workload-dimension change.
Run: focused tsx site tests (lifecycle RED→GREEN, shader/motion/settings/layout green); oxfmt on touched files; site lint/build; git diff --check; the dispersion.velocity browser case plus one snapshot-based case; manual checks §5 incl. Slow 3G, SSR HTML, and the temporary no-WebGL probe.
Skip: verify:delivery; verify:perf; export matrices; site typecheck/format (pre-existing blockers, record them).
```

## 7. Риски и компромиссы

- Посетитель совсем без JS больше не увидит плоскую сетку карточек (раньше её давал SSR) — только
  фон и заголовок. Принято пользователем в обмен на отсутствие плоской вспышки; при отсутствии
  WebGL с работающим JS заглушка остаётся.
- LCP страницы смещается с картинок заглушки на заголовок/фон; preload сохраняет ранний старт
  скачивания тех же картинок, так что итоговое время до готовой сцены не ухудшается — при ручной
  проверке сравнить субъективное время до сцены с текущим поведением.
- `image.decode()` в редких браузерных кейсах отклоняется при успешно загруженной картинке —
  покрыто фолбэком `image.complete && naturalWidth > 0`.
- Страховка 3 с: при битой картинке (`error`) сцена покажется без этой карточки — как и сейчас,
  только без плоской стадии; таймер не крутится, пока WebGL не готов.
- Повторный fade при ремоунте (смена типа галереи, Fast Refresh) — осознанная простота; кэш
  текстур живёт в рендерере и умирает с ним, «тёплый» ремоунт не мгновенен.
