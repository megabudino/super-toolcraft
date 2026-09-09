import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const previewSource = readFileSync(
  resolve(process.cwd(), 'src/app/fine-details-preview.tsx'),
  'utf8',
);
const previewCssSource = readFileSync(
  resolve(process.cwd(), 'src/app/fine-details-preview.module.css'),
  'utf8',
);

describe('Fine Details carousel iframe interaction', () => {
  it('keeps Trail pointer-transparent and enables native Carousel interactions', () => {
    expect(previewSource).toMatch(/settings\.imagesMode === 'carousel'/);
    expect(previewSource).toMatch(/styles\.interactiveFrame/);
    expect(previewSource).toMatch(/sandbox="allow-downloads allow-same-origin allow-scripts"/);
    expect(previewCssSource).toMatch(/\.frame[\s\S]*pointer-events:\s*none/);
    expect(previewCssSource).toMatch(/\.interactiveFrame[\s\S]*pointer-events:\s*auto/);
  });
});
