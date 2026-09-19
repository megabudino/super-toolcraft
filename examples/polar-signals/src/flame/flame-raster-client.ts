import type { FlameRasterRequest, FlameRasterResponse } from './flame-raster-protocol';

type Job = { request: FlameRasterRequest; resolve: (bitmap: ImageBitmap | null) => void; reject: (error: Error) => void };

/** One active draw and one newest pending draw; intermediate requests retire. */
export class FlameRasterClient {
  private worker = new Worker(new URL('./flame-raster.worker.ts', import.meta.url), { type: 'module' });
  private nextId = 0;
  private active?: Job;
  private pending?: Job;

  constructor() {
    this.worker.onmessage = (event: MessageEvent<FlameRasterResponse>) => {
      const job = this.active;
      this.active = undefined;
      if (!job || job.request.id !== event.data.id) event.data.bitmap?.close();
      else if (event.data.error) job.reject(new Error(event.data.error));
      else job.resolve(event.data.bitmap ?? null);
      if (this.pending) {
        this.active = this.pending;
        this.pending = undefined;
        this.worker.postMessage(this.active.request);
      }
    };
    this.worker.onerror = event => {
      this.active?.reject(new Error(event.message));
      this.pending?.reject(new Error(event.message));
      this.active = this.pending = undefined;
    };
  }

  render(input: Omit<FlameRasterRequest, 'id'>): Promise<ImageBitmap | null> {
    return new Promise((resolve, reject) => {
      const job = { request: { ...input, id: ++this.nextId }, resolve, reject };
      if (this.active) {
        this.pending?.resolve(null);
        this.pending = job;
      } else {
        this.active = job;
        this.worker.postMessage(job.request);
      }
    });
  }

  dispose() {
    this.worker.terminate();
    this.active?.resolve(null);
    this.pending?.resolve(null);
    this.active = this.pending = undefined;
  }
}
