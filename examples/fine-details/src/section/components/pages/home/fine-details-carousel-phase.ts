export function normalizeFineDetailsCarouselPhase(offset: number, shift: number) {
  if (!Number.isFinite(offset) || !Number.isFinite(shift) || shift <= 0) return 0;
  const normalized = -(((-offset % shift) + shift) % shift);
  return Object.is(normalized, -0) ? 0 : normalized;
}
