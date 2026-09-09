import * as React from "react";

import {
  shouldIncludeToolcraftPreviewBackground,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import {
  useToolcraftPipeline,
  useToolcraftSelector,
} from "@/toolcraft/runtime/react";

import {
  readSpiralGallerySettings,
  selectSpiralGalleryImages,
} from "./spiral-gallery-settings";
import {
  spiralGalleryPipelinePasses,
} from "./spiral-gallery-pipeline";
import {
  createSpiralGalleryResource,
  disposeSpiralGalleryResource,
} from "./spiral-gallery-resource";
import { setActiveSpiralGalleryResource } from "./spiral-gallery-export";
import type {
  SpiralGalleryFrameSnapshot,
  SpiralGalleryResource,
} from "./spiral-gallery-types";
import styles from "./spiral-gallery.module.css";

const selectState = (state: ToolcraftState) => state;

const emptySnapshot: SpiralGalleryFrameSnapshot = {
  cardCount: 0,
  currentIndex: 0,
  flex: 0,
  frame: 0,
  settled: true,
  shadowSignature: "",
  texturesReady: true,
};

export function SpiralGalleryCanvas(): React.JSX.Element {
  const state = useToolcraftSelector(selectState);
  const pipeline = useToolcraftPipeline();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const stateRef = React.useRef(state);
  stateRef.current = state;
  const [resource, setResource] = React.useState<SpiralGalleryResource | null>(null);
  const [snapshot, setSnapshot] = React.useState(emptySnapshot);
  const [dragging, setDragging] = React.useState(false);
  const snapshotRef = React.useRef(snapshot);
  snapshotRef.current = snapshot;
  const scheduleRenderRef = React.useRef<() => void>(() => undefined);

  const settings = readSpiralGallerySettings(state);
  const images = selectSpiralGalleryImages(state);
  const hasImages = images.length > 0;
  const includeBackground = shouldIncludeToolcraftPreviewBackground({ state });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let active = true;

    const create = () => createSpiralGalleryResource(canvas);
    if (!pipeline) {
      const fallback = create();
      setResource(fallback);
      return () => disposeSpiralGalleryResource(fallback);
    }

    void pipeline
      .runPass(
        spiralGalleryPipelinePasses.resource,
        { "canvas.element": canvas },
        (context) =>
          context.getOrCreateResource(
            [canvas],
            create,
            disposeSpiralGalleryResource,
          ),
      )
      .then((nextResource) => {
        if (active) setResource(nextResource);
      });

    return () => {
      active = false;
    };
  }, [pipeline]);

  React.useEffect(() => {
    setActiveSpiralGalleryResource(resource);
    return () => setActiveSpiralGalleryResource(null);
  }, [resource]);

  React.useEffect(() => {
    if (!resource) return;
    let animationFrame = 0;
    let active = true;
    let renderPending = false;

    const scheduleRender = () => {
      if (!active || renderPending) return;
      renderPending = true;
      animationFrame = requestAnimationFrame(renderFrame);
    };

    const commitSnapshot = (nextSnapshot: SpiralGalleryFrameSnapshot) => {
      if (!active) return;
      const canvas = resource.canvas;
      canvas.dataset.imageGalleryCardCount = String(nextSnapshot.cardCount);
      canvas.dataset.imageGalleryCurrentIndex = String(nextSnapshot.currentIndex);
      canvas.dataset.imageGalleryFlex = nextSnapshot.flex.toFixed(5);
      canvas.dataset.imageGallerySettled = nextSnapshot.settled ? "true" : "false";
      canvas.dataset.imageGalleryShadow = nextSnapshot.shadowSignature;
      canvas.dataset.imageGalleryTexturesReady = nextSnapshot.texturesReady
        ? "true"
        : "false";
      canvas.dataset.imageGalleryFrameSignature = `${nextSnapshot.frame}:${nextSnapshot.currentIndex}:${nextSnapshot.flex.toFixed(4)}:${nextSnapshot.cardCount}`;
      const previous = snapshotRef.current;
      if (
        previous.cardCount !== nextSnapshot.cardCount ||
        previous.currentIndex !== nextSnapshot.currentIndex
      ) {
        snapshotRef.current = nextSnapshot;
        setSnapshot(nextSnapshot);
      }
      if (!hasImages) return;
      if (!nextSnapshot.texturesReady) {
        void resource.ready().then(scheduleRender);
      } else if (!nextSnapshot.settled) {
        scheduleRender();
      }
    };

    const renderFrame = (now: number) => {
      if (!active) return;
      renderPending = false;
      const currentState = stateRef.current;
      const render = () =>
        resource.render({
          includeBackground: shouldIncludeToolcraftPreviewBackground({
            state: currentState,
          }),
          now,
          state: currentState,
        });
      if (pipeline) {
        void pipeline
          .runPass(spiralGalleryPipelinePasses.preview, undefined, render)
          .then(commitSnapshot);
      } else {
        commitSnapshot(render());
      }
    };

    scheduleRenderRef.current = scheduleRender;
    scheduleRender();
    return () => {
      active = false;
      scheduleRenderRef.current = () => undefined;
      cancelAnimationFrame(animationFrame);
    };
  }, [hasImages, pipeline, resource]);

  React.useEffect(() => {
    scheduleRenderRef.current();
  }, [state]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !resource) return;
    let previousY = 0;
    let activePointerId: number | null = null;

    const updatePointer = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;
      resource.setPointer(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
      );
    };
    const onWheel = (event: WheelEvent) => {
      if (!(event.target instanceof Node) || !canvas.contains(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      resource.nudge("wheel", event.deltaY);
      scheduleRenderRef.current();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !hasImages) return;
      event.preventDefault();
      event.stopPropagation();
      activePointerId = event.pointerId;
      previousY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
      canvas.focus({ preventScroll: true });
      resource.setDragging(true);
      updatePointer(event);
      scheduleRenderRef.current();
      setDragging(true);
    };
    const onPointerMove = (event: PointerEvent) => {
      updatePointer(event);
      if (activePointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      resource.nudge("drag", previousY - event.clientY);
      scheduleRenderRef.current();
      previousY = event.clientY;
    };
    const endPointer = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return;
      event.stopPropagation();
      activePointerId = null;
      resource.setDragging(false);
      scheduleRenderRef.current();
      setDragging(false);
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!hasImages) return;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        resource.nudge("key", -1);
        scheduleRenderRef.current();
      }
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        resource.nudge("key", 1);
        scheduleRenderRef.current();
      }
    };

    window.addEventListener("wheel", onWheel, { capture: true, passive: false });
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("lostpointercapture", endPointer);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endPointer);
      canvas.removeEventListener("pointercancel", endPointer);
      canvas.removeEventListener("lostpointercapture", endPointer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [hasImages, resource]);

  const style = {
    "--image-gallery-background": settings.background,
  } as React.CSSProperties;

  return (
    <div
      className={styles.root}
      data-dragging={dragging ? "true" : "false"}
      data-gallery-layout={settings.layout.mode}
      data-image-gallery-card-count={snapshot.cardCount}
      data-image-gallery-current-index={snapshot.currentIndex}
      data-image-gallery-root="true"
      data-toolcraft-product-output
      style={style}
    >
      {hasImages && includeBackground ? (
        <div
          className={styles.background}
          data-image-gallery-background="true"
        />
      ) : null}
      <canvas
        aria-label="Interactive image gallery"
        className={styles.canvas}
        data-image-gallery-canvas="true"
        ref={canvasRef}
        role="img"
        tabIndex={0}
      />
    </div>
  );
}
