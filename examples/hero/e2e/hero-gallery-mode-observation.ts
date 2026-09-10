// One read-only snapshot keeps independent branch assertions together and avoids
// recording the entire 60-image document separately for every scalar assertion.
export function readHeroGalleryMode(root: HTMLElement) {
  const gallery = root.querySelector<HTMLElement>('[data-toolcraft-product-output="hero-native-preview"] [data-hero-gallery]')!;
  const viewport = gallery.closest("[data-hero-scene]")!.getBoundingClientRect();
  const heading = root.querySelector("[data-hero-heading-group]")!.getBoundingClientRect();
  const target = (name: string) => root.querySelectorAll(`[data-toolcraft-control-target="${name}"]`);
  const rowState = (side: string) => {
    const row = gallery.querySelector<HTMLElement>(`[data-hero-card-row="${side}"]`);
    if (!row) return null;
    const visible = Array.from(row.querySelectorAll("[data-dispersion-ready]")).filter(card => {
      const bounds = card.getBoundingClientRect();
      return bounds.right > viewport.left && bounds.left < viewport.right &&
        bounds.bottom > viewport.top && bounds.top < viewport.bottom;
    });
    return {
      direction: getComputedStyle(row).flexDirection,
      cards: row.querySelectorAll("[data-hero-card-index]").length,
      canvases: row.querySelectorAll("canvas").length,
      // Native IntersectionObserver disposes offscreen WebGL resources. Every
      // intersecting card must be ready; hidden cards still retain their source.
      visibleReady: visible.length > 0 && visible.every(card =>
        card.getAttribute("data-dispersion-ready") === "true" && !card.hasAttribute("data-dispersion-error")),
    };
  };
  const sphereCanvas = gallery.querySelector<HTMLCanvasElement>("[data-hero-gallery-canvas]");
  return {
    mode: gallery.dataset.heroGalleryType,
    pressed: Array.from(target("gallery.type")[0].querySelectorAll('[aria-pressed="true"]'), button => button.textContent?.trim()),
    ready: gallery.dataset.heroGalleryReady,
    order: gallery.dataset.heroGalleryOrder,
    rows: gallery.dataset.heroGalleryRows,
    mirrored: [rowState("left"), rowState("right")],
    sphereCanvases: gallery.querySelectorAll("[data-hero-gallery-canvas]").length,
    sphereRevealed: !!sphereCanvas && sphereCanvas.dataset.heroGalleryRevealed === "true" && getComputedStyle(sphereCanvas).opacity === "1",
    rowsControls: ["gallery.images", "cards.safetyWidth", "cards.roll"].map(name => target(name).length),
    sphereControls: ["sphere.rows", "sphere.rowGap", ...Array.from({ length: 6 }, (_, index) => `sphere.rowImages.${index}`)].map(name => target(name).length),
    shared: ["cards.gap", "cards.height", "cards.radius"].map(name => target(name)[0]?.querySelector('[role="slider"]')?.getAttribute("aria-valuenow")),
    heading: [heading.x, heading.y, heading.width, heading.height],
  };
}
