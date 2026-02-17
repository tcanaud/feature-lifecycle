import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

export function writeFeatureJson(projectRoot, featureId, featureData) {
  const outputDir = join(projectRoot, ".features", "_output");
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = join(outputDir, `${featureId}.json`);
  writeFileSync(outputPath, JSON.stringify(featureData, null, 2));
  return outputPath;
}

export function writeDashboardJson(projectRoot, features) {
  const outputDir = join(projectRoot, ".features", "_output");
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = join(outputDir, "dashboard.json");
  writeFileSync(outputPath, JSON.stringify({ features }, null, 2));
  return outputPath;
}
