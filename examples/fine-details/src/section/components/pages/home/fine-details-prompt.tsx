'use client';

import { type CSSProperties, forwardRef, useState } from 'react';

import { AiPromptInput, type AiPromptSubmission } from '@/section/components/ai-prompt-input';

import {
  FineDetailsDraggablePrompt,
  type FineDetailsPromptFlightHandle,
  type FineDetailsPromptFlightState,
} from './fine-details-draggable-prompt';
import {
  FINE_DETAILS_DEFAULT_PROMPT,
  type FineDetailsImagesMode,
  type FineDetailsPromptTypingSettings,
} from './fine-details-settings';
import { useFineDetailsPromptTyping } from './use-fine-details-prompt-typing';

interface FineDetailsPromptProps {
  baseTransform: string;
  className: string;
  flightState?: FineDetailsPromptFlightState;
  imagesMode: FineDetailsImagesMode;
  isSubmitting: boolean;
  onSubmit?: (submission: AiPromptSubmission) => void;
  panelStyle: CSSProperties;
  promptError?: string;
  promptStatus: string;
  style: CSSProperties;
  submissionDraft?: AiPromptSubmission;
  typing: FineDetailsPromptTypingSettings;
}

export const FineDetailsPrompt = forwardRef<FineDetailsPromptFlightHandle, FineDetailsPromptProps>(
  function FineDetailsPrompt(
    {
      baseTransform,
      className,
      flightState,
      imagesMode,
      isSubmitting,
      onSubmit,
      panelStyle,
      promptError,
      promptStatus,
      style,
      submissionDraft,
      typing,
    },
    forwardedRef,
  ) {
  const [promptRoot, setPromptRoot] = useState<HTMLDivElement | null>(null);
  const ghost = useFineDetailsPromptTyping({ imagesMode, promptRoot, settings: typing });

  return (
    <FineDetailsDraggablePrompt
      ref={forwardedRef}
      baseTransform={baseTransform}
      className={className}
      dragEnabled={true}
      flightState={flightState}
      onRootElementChange={setPromptRoot}
      style={style}
    >
      <AiPromptInput
        className="w-full"
        clearUntouchedDefaultPrompt={typing.enabled}
        defaultPrompt={FINE_DETAILS_DEFAULT_PROMPT}
        ghost={ghost ?? undefined}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
        submissionError={promptError}
        submissionStatus={promptStatus}
        submissionDraft={submissionDraft}
        style={panelStyle}
      />
    </FineDetailsDraggablePrompt>
  );
  },
);
