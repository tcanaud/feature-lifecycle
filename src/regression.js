import { STAGE_ORDER } from "./stage-engine.js";

export function detectRegression(currentStage, lastScan) {
  const warnings = [];

  if (!lastScan || !lastScan.stage) return warnings;

  // Check stage regression
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const lastIndex = STAGE_ORDER.indexOf(lastScan.stage);

  if (currentIndex >= 0 && lastIndex >= 0 && currentIndex < lastIndex) {
    warnings.push(
      `Stage regression detected: ${lastScan.stage} → ${currentStage}`
    );
  }

  // Check artifact disappearance
  if (lastScan.artifacts_snapshot) {
    const snapshotKeys = {
      bmad_prd: "bmad.prd",
      speckit_spec: "speckit.spec",
      speckit_plan: "speckit.plan",
      speckit_tasks: "speckit.tasks",
      agreement_exists: "agreement.exists",
    };

    for (const [snapshotKey, displayKey] of Object.entries(snapshotKeys)) {
      if (lastScan.artifacts_snapshot[snapshotKey] === true) {
        // This artifact was present in last scan — caller should check if still present
        // We flag it here for the caller to compare
        warnings.push(`CHECK_ARTIFACT:${snapshotKey}:${displayKey}`);
      }
    }
  }

  return warnings;
}

export function buildArtifactsSnapshot(artifacts) {
  return {
    bmad_prd: Boolean(artifacts.bmad?.prd),
    speckit_spec: Boolean(artifacts.speckit?.spec),
    speckit_plan: Boolean(artifacts.speckit?.plan),
    speckit_tasks: Boolean(artifacts.speckit?.tasks),
    agreement_exists: Boolean(artifacts.agreement?.exists),
  };
}

export function compareSnapshots(current, previous) {
  const warnings = [];
  if (!previous) return warnings;

  const labels = {
    bmad_prd: "BMAD PRD",
    speckit_spec: "SpecKit spec.md",
    speckit_plan: "SpecKit plan.md",
    speckit_tasks: "SpecKit tasks.md",
    agreement_exists: "Agreement",
  };

  for (const [key, label] of Object.entries(labels)) {
    if (previous[key] === true && current[key] === false) {
      warnings.push(`Artifact disappeared: ${label}`);
    }
  }

  return warnings;
}
