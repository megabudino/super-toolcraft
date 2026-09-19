import { generateSegments, interpolateEnvelope } from './flame-segments';
// Ported from the supplied reference utils/flameGraph.ts; random is injectable for reproducible frames.
export interface FlameSegment {
  heightRatio: number; // How much of the column's total height this segment takes
  xJitterRatio: number; // Random horizontal offset ratio (-0.5 to 0.5)
  wJitterRatio: number; // Random width modifier ratio (-0.5 to 0.5)
}

export interface FlameColumn {
  id: string;
  topY: number; // 0 to 1
  midY: number; // 0 to 1
  bottomY: number; // 0 to 1
  topSegments: FlameSegment[];
  bottomSegments: FlameSegment[];
}


export const generateFlameData = (
  maxDepth: number,
  numColumns: number,
  topControlPoints: number[],
  midControlPoints: number[],
  bottomControlPoints: number[],
  noiseLevel: number = 0,
  layoutMode: 'center' | 'top-down' = 'center',
  random: () => number = Math.random
): FlameColumn[] => {
  const columns: FlameColumn[] = [];
  
  // The reference consumes this random sequence for an unused noise buffer.
  // Keep its RNG position while omitting smoothing that never reaches the output.
  for (let i = 0; i < numColumns; i++) random();


  for (let i = 0; i < numColumns; i++) {
    const t = i / (numColumns - 1);
    
    // Get the envelope heights from our interactive control points
    let topY = layoutMode === 'center' ? interpolateEnvelope(topControlPoints, t) : 0;
    let midY = layoutMode === 'center' ? interpolateEnvelope(midControlPoints, t) : 0;
    let bottomY = interpolateEnvelope(bottomControlPoints, t);

    // Apply vertical noise to make the boundaries imperfect
    // The noise level dictates how much the columns can break out of the control lines
    if (noiseLevel > 0) {
      const noiseFactor = noiseLevel / 100;
      if (layoutMode === 'center') {
        // Randomly push top boundary up or down by up to 15% of the total height * noiseFactor
        topY += (random() - 0.5) * 0.3 * noiseFactor;
      }
      // Randomly push bottom boundary up or down
      bottomY += (random() - 0.5) * 0.3 * noiseFactor;
    }

    // Enforce ordering just in case
    if (layoutMode === 'center') {
      if (midY < topY) midY = topY;
    } else {
      topY = 0;
      midY = 0;
    }
    if (bottomY < midY) bottomY = midY;

    // Add a random multiplier to significantly vary the number of segments per column
    // This makes the density of the central line look much more chaotic and natural
    const randomMultiplierTop = 0.5 + random();
    const randomMultiplierBottom = 0.5 + random();
    
    // Top half segments (from mid up to top)
    const topHeight = midY - topY;
    let numTopSegments = layoutMode === 'center' ? Math.ceil((topHeight * maxDepth) * randomMultiplierTop) : 0;
    if (layoutMode === 'center' && numTopSegments < 1) numTopSegments = 1;
    
    // Bottom half segments (from mid down to bottom)
    const bottomHeight = bottomY - midY;
    let numBottomSegments = Math.ceil((bottomHeight * maxDepth) * randomMultiplierBottom);
    if (numBottomSegments < 1) numBottomSegments = 1;

    // Helper to generate segments where the first segment (index 0) is the smallest


    columns.push({
      id: `col-${i}-${random().toString(36).substring(7)}`,
      topY,
      midY,
      bottomY,
      topSegments: generateSegments(numTopSegments, random),
      bottomSegments: generateSegments(numBottomSegments, random),
    });
  }
  
  return columns;
};

