'use client';

import { referenceClasses } from '@/section/reference/reference-classes';
import { Plus } from 'lucide-react';
import {
  type CSSProperties,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import {
  ReferenceStrip,
  type StylePresetId,
  StylePresetSelect,
  type StyleReference,
} from '@/section/components/ai-prompt-input-controls';
import { cn } from '@/section/lib/utils';
import {
  isValidGenerationPrompt,
  maximumGenerationPromptCharacters,
} from '@/section/shared/config/generation-prompt-policy';
import {
  isSupportedStyleReferenceMimeType,
  maximumStyleReferenceBytes,
  maximumStyleReferenceCount,
  styleReferenceCountError,
  styleReferenceEmptyError,
  styleReferenceSizeError,
  styleReferenceTypeError,
  supportedStyleReferenceMimeTypes,
} from '@/section/shared/config/style-reference-policy';
import { defaultStylePreset, getStylePreset } from '@/section/shared/config/style-presets';

export type AiPromptStyleSelection =
  | { kind: 'preset'; presetId: StylePresetId }
  | { kind: 'custom'; styleReferences: File[] };

import {
  getInitialAiPromptValue,
  shouldClearUntouchedAiPromptDefault,
} from './ai-prompt-input-default-state';
import styles from './ai-prompt-input.module.css';
import {
  heicStyleReferenceAcceptTokens,
  isHeicStyleReference,
  prepareStyleReferenceImage,
  styleReferenceConversionError,
} from './style-reference-image-conversion';

export interface AiPromptSubmission {
  prompt: string;
  style: AiPromptStyleSelection;
}

export interface AiPromptGhost {
  caret: boolean;
  text: string;
}

interface AiPromptInputProps {
  className?: string;
  clearUntouchedDefaultPrompt?: boolean;
  defaultPrompt?: string;
  ghost?: AiPromptGhost;
  isSubmitting?: boolean;
  onSubmit?: (submission: AiPromptSubmission) => void;
  style?: CSSProperties;
  submissionDraft?: AiPromptSubmission;
  submissionError?: string;
  submissionStatus?: string;
}

function getFileIdentity(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function containsDraggedFiles(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer.types).includes('Files');
}

export function AiPromptInput({
  className,
  clearUntouchedDefaultPrompt = false,
  defaultPrompt = '',
  ghost,
  isSubmitting = false,
  onSubmit,
  style,
  submissionDraft,
  submissionError,
  submissionStatus = '',
}: AiPromptInputProps) {
  const [prompt, setPrompt] = useState(() =>
    getInitialAiPromptValue(defaultPrompt, clearUntouchedDefaultPrompt),
  );
  const [attachmentError, setAttachmentError] = useState('');
  const [presetId, setPresetId] = useState<StylePresetId>(defaultStylePreset.id);
  const [styleReferences, setStyleReferences] = useState<StyleReference[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isPreparingStyleReferences, setIsPreparingStyleReferences] = useState(false);
  const [isPromptFocused, setIsPromptFocused] = useState(false);
  const [dismissedSubmissionError, setDismissedSubmissionError] = useState<string>();
  const [statusMessage, setStatusMessage] = useState('');
  const dragDepthRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ghostRef = useRef<HTMLSpanElement>(null);
  const isMountedRef = useRef(false);
  const pendingStyleReferencePreparationCountRef = useRef(0);
  const previewUrlsRef = useRef(new Set<string>());
  const styleReferencesRef = useRef<StyleReference[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputId = useId();
  const promptId = useId();
  const statusId = useId();
  const appliedSubmissionDraftRef = useRef<AiPromptSubmission | undefined>(undefined);
  const hasUserEditedPromptRef = useRef(false);
  const previousClearUntouchedDefaultPromptRef = useRef(clearUntouchedDefaultPrompt);
  const canSubmit = isValidGenerationPrompt(prompt) && !isSubmitting && !isPreparingStyleReferences;
  const isGhostVisible = Boolean(ghost && !isPromptFocused && prompt.length === 0);
  const visibleError =
    (dismissedSubmissionError === submissionError ? '' : submissionError) || attachmentError;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      for (const previewUrl of previewUrlsRef.current) {
        URL.revokeObjectURL(previewUrl);
      }
      previewUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!submissionDraft || appliedSubmissionDraftRef.current === submissionDraft) return;
    appliedSubmissionDraftRef.current = submissionDraft;
    hasUserEditedPromptRef.current = true;

    for (const previewUrl of previewUrlsRef.current) URL.revokeObjectURL(previewUrl);
    previewUrlsRef.current.clear();
    const restoredReferences =
      submissionDraft.style.kind === 'custom'
        ? submissionDraft.style.styleReferences.map((file) => {
            const previewUrl = URL.createObjectURL(file);
            previewUrlsRef.current.add(previewUrl);
            return { file, id: previewUrl, previewUrl };
          })
        : [];
    setPrompt(submissionDraft.prompt);
    setPresetId(
      submissionDraft.style.kind === 'preset'
        ? submissionDraft.style.presetId
        : defaultStylePreset.id,
    );
    styleReferencesRef.current = restoredReferences;
    setStyleReferences(restoredReferences);
    setAttachmentError('');

    if (submissionDraft.style.kind === 'preset') {
      const preset = getStylePreset(submissionDraft.style.presetId);
      setStatusMessage(`Restored prompt with the ${preset?.label ?? 'selected'} style preset.`);
      return;
    }

    setStatusMessage(
      `Restored prompt with ${restoredReferences.length} style ${restoredReferences.length === 1 ? 'reference' : 'references'}.`,
    );
  }, [submissionDraft]);

  useEffect(() => {
    if (
      shouldClearUntouchedAiPromptDefault({
        active: clearUntouchedDefaultPrompt,
        previouslyActive: previousClearUntouchedDefaultPromptRef.current,
        userEdited: hasUserEditedPromptRef.current,
      })
    ) {
      setPrompt('');
    }
    previousClearUntouchedDefaultPromptRef.current = clearUntouchedDefaultPrompt;
  }, [clearUntouchedDefaultPrompt]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    function resizeTextarea() {
      if (!textarea) return;
      const reservedHeight = Number.parseFloat(window.getComputedStyle(textarea).minHeight) || 20;
      textarea.style.height = '0px';
      const contentHeight = isGhostVisible
        ? (ghostRef.current?.scrollHeight ?? 20)
        : textarea.scrollHeight;
      textarea.style.height = `${Math.min(Math.max(contentHeight, reservedHeight), 80)}px`;
    }

    resizeTextarea();
    window.addEventListener('resize', resizeTextarea);

    return () => window.removeEventListener('resize', resizeTextarea);
  }, [ghost?.text, isGhostVisible, prompt]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function addPreparedStyleReferences(files: File[], conversionFailureCount = 0) {
    setDismissedSubmissionError(submissionError);
    const currentReferences = styleReferencesRef.current;
    const existingIdentities = new Set(
      currentReferences.map((reference) => getFileIdentity(reference.file)),
    );
    const acceptedReferences: StyleReference[] = [];
    let duplicateCount = 0;
    let emptyCount = 0;
    let excessiveCount = 0;
    let invalidCount = 0;
    let oversizedCount = 0;

    for (const file of files) {
      if (!isSupportedStyleReferenceMimeType(file.type)) {
        invalidCount += 1;
        continue;
      }
      if (file.size < 1) {
        emptyCount += 1;
        continue;
      }
      if (file.size > maximumStyleReferenceBytes) {
        oversizedCount += 1;
        continue;
      }

      const identity = getFileIdentity(file);
      if (existingIdentities.has(identity)) {
        duplicateCount += 1;
        continue;
      }

      if (currentReferences.length + acceptedReferences.length >= maximumStyleReferenceCount) {
        excessiveCount += 1;
        continue;
      }

      existingIdentities.add(identity);
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      acceptedReferences.push({ file, id: previewUrl, previewUrl });
    }

    if (acceptedReferences.length > 0) {
      const nextReferences = [...currentReferences, ...acceptedReferences];
      styleReferencesRef.current = nextReferences;
      setStyleReferences(nextReferences);
    }

    const messages: string[] = [];
    if (acceptedReferences.length > 0) {
      messages.push(
        `${acceptedReferences.length} style ${acceptedReferences.length === 1 ? 'reference' : 'references'} added`,
      );
    }
    if (duplicateCount > 0) {
      messages.push(
        `${duplicateCount} duplicate ${duplicateCount === 1 ? 'image was' : 'images were'} ignored`,
      );
    }
    if (invalidCount > 0) {
      messages.push(
        `${invalidCount} unsupported ${invalidCount === 1 ? 'file was' : 'files were'} ignored`,
      );
    }
    if (emptyCount > 0) {
      messages.push(
        `${emptyCount} empty ${emptyCount === 1 ? 'image was' : 'images were'} ignored`,
      );
    }
    if (oversizedCount > 0) {
      messages.push(
        `${oversizedCount} oversized ${oversizedCount === 1 ? 'image was' : 'images were'} ignored`,
      );
    }
    if (excessiveCount > 0) {
      messages.push(
        `${excessiveCount} excess ${excessiveCount === 1 ? 'image was' : 'images were'} ignored`,
      );
    }
    if (conversionFailureCount > 0) {
      messages.push(
        `${conversionFailureCount} HEIC or HEIF ${conversionFailureCount === 1 ? 'image could' : 'images could'} not be converted`,
      );
    }
    if (conversionFailureCount > 0) {
      setAttachmentError(styleReferenceConversionError);
    } else if (invalidCount > 0) {
      setAttachmentError(styleReferenceTypeError);
    } else if (emptyCount > 0) {
      setAttachmentError(styleReferenceEmptyError);
    } else if (oversizedCount > 0) {
      setAttachmentError(styleReferenceSizeError);
    } else if (excessiveCount > 0) {
      setAttachmentError(styleReferenceCountError);
    } else {
      setAttachmentError('');
    }
    if (messages.length === 0) messages.push('No images were added');
    setStatusMessage(`${messages.join('. ')}.`);
  }

  async function prepareAndAddStyleReferences(files: File[]) {
    pendingStyleReferencePreparationCountRef.current += 1;
    setIsPreparingStyleReferences(true);
    setStatusMessage('Converting HEIC or HEIF style references.');

    const preparedFiles: File[] = [];
    let conversionFailureCount = 0;
    try {
      for (const file of files) {
        try {
          preparedFiles.push(await prepareStyleReferenceImage(file));
        } catch {
          conversionFailureCount += 1;
        }
      }
      if (isMountedRef.current) {
        addPreparedStyleReferences(preparedFiles, conversionFailureCount);
      }
    } finally {
      pendingStyleReferencePreparationCountRef.current = Math.max(
        pendingStyleReferencePreparationCountRef.current - 1,
        0,
      );
      if (isMountedRef.current && pendingStyleReferencePreparationCountRef.current === 0) {
        setIsPreparingStyleReferences(false);
      }
    }
  }

  function addStyleReferences(files: File[]) {
    if (!files.some(isHeicStyleReference)) {
      addPreparedStyleReferences(files);
      return;
    }
    void prepareAndAddStyleReferences(files);
  }

  function revokePreview(previewUrl: string) {
    if (!previewUrlsRef.current.delete(previewUrl)) return;
    URL.revokeObjectURL(previewUrl);
  }

  function removeStyleReference(id: string) {
    const reference = styleReferencesRef.current.find((item) => item.id === id);
    if (!reference) return;

    setDismissedSubmissionError(submissionError);
    revokePreview(reference.previewUrl);
    const nextReferences = styleReferencesRef.current.filter((item) => item.id !== id);
    styleReferencesRef.current = nextReferences;
    setStyleReferences(nextReferences);
    setAttachmentError('');
    setStatusMessage(`${reference.file.name} removed from style references.`);
  }

  function clearStyleReferences() {
    setDismissedSubmissionError(submissionError);
    for (const reference of styleReferencesRef.current) revokePreview(reference.previewUrl);
    styleReferencesRef.current = [];
    setStyleReferences([]);
    setAttachmentError('');
    setStatusMessage(
      `All style references removed. ${getStylePreset(presetId)?.label ?? 'Style'} preset restored.`,
    );
  }

  function selectPreset(nextPresetId: StylePresetId) {
    setDismissedSubmissionError(submissionError);
    setPresetId(nextPresetId);
    setAttachmentError('');
    setStatusMessage(`${getStylePreset(nextPresetId)?.label ?? 'Style'} preset selected.`);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    addStyleReferences(Array.from(event.currentTarget.files ?? []));
    event.currentTarget.value = '';
  }

  function handleDragEnter(event: DragEvent<HTMLFormElement>) {
    if (!containsDraggedFiles(event)) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragActive(true);
  }

  function handleDragOver(event: DragEvent<HTMLFormElement>) {
    if (!containsDraggedFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  function handleDragLeave(event: DragEvent<HTMLFormElement>) {
    if (!containsDraggedFiles(event)) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(dragDepthRef.current - 1, 0);
    if (dragDepthRef.current === 0) setIsDragActive(false);
  }

  function handleDrop(event: DragEvent<HTMLFormElement>) {
    if (!containsDraggedFiles(event)) return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragActive(false);
    addStyleReferences(Array.from(event.dataTransfer.files));
  }

  function handlePromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedPrompt = prompt.trim();
    if (!isValidGenerationPrompt(prompt) || isSubmitting || isPreparingStyleReferences) return;
    setDismissedSubmissionError(undefined);

    const style: AiPromptStyleSelection =
      styleReferences.length > 0
        ? {
            kind: 'custom',
            styleReferences: styleReferences.map(({ file }) => file),
          }
        : { kind: 'preset', presetId };

    onSubmit?.({
      prompt: normalizedPrompt,
      style,
    });

    setStatusMessage(
      style.kind === 'custom'
        ? `Prompt ready with ${style.styleReferences.length} style ${style.styleReferences.length === 1 ? 'reference' : 'references'}.`
        : `Prompt ready with the ${getStylePreset(style.presetId)?.label ?? 'selected'} preset.`,
    );
  }

  return (
    <form
      className={referenceClasses(cn(
        'relative flex min-h-[7.8125rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/50 bg-[#dedede]/85 shadow-[0_0.375rem_2.5rem_rgba(0,0,0,0.35)] backdrop-blur-[0.625rem]',
        className,
      ))}
      onSubmit={handleSubmit}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-describedby={statusId}
      style={style}
    >
      <label className={referenceClasses("sr-only")} htmlFor={promptId}>
        Describe what you want to generate
      </label>
      <div className={referenceClasses("relative px-5 pt-[1.3125rem] pb-[1.125rem]")}>
        {isGhostVisible ? (
          <span
            ref={ghostRef}
            aria-hidden="true"
            className={referenceClasses("pointer-events-none absolute inset-x-5 top-[1.3125rem] block max-h-20 min-h-5 overflow-hidden text-base leading-5 font-medium tracking-[-0.01em] whitespace-pre-wrap text-black/50")}
            data-fine-details-prompt-ghost
          >
            {ghost?.text}
            {ghost?.caret ? <span className={referenceClasses(styles.ghostCaret)}>|</span> : null}
          </span>
        ) : null}
        <textarea
          ref={textareaRef}
          id={promptId}
          className={referenceClasses(`${styles.promptTextarea} block w-full resize-none overflow-y-auto border-0 bg-transparent text-base leading-5 font-medium tracking-[-0.01em] text-black ring-0 outline-none placeholder:text-black/50 focus:border-0 focus:ring-0 focus:outline-none focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none`)}
          value={prompt}
          rows={1}
          maxLength={maximumGenerationPromptCharacters}
          data-fine-details-prompt-input
          data-fine-details-prompt-empty={prompt.length === 0 ? 'true' : 'false'}
          placeholder={isGhostVisible ? '' : 'Describe what you want to generate'}
          onChange={(event) => {
            hasUserEditedPromptRef.current = true;
            setDismissedSubmissionError(submissionError);
            setPrompt(event.currentTarget.value);
          }}
          onBlur={() => setIsPromptFocused(false)}
          onFocus={() => setIsPromptFocused(true)}
          onKeyDown={handlePromptKeyDown}
          spellCheck="true"
        />
      </div>

      <div className={referenceClasses("mx-5 h-px shrink-0 bg-black/10")} aria-hidden="true" />

      <input
        ref={fileInputRef}
        id={fileInputId}
        className={referenceClasses("sr-only")}
        type="file"
        accept={[...supportedStyleReferenceMimeTypes, ...heicStyleReferenceAcceptTokens].join(',')}
        multiple
        tabIndex={-1}
        onChange={handleFileChange}
        aria-hidden="true"
      />

      <div className={referenceClasses("mt-auto flex min-h-[3.75rem] items-center gap-2 px-5 pt-2 pb-2.5 md:gap-3")}>
        <div className={referenceClasses("flex min-w-0 items-center gap-2 overflow-hidden md:gap-3")}>
          {styleReferences.length > 0 ? (
            <>
              <ReferenceStrip
                maxVisible={3}
                onAdd={openFilePicker}
                onClear={clearStyleReferences}
                onRemove={removeStyleReference}
                references={styleReferences}
                variant="desktop"
              />
              <ReferenceStrip
                maxVisible={1}
                onAdd={openFilePicker}
                onClear={clearStyleReferences}
                onRemove={removeStyleReference}
                references={styleReferences}
                variant="mobile"
              />
            </>
          ) : (
            <div className={referenceClasses("flex min-w-0 items-center gap-[0.3125rem] md:gap-[0.4375rem]")}>
              <StylePresetSelect value={presetId} onValueChange={selectPreset} />
              <span className={referenceClasses("hidden shrink-0 text-base font-semibold text-black/40 min-[36rem]:inline")}>
                or
              </span>
              <button
                type="button"
                className={referenceClasses("flex h-11 min-w-11 shrink-0 cursor-pointer! touch-manipulation items-center justify-center rounded-lg px-1 text-base leading-none font-semibold tracking-[-0.02em] text-[#222cde] transition-opacity outline-none hover:opacity-75 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 focus-visible:ring-inset active:scale-[0.97]")}
                onClick={openFilePicker}
                aria-controls={fileInputId}
                aria-label="Create your own style with reference images"
              >
                <Plus className={referenceClasses("size-5 min-[30rem]:hidden")} aria-hidden="true" />
                <span className={referenceClasses("hidden whitespace-nowrap min-[30rem]:inline")}>Create your Own</span>
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          className={referenceClasses("ml-auto flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 disabled:active:scale-100")}
          data-fine-details-prompt-no-drag
          disabled={!canSubmit}
          onDragStart={(event) => event.preventDefault()}
          aria-busy={isSubmitting || isPreparingStyleReferences}
          aria-label={isSubmitting ? 'Generating images' : 'Submit prompt'}
          title={isSubmitting ? 'Generating images' : 'Submit prompt (Enter)'}
        >
          <span
            aria-hidden="true"
            className={referenceClasses("flex size-10 shrink-0 items-center justify-center rounded-full bg-black text-white")}
          >
            {isSubmitting ? (
              <svg
                className={referenceClasses("size-6 animate-spin motion-reduce:animate-none")}
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="16 40"
                />
              </svg>
            ) : (
              <svg className={referenceClasses("size-10")} viewBox="0 0 40 40" fill="none">
                <path
                  d="M20 28.25V11.75"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
                <path
                  d="M26.75 18.5 20 11.75l-6.75 6.75"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            )}
          </span>
        </button>
      </div>

      {isDragActive ? (
        <div className={referenceClasses("pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[1.75rem] bg-[#dedede]/95 shadow-[inset_0_0_0_2px_#222cde] backdrop-blur-sm")}>
          <span className={referenceClasses("rounded-full bg-white px-4 py-2 text-base font-semibold text-[#222cde] shadow-sm")}>
            Drop images to add style references
          </span>
        </div>
      ) : null}

      <p
        className={referenceClasses(visibleError ? 'mx-5 mb-3 text-sm leading-5 font-medium text-red-700' : 'sr-only')}
        id={statusId}
        role={visibleError ? 'alert' : undefined}
        aria-live="polite"
      >
        {visibleError || submissionStatus || statusMessage}
      </p>
    </form>
  );
}
