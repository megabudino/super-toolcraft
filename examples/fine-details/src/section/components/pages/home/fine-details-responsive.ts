export const FINE_DETAILS_DESKTOP_MIN_WIDTH = 1280;

export function shouldKeepFineDetailsPromptStationary(sectionWidth: number) {
  return sectionWidth < FINE_DETAILS_DESKTOP_MIN_WIDTH;
}
