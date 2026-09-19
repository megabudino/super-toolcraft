import type { FlameSegment } from './flame-generator';
export const generateSegments = (numSegs: number, random: () => number): FlameSegment[] => {
      const segs: FlameSegment[] = [];
      let totalWeight = 0;
      const weights: number[] = [];
      for (let s = 0; s < numSegs; s++) {
        // s=0 is the MIDLINE (smallest), s=numSegs-1 is the EDGE (largest)
        // We reverse the power calculation so s=0 gets the smallest weight
        const baseWeight = Math.pow(s + 1, 3.0);
        const randomFactor = 0.85 + random() * 0.3; 
        const finalWeight = baseWeight * randomFactor;
        weights.push(finalWeight);
        totalWeight += finalWeight;
      }

      for (let s = 0; s < numSegs; s++) {
        segs.push({
          heightRatio: weights[s] / totalWeight,
          xJitterRatio: random() - 0.5,
          wJitterRatio: random() - 0.5
        });
      }
      return segs;
    };

  // Helper to interpolate control points smoothly (Cosine interpolation)
export const interpolateEnvelope = (pts: number[], t: number) => {
    const n = pts.length - 1;
    const i = Math.floor(t * n);
    if (i >= n) return pts[n];
    const frac = (t * n) - i;
    const f = (1 - Math.cos(frac * Math.PI)) / 2;
    return pts[i] * (1 - f) + pts[i + 1] * f;
  };

