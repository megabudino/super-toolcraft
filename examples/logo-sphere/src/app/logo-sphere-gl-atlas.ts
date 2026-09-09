import type { LogoSphereImageSource } from "./logo-sphere-renderer-types";

const GUTTER = 4;

export function getLogoSphereAtlasLayout(count: number, defaults: boolean, maxSize: number) {
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / columns));
  const preferred = defaults ? 512 : count <= 16 ? 1024 : count <= 36 ? 768 : 512;
  const tileSize = [1024, 768, 512, 256].find(size => size <= preferred &&
    columns * (size + GUTTER * 2) <= maxSize && rows * (size + GUTTER * 2) <= maxSize);
  if (!tileSize) throw new Error("Logo texture set exceeds the WebGL texture limit.");
  return { columns, rows, tileSize, stride: tileSize + GUTTER * 2,
    width: columns * (tileSize + GUTTER * 2), height: rows * (tileSize + GUTTER * 2) };
}

export function sameLogoSphereImageSource(left: LogoSphereImageSource, right: LogoSphereImageSource): boolean {
  return left.id === right.id && left.image === right.image &&
    left.sourceRect?.x === right.sourceRect?.x && left.sourceRect?.y === right.sourceRect?.y &&
    left.sourceRect?.width === right.sourceRect?.width && left.sourceRect?.height === right.sourceRect?.height &&
    left.transform?.rotationDeg === right.transform?.rotationDeg &&
    left.transform?.flipHorizontal === right.transform?.flipHorizontal &&
    left.transform?.flipVertical === right.transform?.flipVertical;
}

function drawTile(context: CanvasRenderingContext2D, source: LogoSphereImageSource,
  x: number, y: number, size: number, stride: number): void {
  const image = source.image as { naturalWidth?: number; naturalHeight?: number; width?: number; height?: number };
  const rect = source.sourceRect ?? { x: 0, y: 0,
    width: image.naturalWidth || image.width || 1, height: image.naturalHeight || image.height || 1 };
  context.save();
  context.fillStyle = "white";
  context.fillRect(x, y, stride, stride);
  context.beginPath();
  context.rect(x + GUTTER, y + GUTTER, size, size);
  context.clip();
  context.translate(x + GUTTER + size / 2, y + GUTTER + size / 2);
  context.rotate((source.transform?.rotationDeg ?? 0) * Math.PI / 180);
  context.scale(source.transform?.flipHorizontal ? -1 : 1, source.transform?.flipVertical ? -1 : 1);
  context.drawImage(source.image, rect.x, rect.y, rect.width, rect.height, -size / 2, -size / 2, size, size);
  context.restore();
}

export function uploadLogoSphereTexture(gl: WebGL2RenderingContext,
  texture: WebGLTexture, source: TexImageSource, mipmaps = true): void {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  if (mipmaps) gl.generateMipmap(gl.TEXTURE_2D);
}

export function createLogoSphereGLAtlas(gl: WebGL2RenderingContext) {
  const texture = gl.createTexture();
  if (!texture) throw new Error("Unable to allocate logo atlas texture.");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to prepare logo atlas.");
  let sources: readonly LogoSphereImageSource[] = [];
  let layout = getLogoSphereAtlasLayout(0, true, gl.getParameter(gl.MAX_TEXTURE_SIZE));
  return {
    texture,
    ensure(images: readonly LogoSphereImageSource[]) {
      if (images.length === sources.length && images.every((source, i) => sameLogoSphereImageSource(source, sources[i]!))) return layout;
      layout = getLogoSphereAtlasLayout(images.length,
        images.every(source => source.id.startsWith("logo-sphere-default-")), gl.getParameter(gl.MAX_TEXTURE_SIZE));
      canvas.width = layout.width;
      canvas.height = layout.height;
      images.forEach((source, i) => drawTile(context, source, (i % layout.columns) * layout.stride,
        Math.floor(i / layout.columns) * layout.stride, layout.tileSize, layout.stride));
      uploadLogoSphereTexture(gl, texture, canvas);
      sources = images.map(source => ({ ...source, transform: source.transform ? { ...source.transform } : undefined }));
      return layout;
    },
    dispose() {
      gl.deleteTexture(texture);
      sources = [];
      canvas.width = canvas.height = 1;
    },
  };
}
