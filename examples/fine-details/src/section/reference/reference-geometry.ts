/** Convert editor-scaled client coordinates back into the former iframe's CSS pixels. */
export function getSectionCoordinateSpace(element: Element) {
  const viewport = element.closest<HTMLElement>('[data-recraft-native-section]');
  const bounds = viewport?.getBoundingClientRect();
  const scale = viewport && bounds && viewport.offsetWidth > 0
    ? bounds.width / viewport.offsetWidth : 1;
  return { left: bounds?.left ?? 0, top: bounds?.top ?? 0, scale: scale || 1 };
}

export function getSectionRect(element: Element) {
  const rect = element.getBoundingClientRect();
  const space = getSectionCoordinateSpace(element);
  return new DOMRect((rect.left - space.left) / space.scale, (rect.top - space.top) / space.scale,
    rect.width / space.scale, rect.height / space.scale);
}

export function getSectionPoint(element: Element, point: { clientX: number; clientY: number }) {
  const space = getSectionCoordinateSpace(element);
  return { x: (point.clientX - space.left) / space.scale, y: (point.clientY - space.top) / space.scale };
}
