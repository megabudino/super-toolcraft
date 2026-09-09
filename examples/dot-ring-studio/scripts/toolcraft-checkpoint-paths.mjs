import path from "node:path";

function getVerificationReceiptPath(rootDir, fileName) {
  return path.join(
    path.resolve(rootDir),
    ".toolcraft",
    "verification",
    fileName,
  );
}

function getToolcraftDeliveryReceiptPath(rootDir) {
  return getVerificationReceiptPath(rootDir, "delivery.json");
}

export function getToolcraftCheckpointBundlePath(rootDir) {
  return getVerificationReceiptPath(rootDir, "checkpoint.json");
}

function getToolcraftPerformanceBaselineReceiptPath(rootDir) {
  return getVerificationReceiptPath(rootDir, "performance-baseline.json");
}

function getToolcraftPerformanceReceiptPath(rootDir) {
  return getVerificationReceiptPath(rootDir, "performance.json");
}

export function getToolcraftLegacyCheckpointReceiptPaths(rootDir) {
  return Object.freeze({
    currentPerformance: getToolcraftPerformanceReceiptPath(rootDir),
    delivery: getToolcraftDeliveryReceiptPath(rootDir),
    performanceBaseline: getToolcraftPerformanceBaselineReceiptPath(rootDir),
  });
}
