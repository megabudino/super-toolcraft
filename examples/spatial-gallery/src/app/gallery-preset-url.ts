export function resolveGalleryPresetUrl(
  baseUrl: string,
  fileName: string,
): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}gallery-presets/${fileName.replace(/^\/+/, "")}`;
}
