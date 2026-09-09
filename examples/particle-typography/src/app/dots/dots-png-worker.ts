type PngWorkerRequest =
  | Readonly<{ height: number; id: number; type: "start"; width: number }>
  | Readonly<{ bytes: ArrayBuffer; id: number; type: "rows" }>
  | Readonly<{ id: number; type: "finish" }>;

type PngWorkerResponse =
  | Readonly<{ id: number; type: "ready" | "written" }>
  | Readonly<{ bytes: ArrayBuffer; id: number; type: "result" }>
  | Readonly<{ error: string; id: number; type: "error" }>;

type WorkerScope = Readonly<{
  postMessage: (message: PngWorkerResponse, transfer?: Transferable[]) => void;
}>;

const workerScope = self as unknown as WorkerScope;
let imageHeight = 0;
let imageWidth = 0;
let compressedBytesPromise: Promise<Uint8Array> | null = null;
let compressionWriter: WritableStreamDefaultWriter<BufferSource> | null = null;

function uint32(value: number): Uint8Array {
  return new Uint8Array([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ]);
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concatenate(chunks: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(
    chunks.reduce((total, chunk) => total + chunk.byteLength, 0),
  );
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const crcInput = concatenate([typeBytes, data]);
  return concatenate([
    uint32(data.byteLength),
    typeBytes,
    data,
    uint32(crc32(crcInput)),
  ]);
}

function createPng(compressed: Uint8Array): Uint8Array {
  const header = new Uint8Array(13);
  header.set(uint32(imageWidth), 0);
  header.set(uint32(imageHeight), 4);
  header[8] = 8;
  header[9] = 6;
  return concatenate([
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", new Uint8Array()),
  ]);
}

async function collectCompressedBytes(
  readable: ReadableStream<Uint8Array>,
): Promise<Uint8Array> {
  const reader = readable.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    chunks.push(result.value);
  }
  return concatenate(chunks);
}

async function handleRequest(request: PngWorkerRequest): Promise<void> {
  if (request.type === "start") {
    imageHeight = request.height;
    imageWidth = request.width;
    const compression = new CompressionStream("deflate");
    compressionWriter = compression.writable.getWriter();
    compressedBytesPromise = collectCompressedBytes(compression.readable);
    workerScope.postMessage({ id: request.id, type: "ready" });
    return;
  }

  if (!compressionWriter || !compressedBytesPromise) {
    throw new Error("PNG worker received rows before initialization.");
  }

  if (request.type === "rows") {
    const pixels = new Uint8Array(request.bytes);
    const bytesPerRow = imageWidth * 4;
    const rowCount = Math.floor(pixels.byteLength / bytesPerRow);
    const scanlines = new Uint8Array((bytesPerRow + 1) * rowCount);
    for (let row = 0; row < rowCount; row += 1) {
      scanlines.set(
        pixels.subarray(row * bytesPerRow, (row + 1) * bytesPerRow),
        row * (bytesPerRow + 1) + 1,
      );
    }
    await compressionWriter.write(scanlines);
    workerScope.postMessage({ id: request.id, type: "written" });
    return;
  }

  await compressionWriter.close();
  const png = createPng(await compressedBytesPromise);
  const pngBuffer = png.buffer.slice(
    png.byteOffset,
    png.byteOffset + png.byteLength,
  ) as ArrayBuffer;
  workerScope.postMessage(
    { bytes: pngBuffer, id: request.id, type: "result" },
    [pngBuffer],
  );
}

self.addEventListener("message", (event: MessageEvent<PngWorkerRequest>) => {
  void handleRequest(event.data).catch((error: unknown) => {
    workerScope.postMessage({
      error: error instanceof Error ? error.message : String(error),
      id: event.data.id,
      type: "error",
    });
  });
});
