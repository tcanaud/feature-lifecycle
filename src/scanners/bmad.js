import { existsSync } from "node:fs";
import { join } from "node:path";

export function scanBmad(projectRoot, config, featureId) {
  const result = { prd: false, architecture: false, epics: false };

  const bmadOutputDir = config.bmad_output_dir;
  if (!bmadOutputDir) return result;

  const artifactsDir = join(projectRoot, bmadOutputDir, "planning-artifacts");
  if (!existsSync(artifactsDir)) return result;

  // Check for generic artifacts (no feature prefix)
  result.prd = existsSync(join(artifactsDir, "prd.md"));
  result.architecture = existsSync(join(artifactsDir, "architecture.md"));
  result.epics = existsSync(join(artifactsDir, "epics.md"));

  // Also check for feature-prefixed variants
  if (!result.prd) {
    result.prd = existsSync(join(artifactsDir, `${featureId}-prd.md`));
  }
  if (!result.architecture) {
    result.architecture = existsSync(join(artifactsDir, `${featureId}-architecture.md`));
  }
  if (!result.epics) {
    result.epics = existsSync(join(artifactsDir, `${featureId}-epics.md`));
  }

  return result;
}
