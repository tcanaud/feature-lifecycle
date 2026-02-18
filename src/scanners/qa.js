import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

export function scanQa(projectRoot, config, featureId) {
  const specsDir = config.speckit_specs_dir || "specs";
  const qaDir = join(projectRoot, ".qa", featureId);

  const defaults = {
    plan_exists: false,
    verdict: null,
    verdict_fresh: false,
    passed: 0,
    failed: 0,
    total: 0,
    failures: [],
  };

  const indexPath = join(qaDir, "_index.yaml");
  if (!existsSync(indexPath)) {
    return defaults;
  }

  defaults.plan_exists = true;

  const verdictPath = join(qaDir, "verdict.yaml");
  if (!existsSync(verdictPath)) {
    return defaults;
  }

  const verdictContent = readFileSync(verdictPath, "utf-8");

  // Extract fields from verdict.yaml using regex
  const verdictMatch = verdictContent.match(/^verdict:\s*"?(\w+)"?/m);
  const passedMatch = verdictContent.match(/^passed:\s*(\d+)/m);
  const failedMatch = verdictContent.match(/^failed:\s*(\d+)/m);
  const totalMatch = verdictContent.match(/^total:\s*(\d+)/m);
  const specShaMatch = verdictContent.match(/^spec_sha256:\s*"?([a-f0-9]+)"?/m);

  const verdict = verdictMatch ? verdictMatch[1] : null;
  const passed = passedMatch ? parseInt(passedMatch[1], 10) : 0;
  const failed = failedMatch ? parseInt(failedMatch[1], 10) : 0;
  const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;
  const specSha256 = specShaMatch ? specShaMatch[1] : null;

  // Compute freshness
  let verdictFresh = false;
  if (specSha256) {
    const specPath = join(projectRoot, specsDir, featureId, "spec.md");
    if (existsSync(specPath)) {
      const specContent = readFileSync(specPath, "utf-8");
      const currentSha = createHash("sha256").update(specContent).digest("hex");
      verdictFresh = currentSha === specSha256;
    }
  }

  // Extract failures array (simplified — read lines between failures: and next top-level key)
  const failures = [];
  const failureBlocks = verdictContent.split(/^  - script:/m).slice(1);
  for (const block of failureBlocks) {
    const scriptMatch = block.match(/^\s*"?([^"\n]+)"?/);
    const criterionMatch = block.match(/criterion_ref:\s*"?([^"\n]+)"?/);
    const assertionMatch = block.match(/assertion:\s*"?([^"\n]+)"?/);
    const expectedMatch = block.match(/expected:\s*"?([^"\n]+)"?/);
    const actualMatch = block.match(/actual:\s*"?([^"\n]+)"?/);
    if (scriptMatch) {
      failures.push({
        script: scriptMatch[1].trim(),
        criterion_ref: criterionMatch ? criterionMatch[1].trim() : "",
        assertion: assertionMatch ? assertionMatch[1].trim() : "",
        expected: expectedMatch ? expectedMatch[1].trim() : "",
        actual: actualMatch ? actualMatch[1].trim() : "",
      });
    }
  }

  return {
    plan_exists: true,
    verdict,
    verdict_fresh: verdictFresh,
    passed,
    failed,
    total,
    failures,
  };
}
