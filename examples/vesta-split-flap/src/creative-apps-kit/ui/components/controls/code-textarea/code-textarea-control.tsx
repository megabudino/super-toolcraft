"use client";

import * as React from "react";

import { ControlFieldLabel } from "../../control-layout";
import { Field, Textarea } from "../../primitives";
import { type ControlValueChangeHandler } from "../control-types";

export type CodeTextareaControlProps = {
  defaultValue?: string;
  name: string;
  onValueChange?: ControlValueChangeHandler<string>;
  value: string;
};

export function CodeTextareaControl({
  defaultValue,
  name,
  onValueChange,
  value,
}: CodeTextareaControlProps): React.JSX.Element {
  const [currentValue, setCurrentValue] = React.useState(value);
  const valueRef = React.useRef(value);
  const defaultValueRef = React.useRef(defaultValue ?? value);

  React.useEffect(() => {
    valueRef.current = value;
    setCurrentValue(value);
  }, [value]);

  React.useEffect(() => {
    defaultValueRef.current = defaultValue ?? value;
  }, [defaultValue, value]);

  function commitValue(nextValue = currentValue): void {
    const committedValue =
      nextValue.trim() === "" ? defaultValueRef.current : nextValue;

    setCurrentValue(committedValue);

    if (committedValue !== valueRef.current) {
      onValueChange?.(committedValue);
    }
  }

  return (
    <Field className="min-w-0 gap-2">
      <div className="flex items-center">
        <ControlFieldLabel>{name}</ControlFieldLabel>
      </div>
      <Textarea
        aria-label={name}
        className="max-h-[calc(12lh+12px)] min-h-[84px] overflow-y-auto font-mono"
        onBlur={() => commitValue()}
        onChange={(event) => setCurrentValue(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            commitValue(event.currentTarget.value);
            event.currentTarget.blur();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            setCurrentValue(valueRef.current);
            event.currentTarget.blur();
          }
        }}
        size="sm"
        value={currentValue}
      />
    </Field>
  );
}
