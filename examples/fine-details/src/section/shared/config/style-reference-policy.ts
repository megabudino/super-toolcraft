// Recraft Studio's /image?type=reference endpoint reports image_too_big above this exact size.
export const maximumStyleReferenceBytes = 48 * 1024 * 1024;
export const maximumStyleReferenceCount = 10;
export const supportedStyleReferenceMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/svg+xml',
  'image/webp',
] as const;

const supportedStyleReferenceMimeTypeSet = new Set<string>(supportedStyleReferenceMimeTypes);

export const styleReferenceCountError = 'Add between 1 and 10 style reference images.';
export const styleReferenceEmptyError = 'Style references cannot be empty files.';
export const styleReferenceSizeError = 'Each style reference must be 48 MB or smaller.';
export const styleReferenceTypeError = 'Style references must be PNG, JPG, WEBP, or SVG images.';

export function isSupportedStyleReferenceMimeType(mimeType: string) {
  return supportedStyleReferenceMimeTypeSet.has(mimeType.trim().toLowerCase());
}
