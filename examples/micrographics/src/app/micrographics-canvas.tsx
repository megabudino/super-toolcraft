import * as React from "react";

import {
  shouldIncludeToolcraftPreviewBackground,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import {
  useToolcraftDispatch,
  useToolcraftPipelinePass,
  useToolcraftSelector,
  useToolcraftValue,
} from "@/toolcraft/runtime/react";

import { ElementPrimitives, GLOW_FILTER_ID, GlowFilter } from "./element-svg";
import {
  buildTextEditState,
  clientPointToCanvas,
  createGroupResizeGesture,
  imageTransform,
  parsePaletteColors,
  plainElement,
  posterStateEqual,
  resolveDragRect,
  resolveGroupResize,
  selectBackgroundImage,
  selectPosterState,
  stateSignature,
  useGlobalDeselect,
  useSelectionScale,
  type DragGesture,
  type PlacementGesture,
  type TextEditState,
} from "./micrographics-canvas-utils";
import styles from "./micrographics-canvas.module.css";
import {
  buildPosterScene,
  elementInk,
  parseElements,
  serializeElements,
  setContentCell,
} from "./poster-model";
import { isMicrographTemplateId } from "./template-catalog";
import { coverPresetSrc } from "./template-covers";
import type { MicrographElement } from "./poster-types";
import {
  createPosterSceneCacheInput,
  posterScenePass,
} from "./renderer-pipeline";
import { type ActiveGuides, type ResizeCorner } from "./selection-guides";
import {
  MultiSelectionOutlines,
  SelectionOverlay,
  TextEditorOverlay,
} from "./selection-overlay";
import {
  createTemplatePlacement,
  createTemplateRegionPlacement,
  MICROGRAPH_TEMPLATE_DRAG_TYPE,
} from "./template-placement";

export function MicrographicsCanvas(): React.JSX.Element {
  const dispatch = useToolcraftDispatch();
  const state = useToolcraftSelector(selectPosterState, posterStateEqual);
  const backgroundImage = useToolcraftSelector(selectBackgroundImage, Object.is);
  const signature = stateSignature(state);
  const sceneCacheInput = createPosterSceneCacheInput(state);
  const immediateScene = React.useMemo(() => buildPosterScene(state), [signature, state]);
  const scenePass = useToolcraftPipelinePass(
    posterScenePass,
    sceneCacheInput,
    () => buildPosterScene(state),
  );
  const scene = scenePass.status === "success" ? scenePass.result : immediateScene;
  const [selectedIds, setSelectedIds] = React.useState<readonly string[]>([]);
  const [textEdit, setTextEdit] = React.useState<TextEditState | null>(null);
  const [placementGesture, setPlacementGesture] =
    React.useState<PlacementGesture | null>(null);
  const [activeGuides, setActiveGuides] = React.useState<ActiveGuides | null>(null);
  const dragGestureRef = React.useRef<DragGesture | null>(null);
  const rootRef = React.useRef<SVGSVGElement | null>(null);
  const libraryTemplateValue = useToolcraftValue("library.template");
  const pendingTemplate = isMicrographTemplateId(libraryTemplateValue)
    ? libraryTemplateValue
    : null;
  const placing = pendingTemplate !== null;

  React.useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) => scene.elements.some((element) => element.id === id)),
    );
    setTextEdit((current) =>
      current && scene.elements.some((element) => element.id === current.elementId)
        ? current
        : null,
    );
  }, [scene.elements]);

  useGlobalDeselect(rootRef, () => {
    setSelectedIds([]);
    setTextEdit(null);
  });

  function upsertAuthored(...elements: readonly MicrographElement[]): MicrographElement[] {
    const authored = parseElements(state.values["composition.layout"]);
    for (const element of elements) {
      const index = authored.findIndex((entry) => entry.id === element.id);
      if (index >= 0) {
        authored[index] = element;
      } else {
        authored.push(element);
      }
    }
    return authored;
  }

  function commitElements(
    elements: readonly MicrographElement[],
    options: {
      history?: "merge" | "record" | "skip";
      historyGroup?: string;
      label: string;
    },
  ): void {
    dispatch({
      history: options.history,
      historyGroup: options.historyGroup,
      label: options.label,
      target: "composition.layout",
      type: "controls.setValue",
      value: JSON.stringify(serializeElements(elements)),
    });
  }

  function beginElementGesture(
    event: React.PointerEvent<SVGCircleElement | SVGGElement>,
    element: MicrographElement,
    elementIndex: number,
    mode: "move" | "resize",
    corner?: ResizeCorner,
  ): void {
    if (placing) {
      return;
    }
    event.stopPropagation();
    rootRef.current?.focus();
    if (event.shiftKey && mode === "move") {
      setSelectedIds((current) =>
        current.includes(element.id)
          ? current.filter((id) => id !== element.id)
          : [...current, element.id],
      );
      return;
    }
    const partOfGroup = selectedIds.includes(element.id) && selectedIds.length > 1;
    const groupStartElements =
      mode === "move" && partOfGroup
        ? scene.elements
            .filter((entry) => selectedIds.includes(entry.id) && entry.id !== element.id)
            .map(plainElement)
        : undefined;
    if (!partOfGroup) {
      setSelectedIds([element.id]);
    }
    dragGestureRef.current = {
      corner,
      elementIndex,
      groupStartElements,
      historyGroup: `element-transform-${elementIndex}-${event.pointerId}`,
      mode,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startElement: { ...element },
    };
  }

  function beginGroupResize(
    corner: ResizeCorner,
    event: React.PointerEvent<SVGCircleElement>,
  ): void {
    if (placing || selectedIds.length < 2) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    rootRef.current?.focus();
    dragGestureRef.current = createGroupResizeGesture(
      scene.elements.filter((entry) => selectedIds.includes(entry.id)).map(plainElement),
      corner,
      event,
    );
  }

  function placeElement(element: MicrographElement): void {
    commitElements(upsertAuthored(element), {
      history: "record",
      label: "Place element",
    });
    dispatch({
      history: "skip",
      target: "library.template",
      type: "controls.setValue",
      value: "",
    });
    setPlacementGesture(null);
    setSelectedIds([element.id]);
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>): void {
    if (placementGesture?.pointerId === event.pointerId) {
      const point = clientPointToCanvas(
        event,
        state.canvas.size.width,
        state.canvas.size.height,
      );
      setPlacementGesture((current) =>
        current ? { ...current, currentX: point.x, currentY: point.y } : current,
      );
      return;
    }

    const gesture = dragGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const deltaX =
      ((event.clientX - gesture.startClientX) / Math.max(1, bounds.width)) *
      state.canvas.size.width;
    const deltaY =
      ((event.clientY - gesture.startClientY) / Math.max(1, bounds.height)) *
      state.canvas.size.height;
    if (gesture.mode === "group-resize") {
      const resized = resolveGroupResize({
        canvasHeight: state.canvas.size.height,
        canvasWidth: state.canvas.size.width,
        deltaX,
        deltaY,
        gesture,
      });
      if (resized.length > 0) {
        commitElements(upsertAuthored(...resized), {
          history: "merge",
          historyGroup: gesture.historyGroup,
          label: "Scale selection",
        });
      }
      return;
    }
    const { guides, next } = resolveDragRect({
      canvasHeight: state.canvas.size.height,
      canvasWidth: state.canvas.size.width,
      deltaX,
      deltaY,
      gesture,
      neighbors: scene.elements
        .filter((element) => element.id !== gesture.startElement.id)
        .map(({ height, width, x, y }) => ({ height, width, x, y })),
      snapThreshold: Math.max(4, state.canvas.size.width * 0.006),
    });
    setActiveGuides(guides);
    const moved = [next];
    if (gesture.mode === "move" && gesture.groupStartElements?.length) {
      const effectiveDX = next.x - gesture.startElement.x;
      const effectiveDY = next.y - gesture.startElement.y;
      for (const member of gesture.groupStartElements) {
        moved.push({
          ...member,
          x: clamp(Math.round(member.x + effectiveDX), 0, Math.max(0, state.canvas.size.width - member.width)),
          y: clamp(Math.round(member.y + effectiveDY), 0, Math.max(0, state.canvas.size.height - member.height)),
        });
      }
    }
    commitElements(upsertAuthored(...moved), {
      history: "merge",
      historyGroup: gesture.historyGroup,
      label: gesture.mode === "move" ? "Move element" : "Resize element",
    });
  }

  function finishPointerGesture(event: React.PointerEvent<SVGSVGElement>): void {
    if (
      placementGesture?.pointerId === event.pointerId &&
      pendingTemplate
    ) {
      const seedBase = Number(state.values["composition.seed"] ?? 137);
      const moved = Math.hypot(
        event.clientX - placementGesture.startClientX,
        event.clientY - placementGesture.startClientY,
      );
      const base = {
        canvasHeight: state.canvas.size.height,
        canvasWidth: state.canvas.size.width,
        elementIndex: scene.elements.length,
        seed: seedBase,
        template: pendingTemplate,
      };

      placeElement(
        moved < 6
          ? createTemplatePlacement({
              ...base,
              point: {
                x: placementGesture.startX,
                y: placementGesture.startY,
              },
            })
          : createTemplateRegionPlacement({
              ...base,
              region: {
                height: Math.abs(
                  placementGesture.currentY - placementGesture.startY,
                ),
                width: Math.abs(
                  placementGesture.currentX - placementGesture.startX,
                ),
                x: Math.min(
                  placementGesture.startX,
                  placementGesture.currentX,
                ),
                y: Math.min(
                  placementGesture.startY,
                  placementGesture.currentY,
                ),
              },
            }),
      );
    }

    if (dragGestureRef.current?.pointerId === event.pointerId) {
      dragGestureRef.current = null;
      setActiveGuides(null);
    }
  }

  function cancelPointerGesture(event: React.PointerEvent<SVGSVGElement>): void {
    if (placementGesture?.pointerId === event.pointerId) {
      setPlacementGesture(null);
    }
    if (dragGestureRef.current?.pointerId === event.pointerId) {
      dragGestureRef.current = null;
      setActiveGuides(null);
    }
  }

  function handleCanvasPointerDown(event: React.PointerEvent<SVGSVGElement>): void {
    if (event.button !== 0) {
      return;
    }

    if (placing) {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      const point = clientPointToCanvas(
        event,
        state.canvas.size.width,
        state.canvas.size.height,
      );
      setTextEdit(null);
      setPlacementGesture({
        currentX: point.x,
        currentY: point.y,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX: point.x,
        startY: point.y,
      });
      return;
    }

    if (event.target !== event.currentTarget) {
      return;
    }
    setSelectedIds([]);
    setTextEdit(null);
  }

  function handleDragOver(event: React.DragEvent<SVGSVGElement>): void {
    if (
      Array.from(event.dataTransfer.types).includes(
        MICROGRAPH_TEMPLATE_DRAG_TYPE,
      )
    ) {
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "copy";
    }
  }

  function handleDrop(event: React.DragEvent<SVGSVGElement>): void {
    const templateValue = event.dataTransfer.getData(
      MICROGRAPH_TEMPLATE_DRAG_TYPE,
    );
    if (!isMicrographTemplateId(templateValue)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const point = clientPointToCanvas(
      event,
      state.canvas.size.width,
      state.canvas.size.height,
    );
    placeElement(
      createTemplatePlacement({
        canvasHeight: state.canvas.size.height,
        canvasWidth: state.canvas.size.width,
        elementIndex: scene.elements.length,
        point,
        seed: Number(state.values["composition.seed"] ?? 137),
        template: templateValue,
      }),
    );
  }

  function handleTextDoubleClick(
    elementIndex: number,
    textIndex: number,
    event: React.MouseEvent<SVGTextElement>,
  ): void {
    if (placing) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    dragGestureRef.current = null;
    setActiveGuides(null);
    const editState = buildTextEditState(scene.elements[elementIndex], elementIndex, textIndex);
    if (editState) {
      setTextEdit(editState);
    }
  }

  function commitTextValue(value: string): void {
    if (!textEdit) {
      return;
    }
    const element = scene.elements.find(
      (entry) => entry.id === textEdit.elementId,
    );
    if (!element) {
      return;
    }
    const safe = value.length > 0 ? value : " ";
    const content = textEdit.cell
      ? setContentCell(element.content, textEdit.cell, safe)
      : safe;
    commitElements(upsertAuthored({ ...plainElement(element), content }), {
      history: "merge",
      historyGroup: `text-edit-${element.id}-${textEdit.textIndex}`,
      label: "Edit element text",
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<SVGSVGElement>): void {
    if (textEdit) {
      return;
    }

    if (event.key === "Escape") {
      setSelectedIds([]);
      return;
    }

    if ((event.key === "Delete" || event.key === "Backspace") && selectedIds.length > 0) {
      event.preventDefault();
      const removed = scene.elements
        .filter((element) => selectedIds.includes(element.id))
        .map((element) => ({ ...plainElement(element), removed: true }));
      commitElements(upsertAuthored(...removed), {
        history: "record",
        label: "Delete element",
      });
      setSelectedIds([]);
    }
  }

  const selectedElementIndex =
    selectedIds.length === 1
      ? scene.elements.findIndex((element) => element.id === selectedIds[0])
      : -1;
  const selectedElement = scene.elements[selectedElementIndex] ?? null;
  const scaleValue = Number(useToolcraftValue("elements.scale") ?? 100) || 100;
  useSelectionScale({
    apply: (scaled) =>
      commitElements(upsertAuthored(...scaled), {
        history: "merge",
        historyGroup: "selection-scale",
        label: "Scale selection",
      }),
    canvasHeight: state.canvas.size.height,
    canvasWidth: state.canvas.size.width,
    scaleValue,
    selection: { elements: scene.elements, ids: selectedIds },
  });
  const paletteColors = parsePaletteColors(state.values["palette.colors"]);
  const presetCoverSrc = backgroundImage
    ? null
    : coverPresetSrc(state.values["source.preset"]);
  const includeBackground = shouldIncludeToolcraftPreviewBackground({ state });
  const overlayScale = Math.max(
    1,
    Math.min(state.canvas.size.width, state.canvas.size.height) / 720,
  );

  const selectionBox = placementGesture
    ? {
        height: Math.abs(placementGesture.currentY - placementGesture.startY),
        width: Math.abs(placementGesture.currentX - placementGesture.startX),
        x: Math.min(placementGesture.startX, placementGesture.currentX),
        y: Math.min(placementGesture.startY, placementGesture.currentY),
      }
    : null;

  return (
    <svg
      aria-label="Generated micrographics photo poster"
      className={`${styles.root} ${placing ? styles.placing : ""}`}
      data-placement-mode={placing ? "template" : "select"}
      data-toolcraft-product-output="micrographics"
      height={state.canvas.size.height}
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
      onPointerCancel={cancelPointerGesture}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointerGesture}
      ref={rootRef}
      role="img"
      tabIndex={-1}
      viewBox={`0 0 ${state.canvas.size.width} ${state.canvas.size.height}`}
      width={state.canvas.size.width}
    >
      <GlowFilter canvasHeight={state.canvas.size.height} canvasWidth={state.canvas.size.width} scene={scene} />
      <g data-micrographics-layer="background">
        {includeBackground ? (
          <rect
            className={styles.background}
            fill={scene.background}
            height={state.canvas.size.height}
            width={state.canvas.size.width}
          />
        ) : null}
        {includeBackground && backgroundImage ? (
          <image
            className={styles.backgroundImage}
            height={state.canvas.size.height}
            href={backgroundImage.dataUrl}
            preserveAspectRatio="xMidYMid slice"
            transform={imageTransform(
              backgroundImage,
              state.canvas.size.width,
              state.canvas.size.height,
            )}
            width={state.canvas.size.width}
          />
        ) : null}
        {includeBackground && presetCoverSrc ? (
          <image
            className={styles.backgroundImage}
            data-micrographics-cover-preset=""
            height={state.canvas.size.height}
            href={presetCoverSrc}
            preserveAspectRatio="xMidYMid slice"
            width={state.canvas.size.width}
          />
        ) : null}
      </g>

      <g data-micrographics-layer="foreground" filter={scene.glow > 0 ? `url(#${GLOW_FILTER_ID})` : undefined} opacity={scene.globalOpacity}>
        {scene.elements.map((element, elementIndex) => (
          <g
            className={styles.element}
            data-element-index={elementIndex}
            data-template-id={element.template}
            key={element.id}
            onPointerDown={(event) =>
              beginElementGesture(event, element, elementIndex, "move")
            }
            opacity={element.opacity / 100}
            transform={`translate(${element.x} ${element.y})`}
          >
            <rect
              className={styles.hitArea}
              data-micrographics-element-hit-area=""
              fill="transparent"
              height={element.height}
              width={element.width}
            />
            <ElementPrimitives
              element={element}
              hiddenTextIndex={
                textEdit?.elementId === element.id
                  ? textEdit.textIndex
                  : undefined
              }
              onTextDoubleClick={
                !placing
                  ? (textIndex, event) =>
                      handleTextDoubleClick(elementIndex, textIndex, event)
                  : undefined
              }
              scene={scene}
            />
          </g>
        ))}
      </g>

      <g
        className={styles.handleLayer}
        data-micrographics-layer="handles"
        data-toolcraft-product-editing-handle="selection"
      >
        {textEdit ? (
          <TextEditorOverlay
            color={elementInk(
              scene,
              scene.elements.find((entry) => entry.id === textEdit.elementId) ?? {
                color: undefined,
              },
            )}
            onCancel={() => {
              commitTextValue(textEdit.original);
              setTextEdit(null);
              rootRef.current?.focus();
            }}
            onCommit={commitTextValue}
            onDone={() => {
              setTextEdit(null);
              rootRef.current?.focus();
            }}
            textEdit={textEdit}
          />
        ) : null}
        {selectedElement && !textEdit ? (
          <SelectionOverlay
            canvasHeight={state.canvas.size.height}
            canvasWidth={state.canvas.size.width}
            element={selectedElement}
            guides={activeGuides}
            neighbors={scene.elements
              .filter((_, index) => index !== selectedElementIndex)
              .map(({ height, width, x, y }) => ({ height, width, x, y }))}
            onColorSelect={(color) => {
              commitElements(upsertAuthored({ ...plainElement(selectedElement), color }), {
                history: "record",
                label: "Change element color",
              });
            }}
            palette={paletteColors}
            onCornerPointerDown={(corner, event) =>
              beginElementGesture(
                event,
                selectedElement,
                selectedElementIndex,
                "resize",
                corner,
              )
            }
            scale={overlayScale}
            showMeasurements
          />
        ) : null}
        <MultiSelectionOutlines
          elements={scene.elements}
          ids={selectedIds}
          onCornerPointerDown={beginGroupResize}
          scale={overlayScale}
        />
        {selectionBox ? (
          <rect
            className={styles.placementBox}
            height={selectionBox.height}
            width={selectionBox.width}
            x={selectionBox.x}
            y={selectionBox.y}
          />
        ) : null}
      </g>
    </svg>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
