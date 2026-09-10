import type { ToolcraftDefaultMediaAssetSchema } from "@/toolcraft/runtime";
import row1Image1 from "@/section/assets/images/recraft-hero/defaults/hero-row-1-image-1.jpg?inline";
import row1Image2 from "@/section/assets/images/recraft-hero/defaults/hero-row-1-image-2.jpg?inline";
import row1Image3 from "@/section/assets/images/recraft-hero/defaults/hero-row-1-image-3.jpg?inline";
import row1Image4 from "@/section/assets/images/recraft-hero/defaults/hero-row-1-image-4.jpg?inline";
import row1Image5 from "@/section/assets/images/recraft-hero/defaults/hero-row-1-image-5.jpg?inline";
import row1Image6 from "@/section/assets/images/recraft-hero/defaults/hero-row-1-image-6.jpg?inline";
import row2Image1 from "@/section/assets/images/recraft-hero/defaults/hero-row-2-image-1.jpg?inline";
import row2Image2 from "@/section/assets/images/recraft-hero/defaults/hero-row-2-image-2.jpg?inline";
import row2Image3 from "@/section/assets/images/recraft-hero/defaults/hero-row-2-image-3.jpg?inline";
import row2Image4 from "@/section/assets/images/recraft-hero/defaults/hero-row-2-image-4.jpg?inline";
import row2Image5 from "@/section/assets/images/recraft-hero/defaults/hero-row-2-image-5.jpg?inline";
import row2Image6 from "@/section/assets/images/recraft-hero/defaults/hero-row-2-image-6.jpg?inline";
import row3Image1 from "@/section/assets/images/recraft-hero/defaults/hero-row-3-image-1.jpg?inline";
import row3Image2 from "@/section/assets/images/recraft-hero/defaults/hero-row-3-image-2.jpg?inline";
import row3Image3 from "@/section/assets/images/recraft-hero/defaults/hero-row-3-image-3.jpg?inline";
import row3Image4 from "@/section/assets/images/recraft-hero/defaults/hero-row-3-image-4.jpg?inline";
import row3Image5 from "@/section/assets/images/recraft-hero/defaults/hero-row-3-image-5.jpg?inline";
import row3Image6 from "@/section/assets/images/recraft-hero/defaults/hero-row-3-image-6.jpg?inline";
import row4Image1 from "@/section/assets/images/recraft-hero/defaults/hero-row-4-image-1.jpg?inline";
import row4Image2 from "@/section/assets/images/recraft-hero/defaults/hero-row-4-image-2.jpg?inline";
import row4Image3 from "@/section/assets/images/recraft-hero/defaults/hero-row-4-image-3.jpg?inline";
import row4Image4 from "@/section/assets/images/recraft-hero/defaults/hero-row-4-image-4.jpg?inline";
import row4Image5 from "@/section/assets/images/recraft-hero/defaults/hero-row-4-image-5.jpg?inline";
import row4Image6 from "@/section/assets/images/recraft-hero/defaults/hero-row-4-image-6.jpg?inline";
import row5Image1 from "@/section/assets/images/recraft-hero/defaults/hero-row-5-image-1.jpg?inline";
import row5Image2 from "@/section/assets/images/recraft-hero/defaults/hero-row-5-image-2.jpg?inline";
import row5Image3 from "@/section/assets/images/recraft-hero/defaults/hero-row-5-image-3.jpg?inline";
import row5Image4 from "@/section/assets/images/recraft-hero/defaults/hero-row-5-image-4.jpg?inline";
import row5Image5 from "@/section/assets/images/recraft-hero/defaults/hero-row-5-image-5.jpg?inline";
import row5Image6 from "@/section/assets/images/recraft-hero/defaults/hero-row-5-image-6.jpg?inline";
import row6Image1 from "@/section/assets/images/recraft-hero/defaults/hero-row-6-image-1.jpg?inline";
import row6Image2 from "@/section/assets/images/recraft-hero/defaults/hero-row-6-image-2.jpg?inline";
import row6Image3 from "@/section/assets/images/recraft-hero/defaults/hero-row-6-image-3.jpg?inline";
import row6Image4 from "@/section/assets/images/recraft-hero/defaults/hero-row-6-image-4.jpg?inline";
import row6Image5 from "@/section/assets/images/recraft-hero/defaults/hero-row-6-image-5.jpg?inline";
import row6Image6 from "@/section/assets/images/recraft-hero/defaults/hero-row-6-image-6.jpg?inline";

const portraits = [
  { dataUrl: row1Image1, fileName: "hero-row-1-image-1.jpg", row: 0, width: 1792, height: 2304 },
  { dataUrl: row1Image2, fileName: "hero-row-1-image-2.jpg", row: 0, width: 960, height: 1216 },
  { dataUrl: row1Image3, fileName: "hero-row-1-image-3.jpg", row: 0, width: 1824, height: 2272 },
  { dataUrl: row1Image4, fileName: "hero-row-1-image-4.jpg", row: 0, width: 960, height: 1216 },
  { dataUrl: row1Image5, fileName: "hero-row-1-image-5.jpg", row: 0, width: 1824, height: 2272 },
  { dataUrl: row1Image6, fileName: "hero-row-1-image-6.jpg", row: 0, width: 1824, height: 2272 },
  { dataUrl: row2Image1, fileName: "hero-row-2-image-1.jpg", row: 1, width: 1792, height: 2304 },
  { dataUrl: row2Image2, fileName: "hero-row-2-image-2.jpg", row: 1, width: 1792, height: 2304 },
  { dataUrl: row2Image3, fileName: "hero-row-2-image-3.jpg", row: 1, width: 1792, height: 2304 },
  { dataUrl: row2Image4, fileName: "hero-row-2-image-4.jpg", row: 1, width: 1792, height: 2304 },
  { dataUrl: row2Image5, fileName: "hero-row-2-image-5.jpg", row: 1, width: 1792, height: 2304 },
  { dataUrl: row2Image6, fileName: "hero-row-2-image-6.jpg", row: 1, width: 1792, height: 2304 },
  { dataUrl: row3Image1, fileName: "hero-row-3-image-1.jpg", row: 2, width: 928, height: 1216 },
  { dataUrl: row3Image2, fileName: "hero-row-3-image-2.jpg", row: 2, width: 928, height: 1216 },
  { dataUrl: row3Image3, fileName: "hero-row-3-image-3.jpg", row: 2, width: 1536, height: 2208 },
  { dataUrl: row3Image4, fileName: "hero-row-3-image-4.jpg", row: 2, width: 928, height: 1216 },
  { dataUrl: row3Image5, fileName: "hero-row-3-image-5.jpg", row: 2, width: 928, height: 1216 },
  { dataUrl: row3Image6, fileName: "hero-row-3-image-6.jpg", row: 2, width: 928, height: 1216 },
  { dataUrl: row4Image1, fileName: "hero-row-4-image-1.jpg", row: 3, width: 1792, height: 2304 },
  { dataUrl: row4Image2, fileName: "hero-row-4-image-2.jpg", row: 3, width: 1792, height: 2304 },
  { dataUrl: row4Image3, fileName: "hero-row-4-image-3.jpg", row: 3, width: 1792, height: 2304 },
  { dataUrl: row4Image4, fileName: "hero-row-4-image-4.jpg", row: 3, width: 1792, height: 2304 },
  { dataUrl: row4Image5, fileName: "hero-row-4-image-5.jpg", row: 3, width: 1792, height: 2304 },
  { dataUrl: row4Image6, fileName: "hero-row-4-image-6.jpg", row: 3, width: 1792, height: 2304 },
  { dataUrl: row5Image1, fileName: "hero-row-5-image-1.jpg", row: 4, width: 1792, height: 2304 },
  { dataUrl: row5Image2, fileName: "hero-row-5-image-2.jpg", row: 4, width: 1792, height: 2304 },
  { dataUrl: row5Image3, fileName: "hero-row-5-image-3.jpg", row: 4, width: 1792, height: 2304 },
  { dataUrl: row5Image4, fileName: "hero-row-5-image-4.jpg", row: 4, width: 1792, height: 2304 },
  { dataUrl: row5Image5, fileName: "hero-row-5-image-5.jpg", row: 4, width: 1792, height: 2304 },
  { dataUrl: row5Image6, fileName: "hero-row-5-image-6.jpg", row: 4, width: 1792, height: 2304 },
  { dataUrl: row6Image1, fileName: "hero-row-6-image-1.jpg", row: 5, width: 1792, height: 2304 },
  { dataUrl: row6Image2, fileName: "hero-row-6-image-2.jpg", row: 5, width: 1792, height: 2304 },
  { dataUrl: row6Image3, fileName: "hero-row-6-image-3.jpg", row: 5, width: 1792, height: 2304 },
  { dataUrl: row6Image4, fileName: "hero-row-6-image-4.jpg", row: 5, width: 1792, height: 2304 },
  { dataUrl: row6Image5, fileName: "hero-row-6-image-5.jpg", row: 5, width: 1792, height: 2304 },
  { dataUrl: row6Image6, fileName: "hero-row-6-image-6.jpg", row: 5, width: 1792, height: 2304 },
];

export const heroDefaultMediaAssets: readonly ToolcraftDefaultMediaAssetSchema[] = [
  ...portraits.map((image, index) => ({ assetKind: "image" as const, dataUrl: image.dataUrl, fileName: image.fileName, id: `hero-default-row-${index}`, mimeType: "image/jpeg", size: { width: image.width, height: image.height, unit: "px" as const }, sourceTarget: `sphere.rowImages.${image.row}` })),
  ...portraits.slice(0, 24).map((image, index) => ({ assetKind: "image" as const, dataUrl: image.dataUrl, fileName: image.fileName, id: `hero-default-gallery-${index}`, mimeType: "image/jpeg", size: { width: image.width, height: image.height, unit: "px" as const }, sourceTarget: "gallery.images" })),
];
