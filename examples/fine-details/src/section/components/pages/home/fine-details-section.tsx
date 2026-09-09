'use client';

import { referenceClasses } from '@/section/reference/reference-classes';
import { ArrowRight } from 'lucide-react';
import { type CSSProperties, useRef } from 'react';

import type { AiPromptSubmission } from '@/section/components/ai-prompt-input';
import { withBasePath } from '@/section/shared/config/base-path';

import type { FineDetailsPromptFlightHandle } from './fine-details-draggable-prompt';
import type { FineDetailsCarouselAsset } from './fine-details-carousel-assets';
import { FineDetailsImageRenderer } from './fine-details-image-renderer';
import { FineDetailsImageStateTransition } from './fine-details-image-state-transition';
import { FineDetailsPrompt } from './fine-details-prompt';
import { useFineDetailsPromptFlight } from './fine-details-prompt-flight-engine';
import { FineDetailsPromptFlightGhosts } from './fine-details-prompt-flight-ghosts';
import type { FineDetailsPromptFlightCommandEvent } from './fine-details-prompt-flight-runtime';
import {
  appliedFineDetailsSettings,
  type FineDetailsShadowSettings,
  type FineDetailsSettings,
} from './fine-details-settings';
import styles from './fine-details-section.module.css';

const shadowOffsetPixels = 48;
const gridBackgroundImage = `url('${withBasePath('/images/recraft-fine-details/grid.png')}')`;

type FineDetailsSectionStyle = CSSProperties & {
  '--fine-details-desktop-aspect-height': string;
  '--fine-details-desktop-height': string;
};

function createShadowColor(shadow: FineDetailsShadowSettings) {
  const red = Number.parseInt(shadow.colorOpacity.hex.slice(1, 3), 16);
  const green = Number.parseInt(shadow.colorOpacity.hex.slice(3, 5), 16);
  const blue = Number.parseInt(shadow.colorOpacity.hex.slice(5, 7), 16);
  return `rgb(${red} ${green} ${blue} / ${shadow.colorOpacity.opacity}%)`;
}

function createPromptPanelStyle(shadow: FineDetailsShadowSettings): CSSProperties {
  return {
    boxShadow: shadow.enabled
      ? `${shadow.offset.x * shadowOffsetPixels}px ${shadow.offset.y * shadowOffsetPixels}px ${shadow.blur}px ${shadow.spread}px ${createShadowColor(shadow)}`
      : 'none',
  };
}

export default function FineDetailsSection({
  carouselAssets,
  isPromptSubmitting = false,
  onPromptSubmit,
  promptFlightCommand,
  promptError,
  promptStatus = '',
  settings = appliedFineDetailsSettings,
  submissionDraft,
  transitionImages = false,
}: {
  carouselAssets?: readonly FineDetailsCarouselAsset[];
  isPromptSubmitting?: boolean;
  onPromptSubmit?: (submission: AiPromptSubmission) => void;
  promptFlightCommand?: FineDetailsPromptFlightCommandEvent;
  promptError?: string;
  promptStatus?: string;
  settings?: FineDetailsSettings;
  submissionDraft?: AiPromptSubmission;
  transitionImages?: boolean;
}) {
  const promptRef = useRef<FineDetailsPromptFlightHandle>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const responsiveHeight = (settings.height / 1920) * 100;
  const promptPositionY = (settings.prompt.position.y + 1) * 50;
  const carouselMeasurementKey = [
    settings.typography.upperLeft.top,
    settings.typography.upperLeft.fontSize,
    settings.typography.lowerRight.bottom,
    settings.typography.lowerRight.headingFontSize,
    settings.typography.lowerRight.bodyFontSize,
    settings.typography.lowerRight.gap,
  ].join(':');
  const { clearGhostRun, flightState, ghostRun } = useFineDetailsPromptFlight({
    command: promptFlightCommand,
    promptRef,
    sectionRef,
    settings,
  });

  return (
    <section
      ref={sectionRef}
      id="fine-details"
      aria-label="Fine details"
      className={referenceClasses(`${styles.section} relative isolate w-full scroll-mt-16 overflow-hidden`)}
      data-fine-details-section
      data-fine-details-background={settings.background}
      data-fine-details-grid-opacity={settings.gridOpacity}
      data-fine-details-grid-size={settings.gridSize}
      data-fine-details-height={settings.height}
      data-fine-details-image-state={settings.imagesMode}
      style={
        {
          '--fine-details-desktop-aspect-height': `${responsiveHeight}cqw`,
          '--fine-details-desktop-height': `${settings.height}px`,
          backgroundColor: settings.background,
        } as FineDetailsSectionStyle
      }
    >
      <div
        aria-hidden="true"
        className={referenceClasses("pointer-events-none absolute inset-0 bg-repeat")}
        style={{
          backgroundImage: gridBackgroundImage,
          backgroundSize: `${settings.gridSize}px ${settings.gridSize}px`,
          opacity: settings.gridOpacity / 100,
        }}
      />
      <div
        className={referenceClasses(styles.imageLayer)}
        data-initial-trail={settings.imagesMode === 'trail' ? 'true' : 'false'}
      >
        {transitionImages ? (
          <FineDetailsImageStateTransition
            carouselAssets={carouselAssets}
            carouselMeasurementKey={carouselMeasurementKey}
            settings={settings}
          />
        ) : (
          <FineDetailsImageRenderer
            carouselAssets={carouselAssets}
            carouselMeasurementKey={carouselMeasurementKey}
            settings={settings}
          />
        )}
      </div>
      <div
        className={referenceClasses("pointer-events-none absolute inset-y-0 z-[1] w-full max-w-[1920px] min-[80rem]:left-1/2 min-[80rem]:-translate-x-1/2")}
        data-fine-details-typography-container
      >
        <div
          className={referenceClasses("pointer-events-none absolute inset-x-0 z-[1] flex items-baseline justify-between")}
          data-fine-details-upper-row
          style={{
            paddingLeft: `${settings.typography.upperLeft.left}px`,
            paddingRight: `${settings.typography.lowerRight.right}px`,
            top: `${settings.typography.upperLeft.top}px`,
          }}
        >
          <p
            aria-hidden="true"
            className={referenceClasses("pointer-events-none m-0 font-heading leading-[0.96] font-black whitespace-nowrap text-black uppercase select-none")}
            data-fine-details-upper-left-typography
            style={{ fontSize: `${settings.typography.upperLeft.fontSize}px` }}
          >
            Try it
          </p>
          {settings.imagesMode === 'carousel' ? (
            <a
              className={referenceClasses("pointer-events-auto flex shrink-0 touch-manipulation items-end gap-[0.3125rem] text-right font-sans text-[24px] leading-none font-semibold tracking-[-0.02em] whitespace-nowrap text-[#222cde] transition-opacity hover:opacity-80")}
              data-fine-details-history-link
              href="https://www.recraft.ai/history"
            >
              <span>View Generation History</span>
              <ArrowRight className={referenceClasses("size-6 shrink-0")} strokeWidth={3} aria-hidden="true" />
            </a>
          ) : null}
        </div>
        <div
          aria-hidden="true"
          className={referenceClasses("pointer-events-none absolute z-[1] flex w-max flex-col items-start text-black select-none")}
          data-fine-details-lower-right-typography
          style={{
            bottom: `${settings.typography.lowerRight.bottom}px`,
            gap: `${settings.typography.lowerRight.gap}px`,
            right: `${settings.typography.lowerRight.right}px`,
          }}
        >
          <p
            className={referenceClasses("m-0 font-display-wide-ultra-italic leading-[0.96] font-[1000] whitespace-nowrap uppercase italic")}
            data-fine-details-lower-heading
            style={{ fontSize: `${settings.typography.lowerRight.headingFontSize}px` }}
          >
            Your way
          </p>
          <p
            className={referenceClasses("m-0 w-[465px] font-sans font-medium")}
            data-fine-details-lower-body
            style={{
              fontSize: `${settings.typography.lowerRight.bodyFontSize}px`,
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
            }}
          >
            Bring a style reference, and every image you generate will hold true to it.
          </p>
        </div>
      </div>
      <FineDetailsPromptFlightGhosts onComplete={clearGhostRun} run={ghostRun} />
      <FineDetailsPrompt
        ref={promptRef}
        baseTransform={`translate(-50%, ${-promptPositionY}%)`}
        className="absolute z-10 w-[calc(100cqw-2rem)] max-w-160"
        flightState={flightState}
        imagesMode={settings.imagesMode}
        isSubmitting={isPromptSubmitting}
        onSubmit={onPromptSubmit}
        panelStyle={createPromptPanelStyle(settings.prompt.shadow)}
        promptError={promptError}
        promptStatus={promptStatus}
        style={{
          left: `calc(50% + ${settings.prompt.position.x * 36}cqw)`,
          top: `${promptPositionY}%`,
        }}
        submissionDraft={submissionDraft}
        typing={settings.prompt.typing}
      />
    </section>
  );
}
