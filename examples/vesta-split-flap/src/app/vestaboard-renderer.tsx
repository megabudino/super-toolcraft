import * as React from "react";

import { useCreativeAppsKit } from "@/creative-apps-kit/template-runtime/react";

import {
  createVestaboardAudioEngine,
  type VestaboardAudioEngine,
  type VestaboardFlapClick,
} from "./vestaboard-audio";
import {
  buildVestaboardModel,
  getVestaboardAnimationProgress,
  getVestaboardFontFamily,
  getVestaboardLetterSpacing,
  getVestaboardLineHeightPx,
  getVestaboardRgbaColor,
  getVestaboardRgbaColorFromParts,
  getVestaboardTrailAlpha,
  resolveVestaboardSettings,
} from "./vestaboard-model";

const controlsPanelHostSelector =
  '[data-slot="creative-apps-kit-runtime-panel-host"][data-panel-type="controls"]';
const controlsPanelCollapseButtonSelector =
  'button[aria-label="Collapse controls"], button[aria-label="Expand controls"]';
const canvasViewportSelector = '[data-slot="creative-apps-kit-runtime-canvas"]';
const panelCollapseRenderHoldMs = 180;
const canvasDragRenderHoldMs = 140;
const previewRenderFrameIntervalMs = 1000 / 30;
const previewCatchUpStepSeconds = 1 / 10;

function isControlsPanelCollapseToggle(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  const button = target.closest(controlsPanelCollapseButtonSelector);

  return Boolean(button?.closest(controlsPanelHostSelector));
}

function isCanvasViewportTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(canvasViewportSelector));
}

function getNowMs(): number {
  return typeof window === "undefined" ? 0 : window.performance.now();
}

function clampTimelineTime(timeSeconds: number, durationSeconds: number): number {
  if (!Number.isFinite(timeSeconds)) {
    return 0;
  }

  if (durationSeconds <= 0) {
    return Math.max(0, timeSeconds);
  }

  return Math.max(0, Math.min(durationSeconds, timeSeconds));
}

function getNextPreviewTime({
  currentTimeSeconds,
  durationSeconds,
  targetTimeSeconds,
}: {
  currentTimeSeconds: number;
  durationSeconds: number;
  targetTimeSeconds: number;
}): number {
  const current = clampTimelineTime(currentTimeSeconds, durationSeconds);
  const target = clampTimelineTime(targetTimeSeconds, durationSeconds);
  const diff = target - current;
  const loopedToStart = durationSeconds > 0 && diff < -durationSeconds * 0.5;
  const jumpedAcrossTimeline = Math.abs(diff) > Math.max(0.75, durationSeconds * 0.35);

  if (loopedToStart || jumpedAcrossTimeline) {
    return target;
  }

  if (Math.abs(diff) <= 0.001) {
    return target;
  }

  return current + Math.sign(diff) * Math.min(Math.abs(diff), previewCatchUpStepSeconds);
}

function useCoalescedPreviewTime({
  currentTimeSeconds,
  durationSeconds,
  isPlaying,
}: {
  currentTimeSeconds: number;
  durationSeconds: number;
  isPlaying: boolean;
}): number {
  const [previewTimeSeconds, setPreviewTimeSeconds] = React.useState(currentTimeSeconds);
  const currentTimeRef = React.useRef(currentTimeSeconds);
  const previewTimeRef = React.useRef(currentTimeSeconds);
  const holdUntilRef = React.useRef(0);
  const canvasDragPointerIdRef = React.useRef<number | null>(null);
  const lastRenderStepRef = React.useRef(0);

  const setPreviewTime = React.useCallback((nextTimeSeconds: number) => {
    const next = clampTimelineTime(nextTimeSeconds, durationSeconds);

    if (Math.abs(previewTimeRef.current - next) <= 0.001) {
      previewTimeRef.current = next;
      return;
    }

    previewTimeRef.current = next;
    setPreviewTimeSeconds(next);
  }, [durationSeconds]);

  React.useEffect(() => {
    currentTimeRef.current = currentTimeSeconds;

    if (!isPlaying) {
      setPreviewTime(currentTimeSeconds);
    }
  }, [currentTimeSeconds, isPlaying, setPreviewTime]);

  React.useEffect(() => {
    const handlePotentialCollapse = (event: PointerEvent | MouseEvent) => {
      if (!isControlsPanelCollapseToggle(event.target)) {
        return;
      }

      holdUntilRef.current = getNowMs() + panelCollapseRenderHoldMs;
    };
    const handleCanvasPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !isCanvasViewportTarget(event.target)) {
        return;
      }

      canvasDragPointerIdRef.current = event.pointerId;
      holdUntilRef.current = Number.POSITIVE_INFINITY;
    };
    const handleCanvasPointerMove = (event: PointerEvent) => {
      if (canvasDragPointerIdRef.current !== event.pointerId) {
        return;
      }

      holdUntilRef.current = Number.POSITIVE_INFINITY;
    };
    const releaseCanvasDragHold = (event: PointerEvent) => {
      if (canvasDragPointerIdRef.current !== event.pointerId) {
        return;
      }

      canvasDragPointerIdRef.current = null;
      holdUntilRef.current = getNowMs() + canvasDragRenderHoldMs;
    };
    const handleWindowBlur = () => {
      if (canvasDragPointerIdRef.current === null) {
        return;
      }

      canvasDragPointerIdRef.current = null;
      holdUntilRef.current = getNowMs() + canvasDragRenderHoldMs;
    };

    window.addEventListener("pointerdown", handlePotentialCollapse, true);
    window.addEventListener("pointerdown", handleCanvasPointerDown, true);
    window.addEventListener("pointermove", handleCanvasPointerMove, true);
    window.addEventListener("pointerup", releaseCanvasDragHold, true);
    window.addEventListener("pointercancel", releaseCanvasDragHold, true);
    window.addEventListener("click", handlePotentialCollapse, true);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("pointerdown", handlePotentialCollapse, true);
      window.removeEventListener("pointerdown", handleCanvasPointerDown, true);
      window.removeEventListener("pointermove", handleCanvasPointerMove, true);
      window.removeEventListener("pointerup", releaseCanvasDragHold, true);
      window.removeEventListener("pointercancel", releaseCanvasDragHold, true);
      window.removeEventListener("click", handlePotentialCollapse, true);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  React.useEffect(() => {
    if (!isPlaying || durationSeconds <= 0) {
      return undefined;
    }

    let animationFrame = 0;
    const tick = (now: number) => {
      if (now >= holdUntilRef.current && now - lastRenderStepRef.current >= previewRenderFrameIntervalMs) {
        lastRenderStepRef.current = now;
        setPreviewTime(
          getNextPreviewTime({
            currentTimeSeconds: previewTimeRef.current,
            durationSeconds,
            targetTimeSeconds: currentTimeRef.current,
          }),
        );
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [durationSeconds, isPlaying, setPreviewTime]);

  return previewTimeSeconds;
}

function useVestaboardFlapSound({
  isPlaying,
  model,
}: {
  isPlaying: boolean;
  model: ReturnType<typeof buildVestaboardModel>;
}): void {
  const engineRef = React.useRef<VestaboardAudioEngine | null>(null);
  const previousCellKeysRef = React.useRef<readonly string[] | null>(null);
  const { soundEnabled, soundVolume } = model.settings;

  React.useEffect(
    () => () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    },
    [],
  );

  React.useEffect(() => {
    if (!soundEnabled) {
      return undefined;
    }

    const resumeEngine = (): void => {
      engineRef.current?.resume();
    };

    window.addEventListener("pointerdown", resumeEngine, true);

    return () => window.removeEventListener("pointerdown", resumeEngine, true);
  }, [soundEnabled]);

  React.useEffect(() => {
    const cellKeys = model.cells.map(
      (cell) => `${cell.char}${cell.messageFlashColor ?? ""}`,
    );
    const previousCellKeys = previousCellKeysRef.current;
    previousCellKeysRef.current = cellKeys;

    if (
      !soundEnabled ||
      !isPlaying ||
      !previousCellKeys ||
      previousCellKeys.length !== cellKeys.length
    ) {
      return;
    }

    const clicks: VestaboardFlapClick[] = [];

    for (let index = 0; index < cellKeys.length; index += 1) {
      if (previousCellKeys[index] === cellKeys[index]) {
        continue;
      }

      const cell = model.cells[index];

      if (!cell) {
        continue;
      }

      clicks.push({
        columnRatio: model.columns <= 1 ? 0.5 : cell.col / (model.columns - 1),
      });
    }

    if (clicks.length === 0) {
      return;
    }

    engineRef.current ??= createVestaboardAudioEngine({ monitor: true });
    engineRef.current.resume();
    engineRef.current.playFlapClicks(clicks, soundVolume);
  }, [isPlaying, model, soundEnabled, soundVolume]);
}

export function VestaboardRenderer(): React.JSX.Element {
  const { state } = useCreativeAppsKit();
  const settings = React.useMemo(
    () => resolveVestaboardSettings(state.values, state.canvas.size),
    [state.canvas.size, state.values],
  );
  const previewTimeSeconds = useCoalescedPreviewTime(state.timeline);
  const hasTargetMessage = settings.targetMessage.trim().length > 0;
  const durationSeconds = state.timeline.durationSeconds;
  const progress = getVestaboardAnimationProgress({
    durationSeconds,
    finalHoldSeconds: settings.finalHoldSeconds,
    hasTargetMessage,
    timeSeconds: previewTimeSeconds,
  });
  const model = React.useMemo(
    () =>
      buildVestaboardModel(settings, {
        durationSeconds,
        fieldProgress: progress.fieldProgress,
        phraseProgress: progress.phraseProgress,
      }),
    [durationSeconds, progress.fieldProgress, progress.phraseProgress, settings],
  );

  useVestaboardFlapSound({ isPlaying: state.timeline.isPlaying, model });

  return <VestaboardOutput model={model} settings={settings} />;
}

const VestaboardOutput = React.memo(function VestaboardOutput({
  model,
  settings,
}: {
  model: ReturnType<typeof buildVestaboardModel>;
  settings: ReturnType<typeof resolveVestaboardSettings>;
}): React.JSX.Element {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      data-creative-apps-kit-product-output=""
      data-testid="vestaboard-output"
      style={{ background: settings.background }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        data-testid="vestaboard-background-layer"
        style={{ background: settings.background }}
      />
      <div
        className="absolute left-1/2"
        data-cell-count={model.cellCount}
        data-columns={model.columns}
        data-flipping-count={model.flippingCellCount}
        data-rows={model.rows}
        data-shake-x={model.shakeX.toFixed(3)}
        data-shake-y={model.shakeY.toFixed(3)}
        data-testid="vestaboard-foreground-layer"
        style={{
          height: model.boardHeight,
          top: 0,
          transform: `translateX(calc(-50% + ${model.shakeX}px)) translateY(${model.shakeY}px) scale(${model.fitScale})`,
          transformOrigin: "top center",
          width: model.boardWidth,
        }}
      >
        {model.cells.map((cell) => {
          const typography = cell.isPhrase ? settings.messageTypography : settings.fieldTypography;
          const fontFamily = getVestaboardFontFamily(typography);
          const lineHeight = getVestaboardLineHeightPx(typography);
          const trailAlpha = getVestaboardTrailAlpha(settings, cell);

          return (
            <div
              className="absolute grid place-items-center overflow-hidden"
              data-char={cell.char}
              data-col={cell.col}
              data-flipping={cell.isFlipping ? "true" : "false"}
              data-phrase={cell.isPhrase ? "true" : "false"}
              data-message-flash-fill={cell.messageFlashColor ? "true" : "false"}
              data-row={cell.row}
              data-testid={`vestaboard-cell-${cell.row}-${cell.col}`}
              key={`${cell.row}-${cell.col}`}
              style={{
                backgroundColor: cell.messageFlashColor
                  ? cell.messageFlashColor
                  : getVestaboardRgbaColorFromParts(settings.cellFill, cell.fillOpacity),
                borderColor: getVestaboardRgbaColor(settings.cellBorder),
                borderRadius: model.cellRadius,
                borderStyle: "solid",
                borderWidth: 1,
                boxSizing: "border-box",
                height: model.cellHeight,
                left: cell.x,
                top: cell.y,
                width: model.cellWidth,
              }}
            >
              {trailAlpha > 0 && cell.trailChar ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none select-none text-center"
                  data-testid={`vestaboard-trail-${cell.row}-${cell.col}`}
                  style={{
                    color: settings.textColor,
                    display: "inline-block",
                    fontFamily,
                    fontSize: typography.fontSize,
                    fontWeight: typography.fontWeight,
                    gridArea: "1 / 1",
                    height: lineHeight,
                    letterSpacing: getVestaboardLetterSpacing(typography),
                    lineHeight: `${lineHeight}px`,
                    opacity: trailAlpha,
                  }}
                >
                  {cell.trailChar}
                </span>
              ) : null}
              {cell.char && cell.char !== " " ? (
                <span
                  className="select-none text-center"
                  data-creative-apps-kit-product-text=""
                  data-testid={`vestaboard-char-${cell.row}-${cell.col}`}
                  style={{
                    color: settings.textColor,
                    display: "inline-block",
                    fontFamily,
                    fontSize: typography.fontSize,
                    fontWeight: typography.fontWeight,
                    gridArea: "1 / 1",
                    height: lineHeight,
                    letterSpacing: getVestaboardLetterSpacing(typography),
                    lineHeight: `${lineHeight}px`,
                    opacity: cell.opacity / 100,
                  }}
                >
                  {cell.char}
                </span>
              ) : null}
            </div>
          );
        })}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          data-testid="vestaboard-edge-overlay-layer"
        >
          {model.cells.map((cell) => {
            const edgeColor = getVestaboardRgbaColorFromParts(
              settings.cellBorder.hex,
              cell.bottomHighlightOpacity,
            );
            const shouldRenderEdge = cell.bottomHighlightOpacity > 0;

            return (
              <div
                className="absolute overflow-hidden"
                data-testid={`vestaboard-edge-cell-${cell.row}-${cell.col}`}
                key={`edge-${cell.row}-${cell.col}`}
                style={{
                  borderRadius: model.cellRadius,
                  boxSizing: "border-box",
                  height: model.cellHeight,
                  left: cell.x,
                  top: cell.y,
                  width: model.cellWidth,
                }}
              >
                {shouldRenderEdge ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute"
                    data-testid={`vestaboard-bottom-highlight-${cell.row}-${cell.col}`}
                    style={{
                      backgroundColor: edgeColor,
                      bottom: 0,
                      height: 1,
                      left: 0,
                      right: 0,
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
