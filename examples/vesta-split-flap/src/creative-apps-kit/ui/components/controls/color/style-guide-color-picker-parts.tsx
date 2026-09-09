"use client";

import {
  useMemo,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "../../primitives/input-group";
import { Slider } from "../../primitives/slider";
import { StaticSelect } from "../select";
import {
  getColorChannels,
  getEditableChannelHex,
  type ColorChannels,
  type ColorFormatMode,
  type ColorSurfaceModel,
} from "./style-guide-color-picker-channel-utils";
import { type HsvColor } from "../../../lib/style-guide-color-utils";
import { cn } from "../../../lib/utils";

export { getColorChannels } from "./style-guide-color-picker-channel-utils";

const HUE_RAIL_BACKGROUND =
  "linear-gradient(90deg, #ff0000 0%, #ffff00 16.67%, #00ff00 33.33%, #00ffff 50%, #0000ff 66.67%, #ff00ff 83.33%, #ff0000 100%)";
const RGB_BLUE_RAIL_BACKGROUND = "linear-gradient(90deg, rgb(0 0 0), rgb(0 0 255))";

export function getHueSliderValue(
  nextValue: number | readonly number[],
  fallbackHue: number,
) {
  return Array.isArray(nextValue) ? (nextValue[0] ?? fallbackHue) : nextValue;
}

type ColorSurfaceProps = {
  surfaceRef: RefObject<HTMLDivElement | null>;
  surfaceLabel: string;
  surfaceClassName?: string;
  disabled: boolean;
  hueColor: string;
  currentColorHex: string;
  colorModel: ColorSurfaceModel;
  optimisticColor: HsvColor;
  isSurfaceDragging: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onThumbPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

function getRgbCss([red, green, blue]: [number, number, number]): string {
  return `rgb(${red} ${green} ${blue})`;
}

export function getColorSurfaceThumbPosition({
  colorModel,
  currentColorHex,
  optimisticColor,
}: {
  colorModel: ColorSurfaceModel;
  currentColorHex: string;
  optimisticColor: HsvColor;
}): { left: string; top: string } {
  const channels = getColorChannels(currentColorHex);

  if (colorModel === "rgb") {
    const [red, green] = channels.rgb;

    return {
      left: `${(red / 255) * 100}%`,
      top: `${(1 - green / 255) * 100}%`,
    };
  }

  if (colorModel === "hsl") {
    const [, saturation, lightness] = channels.hsl;

    return {
      left: `${saturation}%`,
      top: `${100 - lightness}%`,
    };
  }

  return {
    left: `${optimisticColor.s * 100}%`,
    top: `${(1 - optimisticColor.v) * 100}%`,
  };
}

export function getColorSurfaceStyle({
  colorModel,
  currentColorHex,
  hueColor,
}: {
  colorModel: ColorSurfaceModel;
  currentColorHex: string;
  hueColor: string;
}): CSSProperties {
  const channels = getColorChannels(currentColorHex);

  if (colorModel === "rgb") {
    const blue = channels.rgb[2];

    return {
      backgroundColor: getRgbCss([0, 0, blue]),
      backgroundImage: [
        "linear-gradient(to right, rgb(0 0 0), rgb(255 0 0))",
        "linear-gradient(to top, rgb(0 0 0), rgb(0 255 0))",
      ].join(", "),
      backgroundBlendMode: "screen",
    };
  }

  if (colorModel === "hsl") {
    const [hue] = channels.hsl;

    return {
      backgroundImage: [
        "linear-gradient(to bottom, #fff 0%, transparent 50%, #000 100%)",
        `linear-gradient(to right, hsl(${hue} 0% 50%), hsl(${hue} 100% 50%))`,
      ].join(", "),
    };
  }

  return {
    backgroundColor: hueColor,
  };
}

export function getColorSurfaceSliderConfig({
  colorModel,
  currentColorHex,
  hueLabel,
  optimisticColor,
}: {
  colorModel: ColorSurfaceModel;
  currentColorHex: string;
  hueLabel: string;
  optimisticColor: HsvColor;
}): {
  label: string;
  max: number;
  railBackground: string;
  value: number;
} {
  if (colorModel === "rgb") {
    const [, , blue] = getColorChannels(currentColorHex).rgb;

    return {
      label: "RGB blue channel",
      max: 255,
      railBackground: RGB_BLUE_RAIL_BACKGROUND,
      value: blue,
    };
  }

  return {
    label: hueLabel,
    max: 360,
    railBackground: HUE_RAIL_BACKGROUND,
    value: optimisticColor.h,
  };
}

export function ColorSurface({
  surfaceRef,
  surfaceLabel,
  surfaceClassName,
  disabled,
  hueColor,
  currentColorHex,
  colorModel,
  optimisticColor,
  isSurfaceDragging,
  onPointerDown,
  onThumbPointerDown,
}: ColorSurfaceProps) {
  const thumbPosition = getColorSurfaceThumbPosition({
    colorModel,
    currentColorHex,
    optimisticColor,
  });

  return (
    <div
      ref={surfaceRef}
      data-slot="style-guide-color-surface"
      data-color-model={colorModel}
      aria-label={surfaceLabel}
      className={cn(
        "group/surface relative aspect-square w-full shrink-0 touch-none rounded-t-[8px]",
        surfaceClassName,
        disabled && "cursor-not-allowed opacity-60",
      )}
      style={getColorSurfaceStyle({ colorModel, currentColorHex, hueColor })}
      onPointerDown={onPointerDown}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-[8px]">
        {colorModel === "hsb" ? (
          <>
            <div className="absolute inset-0 bg-linear-to-r from-white to-transparent" />
            <div className="absolute inset-0 bg-linear-to-t from-black to-transparent" />
          </>
        ) : null}
        <div
          data-slot="style-guide-color-surface-divider"
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px bg-[color:color-mix(in_oklab,var(--border)_6%,transparent)]"
        />
      </div>
      <div
        data-slot="style-guide-color-surface-thumb"
        aria-hidden
        className={cn(
          "absolute size-[14px] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 border-foreground shadow-[0_1px_4px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-out group-hover/surface:scale-[1.4286]",
          isSurfaceDragging && "scale-[1.4286]",
        )}
        style={{
          backgroundColor: currentColorHex,
          left: thumbPosition.left,
          top: thumbPosition.top,
        }}
        onPointerDown={onThumbPointerDown}
      />
    </div>
  );
}

type ColorModelSliderProps = {
  label: string;
  disabled: boolean;
  max: number;
  railBackground: string;
  value: number;
  onDragStateChange: (nextIsDragging: boolean) => void;
  onPreviewChange: (nextValue: number) => void;
  onCommit: (nextValue: number) => void;
};

export function ColorModelSlider({
  label,
  disabled,
  max,
  railBackground,
  value,
  onDragStateChange,
  onPreviewChange,
  onCommit,
}: ColorModelSliderProps) {
  return (
    <div
      data-slot="style-guide-color-hue"
      className={cn(
        "relative w-full",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <div
        data-slot="style-guide-color-hue-rail"
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
        style={{ background: railBackground }}
      />
      <Slider
        aria-label={label}
        className={cn(
          "relative cursor-pointer [--slider-active-color:var(--foreground)] [--slider-track-color:transparent]",
          "[&_[data-slot=slider-dot]]:rounded-full",
          "[&_[data-slot=slider-thumb]]:rounded-full",
          "[&_[data-slot=slider-range]]:transition-none [&_[data-slot=slider-thumb]]:transition-none",
          disabled && "cursor-not-allowed",
        )}
        disabled={disabled}
        getAriaLabel={() => label}
        max={max}
        min={0}
        onPointerCancelCapture={() => onDragStateChange(false)}
        onPointerDownCapture={() => onDragStateChange(true)}
        onPointerUpCapture={() => onDragStateChange(false)}
        onValueChange={(nextValue) => onPreviewChange(getHueSliderValue(nextValue, value))}
        onValueCommitted={(nextValue) => onCommit(getHueSliderValue(nextValue, value))}
        showFill={false}
        step={1}
        value={[value]}
        variant="continuous"
      />
    </div>
  );
}

type ColorFooterProps = {
  resolvedHexInputId: string;
  hexInputLabel: string;
  disabled: boolean;
  draftHexValue: string;
  onHexFocus: () => void;
  onHexChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onHexBlur: () => void;
  onHexKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onColorValueFocus: () => void;
  onColorValueChange: (nextHex: string) => void;
  onColorValueBlur: () => void;
  mode: ColorFormatMode;
  onModeChange: (nextMode: ColorFormatMode) => void;
};

const COLOR_FORMAT_MODES = [
  { label: "Hex", value: "hex" },
  { label: "RGB", value: "rgb" },
  { label: "HSL", value: "hsl" },
  { label: "HSB", value: "hsb" },
] as const satisfies ReadonlyArray<{ label: string; value: ColorFormatMode }>;

const colorFormatSelectWidth = `calc(${Math.max(
  ...COLOR_FORMAT_MODES.map((formatMode) => formatMode.label.length),
)}ch + 2rem)`;

const colorValueInputGroupClassName = "h-6 min-w-0 flex-1";

const colorValueInputClassName =
  "min-w-0 border-l border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] px-1 text-center text-xs font-mono first:border-l-0";

function toColorFormatMode(value: unknown): ColorFormatMode | null {
  const candidate =
    typeof value === "string"
      ? value
      : value && typeof value === "object" && "value" in value
        ? String(value.value)
        : null;

  return COLOR_FORMAT_MODES.some((formatMode) => formatMode.value === candidate)
    ? (candidate as ColorFormatMode)
    : null;
}

function ColorFormatSelect({
  disabled,
  mode,
  onModeChange,
}: {
  disabled: boolean;
  mode: ColorFormatMode;
  onModeChange: (nextMode: ColorFormatMode) => void;
}) {
  return (
    <div className="min-w-0 shrink-0" style={{ width: colorFormatSelectWidth }}>
      <StaticSelect
        disabled={disabled}
        options={COLOR_FORMAT_MODES}
        scrollFadeValue={false}
        size="sm"
        triggerClassName="text-[11px]"
        value={mode}
        onValueChange={(nextMode) => {
          const resolvedMode = toColorFormatMode(nextMode);

          if (resolvedMode) onModeChange(resolvedMode);
        }}
      />
    </div>
  );
}

function ColorValueCells({
  channels,
  disabled,
  mode,
  onColorValueBlur,
  onColorValueChange,
  onColorValueFocus,
}: {
  channels: ColorChannels;
  disabled: boolean;
  mode: ColorFormatMode;
  onColorValueBlur: () => void;
  onColorValueChange: (nextHex: string) => void;
  onColorValueFocus: () => void;
}) {
  if (mode === "css") {
    const [red, green, blue] = channels.rgb;

    return (
      <InputGroup
        data-slot="style-guide-color-value-cells"
        className={colorValueInputGroupClassName}
        size="sm"
      >
        <InputGroupInput
          aria-label="CSS color value"
          className="min-w-0 px-2 font-mono text-xs"
          disabled={disabled}
          readOnly
          value={`rgb(${red} ${green} ${blue})`}
        />
      </InputGroup>
    );
  }

  const values =
    mode === "rgb"
      ? [...channels.rgb, 100]
      : mode === "hsl"
        ? [...channels.hsl, 100]
        : [...channels.hsb, 100];

  return (
    <InputGroup
      data-slot="style-guide-color-value-cells"
      className={colorValueInputGroupClassName}
      size="sm"
    >
      {values.map((value, index) => {
        const isAlphaChannel = index === 3;

        return (
          <InputGroupInput
            aria-label={`${mode.toUpperCase()} channel ${index + 1}`}
            className={colorValueInputClassName}
            disabled={disabled}
            inputMode="numeric"
            key={`${mode}-${index}`}
            readOnly={isAlphaChannel}
            value={String(value)}
            onBlur={isAlphaChannel ? undefined : onColorValueBlur}
            onChange={(event) => {
              const nextHex = getEditableChannelHex({
                channels,
                channelIndex: index,
                mode,
                rawValue: event.target.value,
              });

              if (nextHex) onColorValueChange(nextHex);
            }}
            onFocus={
              isAlphaChannel
                ? undefined
                : (event) => {
                    event.currentTarget.select();
                    onColorValueFocus();
                  }
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === "Escape") {
                event.currentTarget.blur();
              }
            }}
          />
        );
      })}
      <InputGroupAddon align="inline-end" className="pr-1.5 pl-0">
        <InputGroupText>%</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  );
}

export function ColorFooter({
  resolvedHexInputId,
  hexInputLabel,
  disabled,
  draftHexValue,
  onHexFocus,
  onHexChange,
  onHexBlur,
  onHexKeyDown,
  onColorValueFocus,
  onColorValueChange,
  onColorValueBlur,
  mode,
  onModeChange,
}: ColorFooterProps) {
  const channels = useMemo(
    () => getColorChannels(draftHexValue),
    [draftHexValue],
  );

  return (
    <div
      data-slot="style-guide-color-footer"
      className="flex w-full shrink-0 items-center border-t border-[color:color-mix(in_oklab,var(--border)_6%,transparent)] px-3 py-3"
    >
      <div
        data-slot="style-guide-color-footer-row"
        className="flex w-full min-w-0 items-center gap-1.5"
      >
        <ColorFormatSelect
          disabled={disabled}
          mode={mode}
          onModeChange={onModeChange}
        />
        {mode === "hex" ? (
          <InputGroup className="h-6 min-w-0 flex-1" size="sm">
            <InputGroupInput
              id={resolvedHexInputId}
              type="text"
              inputMode="text"
              spellCheck={false}
              autoCapitalize="characters"
              autoCorrect="off"
              disabled={disabled}
              aria-label={hexInputLabel}
              className="min-w-0 font-mono text-xs"
              value={draftHexValue}
              onFocus={onHexFocus}
              onChange={onHexChange}
              onBlur={onHexBlur}
              onKeyDown={onHexKeyDown}
            />
          </InputGroup>
        ) : (
          <ColorValueCells
            channels={channels}
            disabled={disabled}
            mode={mode}
            onColorValueBlur={onColorValueBlur}
            onColorValueChange={onColorValueChange}
            onColorValueFocus={onColorValueFocus}
          />
        )}
      </div>
    </div>
  );
}
