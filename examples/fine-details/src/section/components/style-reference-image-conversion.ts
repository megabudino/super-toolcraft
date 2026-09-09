export const heicStyleReferenceAcceptTokens = [
  'image/heic',
  'image/heif',
  '.heic',
  '.heif',
] as const;

export const styleReferenceConversionError =
  'This HEIC or HEIF image could not be converted. Try choosing a JPEG or PNG image.';

const heicStyleReferenceMimeTypes = new Set<string>(['image/heic', 'image/heif']);
const heicStyleReferenceFileExtension = /\.(?:heic|heif)$/iu;
const convertedStyleReferenceQuality = 0.9;

export interface DecodedStyleReferenceImage {
  height: number;
  source: CanvasImageSource;
  width: number;
}

export interface StyleReferenceImageConversionDependencies {
  createObjectUrl: (file: File) => string;
  decodeImage: (objectUrl: string) => Promise<DecodedStyleReferenceImage>;
  encodeJpeg: (image: DecodedStyleReferenceImage, quality: number) => Promise<Blob>;
  revokeObjectUrl: (objectUrl: string) => void;
}

function decodeImage(objectUrl: string) {
  return new Promise<DecodedStyleReferenceImage>((resolve, reject) => {
    const image = new Image();

    function clearEventHandlers() {
      image.onload = null;
      image.onerror = null;
    }

    image.onload = () => {
      clearEventHandlers();
      const { naturalHeight: height, naturalWidth: width } = image;
      if (height < 1 || width < 1) {
        reject(new Error('The decoded image has no pixels.'));
        return;
      }
      resolve({ height, source: image, width });
    };
    image.onerror = () => {
      clearEventHandlers();
      reject(new Error('The browser could not decode this image.'));
    };
    image.src = objectUrl;
  });
}

async function encodeJpeg(image: DecodedStyleReferenceImage, quality: number) {
  const canvas = document.createElement('canvas');
  canvas.height = image.height;
  canvas.width = image.width;

  try {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('The browser could not create an image canvas.');
    context.drawImage(image.source, 0, 0, image.width, image.height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('The browser could not encode this image as JPEG.'));
        },
        'image/jpeg',
        quality,
      );
    });
  } finally {
    canvas.height = 0;
    canvas.width = 0;
  }
}

const defaultDependencies: StyleReferenceImageConversionDependencies = {
  createObjectUrl: (file) => URL.createObjectURL(file),
  decodeImage,
  encodeJpeg,
  revokeObjectUrl: (objectUrl) => URL.revokeObjectURL(objectUrl),
};

export function isHeicStyleReference(file: Pick<File, 'name' | 'type'>) {
  return (
    heicStyleReferenceMimeTypes.has(file.type.trim().toLowerCase()) ||
    heicStyleReferenceFileExtension.test(file.name)
  );
}

function getConvertedStyleReferenceName(fileName: string) {
  const baseName = fileName.replace(heicStyleReferenceFileExtension, '');
  return `${baseName || 'image'}.jpg`;
}

export async function prepareStyleReferenceImage(
  file: File,
  dependencies: StyleReferenceImageConversionDependencies = defaultDependencies,
) {
  if (!isHeicStyleReference(file)) return file;

  let objectUrl: string | undefined;
  try {
    objectUrl = dependencies.createObjectUrl(file);
    const image = await dependencies.decodeImage(objectUrl);
    const jpeg = await dependencies.encodeJpeg(image, convertedStyleReferenceQuality);
    return new File([jpeg], getConvertedStyleReferenceName(file.name), {
      lastModified: file.lastModified,
      type: 'image/jpeg',
    });
  } catch (error) {
    throw new Error(styleReferenceConversionError, { cause: error });
  } finally {
    if (objectUrl) dependencies.revokeObjectUrl(objectUrl);
  }
}
