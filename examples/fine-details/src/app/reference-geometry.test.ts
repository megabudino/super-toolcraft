import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSectionPoint, getSectionRect } from '@/section/reference/reference-geometry';

afterEach(() => vi.unstubAllGlobals());

function elementAt(scale: number) {
  const viewport = {
    offsetWidth: 1920,
    getBoundingClientRect: () => ({ left: 120, top: 80, width: 1920 * scale }),
  };
  return {
    closest: () => viewport,
    getBoundingClientRect: () => ({ left: 120 + 40 * scale, top: 80 + 60 * scale,
      width: 200 * scale, height: 100 * scale }),
  } as unknown as Element;
}

describe('native section coordinates', () => {
  it.each([0.5, 1, 2])('removes editor pan and %sx zoom from pointer coordinates', scale => {
    expect(getSectionPoint(elementAt(scale), { clientX: 120 + 75 * scale, clientY: 80 + 90 * scale }))
      .toEqual({ x: 75, y: 90 });
  });

  it('keeps typography and prompt rectangles in canvas CSS pixels', () => {
    vi.stubGlobal('DOMRect', class {
      constructor(public x: number, public y: number, public width: number, public height: number) {}
    });
    expect(getSectionRect(elementAt(0.5))).toMatchObject({ x: 40, y: 60, width: 200, height: 100 });
  });

  it('retains client coordinates when used outside a native canvas', () => {
    const element = { closest: () => null } as unknown as Element;
    expect(getSectionPoint(element, { clientX: 55, clientY: 70 })).toEqual({ x: 55, y: 70 });
  });
});
