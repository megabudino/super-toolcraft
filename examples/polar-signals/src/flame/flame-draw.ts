import { hslToHex, interpolateHSL, hexToHSL } from './flame-color';
import type { FlameColumn } from './flame-generator';
import type { FlameSettings } from './flame-defaults';

/** Draw transparent source-equivalent foreground in local scene coordinates. */
export function drawFlame(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, width: number, height: number, flameData: readonly FlameColumn[], settings: FlameSettings): void {
  const { columns: widthScale, core: coreWidth, border: borderOpacity } = settings;
  const darkColor = hexToHSL(settings.dark);
  const midColor = hexToHSL(settings.middle);
  const lightColor = hexToHSL(settings.light);
  const darkHsl = darkColor;
  const midColorHsl = midColor;
  const lightHsl = lightColor;
  
  const getColorForFactor = (f: number) => {
    const clampedF = Math.max(0, Math.min(1, f));
    let hsl;
    if (clampedF < 0.5) {
      hsl = interpolateHSL(darkHsl, midColorHsl, clampedF * 2);
    } else {
      hsl = interpolateHSL(midColorHsl, lightHsl, (clampedF - 0.5) * 2);
    }
    return hslToHex(hsl.h, hsl.s, hsl.l);
  };
  
  const colWidth = width / widthScale;
  
  // Draw each column
  flameData.forEach((col, colIndex) => {
    const x = colIndex * colWidth;
    const midY_px = col.midY * height;
    const topY_px = col.topY * height;
    const bottomY_px = col.bottomY * height;
  
    const topTotalHeight = midY_px - topY_px;
    const bottomTotalHeight = bottomY_px - midY_px;
    
    // Draw top segments (growing UP from mid)
    let currentY = midY_px;
    col.topSegments.forEach((segment, i) => {
      // Enforce a minimum height of 5 pixels
      let segmentHeight = Math.max(5, topTotalHeight * segment.heightRatio);
      
      // If enforcing the minimum height pushes us past the top boundary, clamp it
      if (currentY - segmentHeight < topY_px && i === col.topSegments.length - 1) {
        segmentHeight = currentY - topY_px;
      }
      
      currentY -= segmentHeight; // Move up
      
      const rawFactor = i / Math.max(1, col.topSegments.length - 1);
      
      // Map coreWidth (10-100) to solid threshold (0 to 0.75)
      const solidCoreThreshold = (coreWidth / 100) * 0.75;
      
      let factor = 0;
      if (rawFactor > solidCoreThreshold) {
        // Smooth transition for the remaining part
        const normalized = (rawFactor - solidCoreThreshold) / (1 - solidCoreThreshold);
        factor = Math.pow(normalized, 1.2); // slight curve for smoothness
      }
      
      const nodeColor = getColorForFactor(factor);
  
      const isLastBlock = i === col.topSegments.length - 1;
      if (isLastBlock && col.topSegments.length > 1) {
        const prevRawFactor = (i - 1) / (col.topSegments.length - 1);
        let prevFactor = 0;
        if (prevRawFactor > solidCoreThreshold) {
          const normalized = (prevRawFactor - solidCoreThreshold) / (1 - solidCoreThreshold);
          prevFactor = Math.pow(normalized, 1.2);
        }
        // Start color is slightly lighter than the previous block's color
        const startFactor = Math.min(1.0, prevFactor + 0.05);
        const startColor = getColorForFactor(startFactor);
        
        // Top segments grow UP. currentY is the TOP of the block.
        // currentY + segmentHeight is the BOTTOM of the block (touching the previous block).
        const gradient = ctx.createLinearGradient(0, currentY + segmentHeight, 0, currentY);
        gradient.addColorStop(0, startColor);
        gradient.addColorStop(1, nodeColor);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = nodeColor;
      }
      
      // Use exact pixel boundaries for width to ensure all blocks are exactly the same width
      const exactX = Math.floor(x);
      const exactWidth = Math.ceil(colWidth);
      
      ctx.fillRect(exactX, Math.floor(currentY), exactWidth, Math.ceil(segmentHeight) + 0.5);
  
      // Draw a subtle border for each block to make them distinct
      if (borderOpacity > 0) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${borderOpacity / 100})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(exactX, Math.floor(currentY), exactWidth, Math.ceil(segmentHeight));
      }
    });
  
    // Draw bottom segments (growing DOWN from mid)
    currentY = midY_px;
    col.bottomSegments.forEach((segment, i) => {
      // Enforce a minimum height of 5 pixels
      let segmentHeight = Math.max(5, bottomTotalHeight * segment.heightRatio);
      
      // If enforcing the minimum height pushes us past the bottom boundary, clamp it
      if (currentY + segmentHeight > bottomY_px && i === col.bottomSegments.length - 1) {
        segmentHeight = bottomY_px - currentY;
      }
      
      const rawFactor = i / Math.max(1, col.bottomSegments.length - 1);
      
      // Map coreWidth (10-100) to solid threshold (0 to 0.75)
      const solidCoreThreshold = (coreWidth / 100) * 0.75;
      
      let factor = 0;
      if (rawFactor > solidCoreThreshold) {
        // Smooth transition for the remaining part
        const normalized = (rawFactor - solidCoreThreshold) / (1 - solidCoreThreshold);
        factor = Math.pow(normalized, 1.2); // slight curve for smoothness
      }
      
      const nodeColor = getColorForFactor(factor);
  
      const isLastBlock = i === col.bottomSegments.length - 1;
      if (isLastBlock && col.bottomSegments.length > 1) {
        const prevRawFactor = (i - 1) / (col.bottomSegments.length - 1);
        let prevFactor = 0;
        if (prevRawFactor > solidCoreThreshold) {
          const normalized = (prevRawFactor - solidCoreThreshold) / (1 - solidCoreThreshold);
          prevFactor = Math.pow(normalized, 1.2);
        }
        // Start color is slightly lighter than the previous block's color
        const startFactor = Math.min(1.0, prevFactor + 0.05);
        const startColor = getColorForFactor(startFactor);
        
        // Bottom segments grow DOWN. currentY is the TOP of the block (touching the previous block).
        // currentY + segmentHeight is the BOTTOM of the block.
        const gradient = ctx.createLinearGradient(0, currentY, 0, currentY + segmentHeight);
        gradient.addColorStop(0, startColor);
        gradient.addColorStop(1, nodeColor);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = nodeColor;
      }
      
      const exactX = Math.floor(x);
      const exactWidth = Math.ceil(colWidth);
      
      ctx.fillRect(exactX, Math.floor(currentY), exactWidth, Math.ceil(segmentHeight) + 0.5);
  
      // Draw a subtle border for each block to make them distinct
      if (borderOpacity > 0) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${borderOpacity / 100})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(exactX, Math.floor(currentY), exactWidth, Math.ceil(segmentHeight));
      }
      currentY += segmentHeight; // Move down
    });
  });
}
