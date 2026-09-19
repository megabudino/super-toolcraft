import { expect } from "@playwright/test";

type ArtifactSize = Readonly<{ height: number; width: number }>;
type Artifact = ArtifactSize & Readonly<{ byteLength: number }>;

export type ToolcraftInfinityExportEvidenceOptions = Readonly<{
  expectedSize: ArtifactSize;
  requirementId: string;
  target: string;
}>;

export function expectToolcraftInfinityArtifactFrameParity(
  artifacts: Readonly<{ finite: Artifact; infinite: Artifact }>,
  expectedSize: ArtifactSize,
): void {
  for (const artifact of [artifacts.finite, artifacts.infinite]) {
    expect(artifact).toMatchObject(expectedSize);
    expect(artifact.byteLength).toBeGreaterThan(100);
    expect(Number.isSafeInteger(artifact.width)).toBe(true);
    expect(Number.isSafeInteger(artifact.height)).toBe(true);
    expect(artifact.width).toBeGreaterThan(0);
    expect(artifact.height).toBeGreaterThan(0);
  }
}
