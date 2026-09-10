import { deflateSync } from "node:zlib";

export const portraitColors = [[240, 40, 40], [40, 220, 40], [40, 70, 230], [235, 220, 35]] as const;
export const landscapeColors = [[220, 40, 210], [40, 210, 210], [235, 135, 30], [120, 80, 200]] as const;

function pngChunk(name: string, bytes: Buffer) {
  const type = Buffer.from(name);
  const content = Buffer.concat([type, bytes]);
  let crc = 0xffffffff;
  for (const byte of content) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  const header = Buffer.alloc(4);
  header.writeUInt32BE(bytes.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([header, content, checksum]);
}

// Small asymmetric, lossless source files make orientation and aspect observable
// in the real rendered card, independently of transform metadata or thumbnails.
function quadrantPng(width: number, height: number, colors: readonly (readonly number[])[]) {
  const pixels = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const color = colors[(y >= height / 2 ? 2 : 0) + (x >= width / 2 ? 1 : 0)];
      for (let channel = 0; channel < 3; channel += 1) pixels[y * (width * 3 + 1) + 1 + x * 3 + channel] = color[channel];
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header), pngChunk("IDAT", deflateSync(pixels)), pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

export const heroPortraitFixture = { name: "hero-portrait-quadrants.png", mimeType: "image/png", buffer: quadrantPng(72, 96, portraitColors) };
export const heroLandscapeFixture = { name: "hero-landscape-quadrants.png", mimeType: "image/png", buffer: quadrantPng(96, 72, landscapeColors) };
