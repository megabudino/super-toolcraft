import * as React from "react";
import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import type { ToolcraftCustomControlRendererProps } from "@/toolcraft/runtime/react";
import {
  Button,
  ControlFieldLabel,
  Field,
} from "@/toolcraft/ui";

import {
  isInsertedMeshPoint,
  MESH_MAX_COLUMNS,
  MESH_MAX_POINTS,
  readMeshColors,
  readMeshPointLayout,
} from "./mesh-model";
import styles from "./mesh-color-points-control.module.css";

const newPointColor = "#7C3AED";

type RenderBuiltInColor =
  ToolcraftCustomControlRendererProps["renderBuiltInColor"];
type MeshColorChangeMeta = Parameters<
  ToolcraftCustomControlRendererProps["setValue"]
>[1];

function MeshColorPointSelection({
  active,
  color,
  index,
  onChange,
  onSelect,
  renderBuiltInColor,
}: {
  active: boolean;
  color: string;
  index: number;
  onChange: (color: string, meta?: MeshColorChangeMeta) => void;
  onSelect: () => void;
  renderBuiltInColor: RenderBuiltInColor;
}): React.JSX.Element {
  const itemRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (active) itemRef.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <div
      aria-label={`Color point ${index + 1}`}
      aria-selected={active}
      className={styles.item}
      data-active={active ? "true" : "false"}
      data-mesh-color-point={index}
      onFocusCapture={onSelect}
      onPointerDown={onSelect}
      ref={itemRef}
      role="option"
    >
      {renderBuiltInColor({
        active,
        hex: color,
        name: `Point ${index + 1}`,
        onValueChange: (nextValue, meta) => onChange(nextValue.hex, meta),
        showLabel: false,
      })}
    </div>
  );
}

export function MeshColorPointsControl({
  dispatch,
  renderBuiltInColor,
  setValue,
  state,
  value,
}: ToolcraftCustomControlRendererProps<unknown>): React.JSX.Element {
  const colors = readMeshColors(value);
  const columns = Math.max(
    2,
    Math.min(MESH_MAX_COLUMNS, Number(state.values["mesh.columns"] ?? 4)),
  );
  const layout = readMeshPointLayout(state.values["mesh.points"], colors.length, columns);
  const activeIndex =
    layout.selectedIndices.length === 1 ? layout.selectedIndices[0]! : -1;
  const canRemove = isInsertedMeshPoint(layout, activeIndex);

  const selectPoint = (index: number) => {
    if (activeIndex === index) return;
    dispatch({
      history: "skip",
      label: "Select mesh color point",
      target: "mesh.points",
      type: "controls.setValue",
      value: {
        ...layout,
        selectedIndex: index,
        selectedIndices: [index],
      },
    });
  };

  const updateColor = (
    index: number,
    color: string,
    meta?: MeshColorChangeMeta,
  ) => {
    const next = [...colors];
    next[index] = color;
    setValue(next, meta ?? { history: "record" });
  };

  return (
    <div className={styles.root} data-mesh-color-points-control="true">
      <Field
        aria-label="Color points"
        className={styles.actions}
        orientation="horizontal"
      >
        <ControlFieldLabel className={styles.label}>Color points</ControlFieldLabel>
        <div className={styles.actionButtons}>
          <Button
            aria-label="Remove color point"
            disabled={!canRemove}
            onClick={() => {
              if (!canRemove) return;
              setValue(colors.filter((_, index) => index !== activeIndex), {
                history: "record",
              });
            }}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <MinusIcon />
          </Button>
          <Button
            aria-label="Add color point"
            disabled={colors.length >= MESH_MAX_POINTS}
            onClick={() =>
              setValue([...colors, newPointColor], { history: "record" })
            }
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <PlusIcon />
          </Button>
        </div>
      </Field>
      <div className={styles.items}>
        <div aria-label="Mesh color points" className={styles.list} role="listbox">
          {colors.map((color, index) => (
            <MeshColorPointSelection
              active={activeIndex === index}
              color={color}
              index={index}
              key={index}
              onChange={(nextColor, meta) => updateColor(index, nextColor, meta)}
              onSelect={() => selectPoint(index)}
              renderBuiltInColor={renderBuiltInColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
