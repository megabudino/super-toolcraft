import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  createFineDetailsPreviewPromptGestureMessage,
  FINE_DETAILS_PREVIEW_VERSION,
  isPointInsideFineDetailsPromptDragRegion,
  isFineDetailsPreviewPromptGeometryMessage,
} from './fine-details-preview-protocol';

const previewSource = readFileSync(
  resolve(process.cwd(), 'src/app/fine-details-preview.tsx'),
  'utf8',
);

describe('Fine Details prompt gesture bridge', () => {
  it('uses protocol v17 for prompt geometry and gesture messages', () => {
    expect(FINE_DETAILS_PREVIEW_VERSION).toBe(17);
    expect(
      createFineDetailsPreviewPromptGestureMessage({
        phase: 'down',
        pointerId: 3,
        pointerType: 'mouse',
        x: 420,
        y: 240,
      }),
    ).toEqual({
      channel: 'recraft.fine-details',
      payload: {
        phase: 'down',
        pointerId: 3,
        pointerType: 'mouse',
        x: 420,
        y: 240,
      },
      type: 'prompt-gesture',
      version: 17,
    });

    expect(
      isFineDetailsPreviewPromptGeometryMessage({
        channel: 'recraft.fine-details',
        payload: {
          interactiveRects: [
            { bottom: 390, left: 330, right: 870, top: 340 },
            { bottom: 480, left: 740, right: 860, top: 420 },
          ],
          rect: { bottom: 500, left: 300, right: 900, top: 320 },
        },
        type: 'prompt-geometry',
        version: 17,
      }),
    ).toBe(true);
    expect(
      isFineDetailsPreviewPromptGeometryMessage({
        channel: 'recraft.fine-details',
        payload: {
          interactiveRects: [{ bottom: 390, left: 330, right: 870, top: 340 }],
          rect: { bottom: 200, left: 300, right: 900, top: 320 },
        },
        type: 'prompt-geometry',
        version: 17,
      }),
    ).toBe(false);
    expect(
      isFineDetailsPreviewPromptGeometryMessage({
        channel: 'recraft.fine-details',
        payload: {
          interactiveRects: [{ bottom: 390, left: 280, right: 870, top: 340 }],
          rect: { bottom: 500, left: 300, right: 900, top: 320 },
        },
        type: 'prompt-geometry',
        version: 17,
      }),
    ).toBe(false);
    expect(
      isFineDetailsPreviewPromptGeometryMessage({
        channel: 'recraft.fine-details',
        payload: { interactiveRects: [], rect: null },
        type: 'prompt-geometry',
        version: 17,
      }),
    ).toBe(true);
  });

  it('accepts padding and free lower-row space but excludes every interactive rectangle', () => {
    const rect = { bottom: 600, left: 400, right: 1200, top: 300 };
    const interactiveRects = [
      { bottom: 430, left: 440, right: 1160, top: 330 },
      { bottom: 570, left: 1040, right: 1160, top: 470 },
    ];

    expect(
      isPointInsideFineDetailsPromptDragRegion({ x: 420, y: 350 }, rect, interactiveRects),
    ).toBe(true);
    expect(
      isPointInsideFineDetailsPromptDragRegion({ x: 500, y: 350 }, rect, interactiveRects),
    ).toBe(false);
    expect(
      isPointInsideFineDetailsPromptDragRegion({ x: 1100, y: 520 }, rect, interactiveRects),
    ).toBe(false);
    expect(
      isPointInsideFineDetailsPromptDragRegion({ x: 800, y: 520 }, rect, interactiveRects),
    ).toBe(true);
  });

  it('keeps a defensive host bridge and routes only prompt hits through it', () => {
    expect(previewSource).toMatch(/isPointInsideFineDetailsPromptDragRegion/);
    expect(previewSource).toMatch(/createFineDetailsPreviewPromptGestureMessage/);
    expect(previewSource).toMatch(/event\.stopPropagation\(\)/);
    expect(previewSource).toMatch(/activePromptPointerRef/);
    expect(previewSource).toMatch(/syncPromptCursor/);
    expect(previewSource).toMatch(/setProperty\('cursor', 'grabbing', 'important'\)/);
    expect(previewSource).toMatch(/setProperty\('cursor', 'grab', 'important'\)/);
    expect(previewSource).toMatch(/removeProperty\('cursor'\)/);
    expect(previewSource).toMatch(/cancelActivePromptPointer/);
    expect(previewSource).toMatch(/event\.data\.payload\.rect === null/);
    expect(previewSource).toMatch(/releasePointerCapture/);
  });

  it('keeps Carousel mode authoritative over host prompt geometry and gestures', () => {
    expect(previewSource).toMatch(/imagesModeRef/);
    expect(previewSource).toMatch(/React\.useLayoutEffect/);
    expect(previewSource).toMatch(/clearPromptInteraction/);
    expect(previewSource).toMatch(
      /isFineDetailsPreviewPromptGeometryMessage[\s\S]*imagesModeRef\.current !== 'carousel'/,
    );
    expect(previewSource.match(/imagesModeRef\.current !== 'carousel'/g)?.length ?? 0).toBeGreaterThanOrEqual(
      5,
    );
    expect(previewSource).toMatch(/data\.payload\.rect/);
    expect(previewSource).toMatch(/fineDetailsPromptRect = 'none'/);
    expect(previewSource).toMatch(/fineDetailsPromptInteractiveRects = '0'/);
  });

  it('recomputes cursor geometry from client coordinates and cancels lost capture', () => {
    expect(previewSource).toMatch(/type FineDetailsClientPoint/);
    expect(previewSource).toMatch(/promptPointerClientRef/);
    expect(previewSource).toMatch(/clientPoint\.clientX/);
    expect(previewSource).toMatch(/clientPoint\.clientY/);
    expect(previewSource).toMatch(/onLostPointerCapture/);
    expect(previewSource).toMatch(/phase: 'cancel'/);
  });

  it('keeps preview readiness subscribed while canvas height changes', () => {
    const getScenePointSource = previewSource.slice(
      previewSource.indexOf('const getScenePoint = React.useCallback'),
      previewSource.indexOf('const sendPromptGesture = React.useCallback'),
    );
    const messageSubscriptionSource = previewSource.slice(
      previewSource.indexOf('function receivePreviewMessage'),
      previewSource.indexOf('React.useEffect(() => {\n    requestPreviewReady()'),
    );

    expect(previewSource).toMatch(/sceneHeightRef/);
    expect(previewSource).toMatch(/sceneHeightRef\.current = settings\.height/);
    expect(getScenePointSource).toMatch(/sceneHeightRef\.current/);
    expect(getScenePointSource).not.toMatch(/settings\.height/);
    expect(getScenePointSource).toMatch(/\n\s*\[\],\n\s*\);/);
    expect(messageSubscriptionSource).toMatch(
      /\}, \[clearPromptInteraction, rejectPendingSaveRequests, sendPointerRest, syncPromptCursor\]\);/,
    );
    expect(messageSubscriptionSource).toMatch(/isPreviewReadyRef\.current = true/);
    expect(messageSubscriptionSource).toMatch(/isFineDetailsPreviewSaveResultMessage/);
    expect(messageSubscriptionSource).toMatch(/pending\.resolve\(\)/);
    expect(previewSource).toMatch(/sendFineDetailsPromptFlightCommandToPreview\(\{/);
  });
});
