/** Read applied output and artwork, not values from the settings panel. */
export function readHeroShadowIsolation(root: HTMLElement) {
  const shadow = (selector: string) => {
    const element = root.querySelector(selector)!;
    const css = getComputedStyle(element);
    const id = css.filter.match(/#([^"\)]+)/u)?.[1];
    return {
      filter: css.filter,
      definition: id ? root.querySelector(`[id="${id}"]`)!.outerHTML : "",
      boxShadow: css.boxShadow,
    };
  };
  const artwork = (selector: string) => {
    const element = root.querySelector(selector)!;
    const css = getComputedStyle(element);
    return {
      text: element.textContent,
      color: css.color,
      borderColor: css.borderColor,
      width: css.width,
      height: css.height,
      fontSize: css.fontSize,
      transform: css.transform,
    };
  };
  return {
    badgeArtwork: artwork("[data-hero-heading-badge]"),
    subtitleText: artwork("[data-hero-heading-subtitle]"),
    headingShadow: shadow("#hero-title > span:first-child"),
    stylesShadow: shadow("#hero-title > span:last-child"),
    badgeShadow: shadow("[data-hero-heading-badge-frame]"),
    subtitleShadow: shadow("[data-hero-heading-subtitle]"),
    ctaShadow: shadow("[data-hero-heading-cta]"),
  };
}
