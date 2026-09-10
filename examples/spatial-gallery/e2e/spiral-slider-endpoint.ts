/** Choose from the pre-action value, not the intermediate pointer-drag value. */
export function spiralSliderEndpoint(current: number, minimum: number, maximum: number) {
  if (![current, minimum, maximum].every(Number.isFinite) || maximum <= minimum) {
    throw new Error("A gallery slider must expose a finite increasing range.");
  }
  return current <= (minimum + maximum) / 2 ? "End" : "Home";
}
