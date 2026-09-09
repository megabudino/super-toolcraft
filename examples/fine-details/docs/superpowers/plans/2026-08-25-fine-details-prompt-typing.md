# Fine Details — «печатающий» промпт в стейте Trail: фразы с человеческим набором и удалением, настройка из Toolcraft (план реализации)

> **For agentic workers:** план рассчитан на выполнение по задачам (checkbox `- [ ]`) с
> `superpowers:subagent-driven-development` или `superpowers:executing-plans`. Preflight из
> `AGENTS.md` → `docs/toolcraft/workflow.md` (приложение **fine-details**) обязателен. Этот файл —
> единственный документ доставки.
>
> **Контекст.** В промпт‑блоке секции Fine Details, пока пользователь не сфокусировал инпут,
> должна идти анимация: фразы печатаются и удаляются по кругу, с нелинейностью набора «как
> человек печатает». Требования пользователя: список фраз редактируется в Toolcraft через `+`/`−`
> (появляются текстовые инпуты на каждую фразу); отдельная секция настраивает характер анимации и
> тайминги, характер удаления и нелинейность; анимация включаемая/выключаемая; работает **только в
> стейте `trail`** (до сабмита) и останавливается при фокусе инпута. Toolcraft + сайт, протокол
> приложения `FINE_DETAILS_PREVIEW_VERSION` = текущая + 1 (сверить фактическую: на момент
> написания 7, доставка Loading могла поднять до 8). Запись в worklog — `## Decision Trail: …`.
> Режим проверки — уточнить; по умолчанию §6. Коммиты — только по явной просьбе.

---

## 1. Модель

- **Данные.** `prompt.typing = { enabled, phrases, typeSpeed, deleteSpeed, hold, gap, humanize,
  deleteStyle }`:
  - `enabled` — свитч, дефолт **выкл** (прод не меняется до осознанного включения);
  - `phrases` — массив строк, 1–8 штук (`collectionActions` c текстовым `itemControl` — «одно
    однородное повторяемое значение» по schema-reference; `+` добавляет пустую строку‑инпут,
    `−` убирает последнюю; пустые строки при воспроизведении пропускаются; дефолт — одна фраза,
    совпадающая с текущим `defaultPrompt` промпта);
  - `typeSpeed` — скорость набора, зн./с (3–30, дефолт 12); `deleteSpeed` — скорость удаления
    backspace, зн./с (5–60, дефолт 30);
  - `hold` — пауза с готовой фразой до начала удаления, с (0.2–6, дефолт 1.8); `gap` — пауза
    после удаления до следующей фразы, с (0–3, дефолт 0.6);
  - `humanize` — нелинейность 0–1 (дефолт 0.6): пер‑символьная дельта задержки и редкие
    «задумался»‑паузы (§ движок);
  - `deleteStyle` — сегмент «Backspace | Instant»: посимвольное стирание со скоростью
    `deleteSpeed` или одно мгновенное очищение после `hold`.
- **Поведение на сайте.** Анимация активна только когда: `enabled`, `imagesMode === 'trail'`,
  инпут не в фокусе, пользователь не ввёл собственный текст (значение инпута пустое) и не
  `prefers-reduced-motion`. Фокус (focusin) мгновенно прячет анимацию; blur с пустым инпутом
  возобновляет цикл после `gap`; введённый пользователем текст выключает её до очистки поля.
  Reduced motion ⇒ статично показана первая фраза целиком (без печати и курсора). Переход в
  `loading`/`carousel` останавливает и прячет анимацию (стейт‑гейт), возврат в `trail` —
  возобновляет с первой фразы.
- **Рендер.** Печатаемый текст — визуальный слой, а не значение инпута: внутри
  `AiPromptInput` добавить **опциональный** проп `ghost?: { text: string; caret: boolean }` —
  aria‑hidden оверлей с той же типографикой/паддингами, что у текста инпута, плюс мигающий
  каретка‑символ (CSS `steps`‑blink ~1 с). Оверлей скрывается при фокусе или непустом значении.
  Реальный `placeholder`/aria‑атрибуты не трогаем (доступность стабильна); hero и другие
  использования `AiPromptInput` без пропа не меняются ни на пиксель — проверить его текущую
  структуру по месту и не ломать существующий API.
- **Движок набора** — чистая, детерминируемая машина в `fine-details-prompt-typing.ts` (сайт),
  вся случайность через переданный `random: () => number`:

  ```ts
  interface FineDetailsPromptTypingState {
    charIndex: number;
    mode: 'deleting' | 'gap' | 'holding' | 'typing';
    phraseIndex: number;
    text: string;
    waitSeconds: number;
  }
  advancePromptTyping(state, dtSeconds, config, phrases, random) => state
  ```

  Тайминги: задержка i‑го символа набора = `(1 / typeSpeed) · (1 + humanize · j)`, где `j` —
  выборка из `[-0.55, +1.1]` от `random` (быстрые серии и запинки); с вероятностью
  `0.03 · humanize` на символ — дополнительная пауза 0.4–1.0 с («задумался»); после пробела
  чуть быстрее, перед пробелом чуть медленнее (лёгкая пословная ритмика — по одному множителю,
  не усложнять). Удаление: равномерно `1 / deleteSpeed` (человек стирает ровно) либо `Instant`.
  Цикл: `typing → holding(hold) → deleting|instant → gap(gap) → следующая фраза` по кругу.
  Драйвер — rAF только пока анимация активна (без таймеров в фоне; вкладка скрыта ⇒ rAF стоит —
  этого достаточно).

## 2. Toolcraft (`recraft-tools/fine-details/`)

- [ ] **2.1. Values** — новые таргеты `prompt.typing.enabled / .phrases / .typeSpeed /
      .deleteSpeed / .hold / .gap / .humanize / .deleteStyle`; типы/дефолты/клампы по §1;
      `phrases` — массив строк с обрезкой по длине текстового контрола (лимит по правилам
      `text`‑контролов приложения, например 200 зн.) и `hardMaxItems: 8`, `minItems: 1`.
      Юнит‑тесты значений (клампы, не‑строки в phrases ⇒ отфильтрованы, NaN ⇒ дефолт).
- [ ] **2.2. Секция «Prompt Typing»** (рядом с существующими Prompt‑секциями, свой entityId
      `fine-details-prompt-typing`, applicability секции — `equals: 'trail'` по
      `images.mode`, как у Trail‑секций): свитч «Typing animation»; `collectionActions`
      «Phrases» (`itemLabel: "Phrase"`, текстовый itemControl); слайдеры «Type speed» (зн/с),
      «Delete speed» (зн/с, applicability `deleteStyle = backspace`), «Hold» (s), «Gap» (s),
      «Humanize» (0–1); сегмент «Delete style» (`Backspace | Instant`). Зависимые контролы —
      applicability по `enabled = true`. Всего 8 контролов ⇒ проверить порог semanticGroup
      (≥ 8 — если правило требует, задать semanticGroup для всей секции); прогнать
      `app-acceptance.section-*` и `text-control-kind` валидаторы.
- [ ] **2.3. Протокол** — `FINE_DETAILS_PREVIEW_VERSION` +1 с обеих сторон; payload несёт
      `prompt.typing` из values‑типа.
- [ ] **2.4. Acceptance/product** — inventory‑блок секции (entity «Fine Details prompt typing»,
      groupingReason: свитч, фразы и тайминги описывают одну idle‑анимацию промпта);
      product‑строки для всех восьми контролов; product‑test читает `settings.prompt.typing.*`.
- [ ] **2.5. e2e** — кейс `browser: prompt typing animates phrases until focus`: в стейте Trail
      включить свитч, задать две короткие фразы через `+` и текстовые инпуты; в iframe
      `[data-fine-details-prompt-ghost]` появляется и его текст **меняется** между двумя
      замерами (poll); клик в инпут промпта ⇒ ghost скрыт; blur ⇒ снова появляется; сегментом
      Delete style `Instant` ⇒ текст исчезает скачком после hold (проверить по длине);
      переключить стейт в Carousel ⇒ ghost отсутствует; `reducedMotion: 'reduce'` ⇒ статичная
      первая фраза без изменений между замерами; свитч выкл ⇒ ghost отсутствует.
- [ ] **2.6. Worklog** — `## Decision Trail: Fine Details prompt typing`: модель §1 (оверлей
      вместо значения инпута, чистый движок с инъекцией random, trail‑гейт, focus‑гейт),
      протокол +1, фактические проверки §5, границы §7.

## 3. Сайт (`recraft-v4-styles/src/components/pages/home/` + общий компонент)

- [ ] **3.1. `fine-details-settings.ts`** — тип/дефолты/нормализация `prompt.typing` по §1
      (фразы: строки, trim не делать — пробелы пользователя уважать, но пустые пропускать при
      воспроизведении; enabled строго boolean; deleteStyle строгий union). Тест нормализации.
- [ ] **3.2. `fine-details-prompt-typing.ts` + `fine-details-prompt-typing.test.ts`** — движок
      §1 и юнит‑тесты с заскриптованным random: полный цикл двух фраз (typing→holding→deleting→
      gap→次 фраза→…→wrap к первой); humanize 0 ⇒ строго равномерные задержки; humanize 1 ⇒
      задержки в заявленном диапазоне; Instant ⇒ text пустеет одним шагом после hold; пустые
      фразы пропускаются; одна фраза ⇒ цикл сам с собой; `dt = 0` ничего не меняет; смена списка
      фраз извне сбрасывает состояние безопасно.
- [ ] **3.3. `AiPromptInput`** (`src/components/ai-prompt-input`) — опциональный проп `ghost`
      (aria‑hidden оверлей + каретка, та же типографика; скрыт при фокусе/непустом значении;
      без пропа рендер байт в байт прежний — существующие использования не трогать). Контракт:
      тест на отсутствие изменений дефолтного рендера (регекс/снапшот по месту).
- [ ] **3.4. Хук `useFineDetailsPromptTyping`** (в составе 3.2 или рядом): держит состояние
      движка на rAF, подписан на фокус/blur/input инпута и на `imagesMode`; выдаёт
      `ghost | null`. Подключение в `fine-details-section.tsx` / `fine-details-draggable-prompt.tsx`
      по месту (`data-fine-details-prompt` уже есть — использовать существующие рефы), проп
      `ghost` пробрасывается в `AiPromptInput` с атрибутом `data-fine-details-prompt-ghost` на
      оверлее.
- [ ] **3.5. `fine-details-preview-boundary.tsx`** — версия протокола +1.
- [ ] **3.6. Существующие тесты** (prompt-focus шлейфа, draggable prompt, state transition,
      loading/carousel) — зелёные: анимация не трогает focus‑suppression шлейфа (она сама
      подчиняется тем же событиям) и драг промпта.

## 4. Целевое поведение

- **M1** — в стейте Trail при включённом свитче в пустом несфокусированном промпте фразы
  печатаются с человеческой неровностью (заметные микрозапинки при humanize > 0), держатся
  `hold`, стираются выбранным способом и сменяются по кругу; мигает каретка.
- **M2** — фокус мгновенно убирает анимацию и оставляет обычный пустой инпут; blur с пустым
  полем возобновляет цикл; собственный текст пользователя анимацией никогда не перекрывается;
  сабмит и драг промпта работают как раньше.
- **M3** — `+`/`−` в панели меняют число фраз (1–8), каждая фраза — свой текстовый инпут,
  изменения видны в iframe живьём; тайминги/humanize/style реагируют без перезагрузки.
- **M4** — в Loading/Carousel анимации нет; reduced motion — статичная первая фраза; свитч выкл
  (дефолт) ⇒ поведение сайта байт в байт текущее; Apply → standalone переносит всё.
- **M5** — hero‑промпт и любые другие использования `AiPromptInput` не изменились.

## 5. Проверки

- [ ] Сайт: RED → GREEN движок и контракты §3; существующие fine-details тесты зелёные; focused
      `oxfmt`; `pnpm lint`; `pnpm build`; `git diff --check`.
- [ ] Toolcraft: focused vitest (values/sections/acceptance/product + section/text валидаторы);
      e2e‑кейс 2.5.
- [ ] Ручные: (а) включить, 3 фразы разной длины — набор выглядит живым (не метроном) при
      humanize 0.6, метрономом при 0; (б) hold/gap крутятся предсказуемо; (в) Backspace vs
      Instant; (г) фокус/blur/ввод текста/очистка — гейты по M2; (д) переключение стейтов
      сегментом и полный цикл мока (submit → loading → carousel) — анимации нет вне Trail;
      (е) reduced motion; (ж) hero‑секция — промпт без изменений; (з) Apply и перезагрузка.

## 6. Verification note

```md
Verification tier: Tier 2
Reason: New idle typing animation for the Fine Details prompt (phrase collection + timing/humanize controls, protocol +1) rendered as an aria-hidden ghost overlay; default off keeps production byte-identical; shared AiPromptInput gains only an optional prop.
Run: focused site tsx tests incl. the pure typing engine with injected random; fine-details vitest incl. section/text-control validators; the new browser case; oxfmt on touched files; site lint/build; git diff --check; manual checks §5.
Skip: verify:delivery; verify:perf; export matrices; site typecheck/format if pre-existing blockers exist (record them).
```

## 7. Границы и риски

- Анимация — оверлей, а не значение инпута: автозаполнение, скринридеры и сабмит видят настоящее
  пустое поле; это осознанное решение (никаких синтетических input‑событий).
- Случайность не сидируется между загрузками (каждый визит печатает чуть по-своему) — в тестах
  random инъецируется; браузерный кейс проверяет факт изменения текста, не конкретную траекторию.
- Лимиты 8 фраз × ~200 знаков держат payload и панель в разумных рамках; длинная фраза может не
  влезать в одну строку инпута — оверлей наследует переносы/обрезку самого инпута, отдельной
  логики не делаем.
- Пословная ритмика и «задумался»‑паузы — именованные константы движка; тонкая подстройка «как
  человек» — ожидаемая итерация тюнинга с пользователем после первой сборки.
- Если правило секций потребует semanticGroup при 8 контролах — задать его всей секции, не
  дробить на две (единая сущность анимации).
