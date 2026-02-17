export const STAGE_ORDER = [
  "ideation",
  "spec",
  "plan",
  "tasks",
  "implement",
  "test",
  "release",
];

function getArtifactValue(artifacts, key) {
  // key format: "bmad.prd", "speckit.spec", etc.
  const parts = key.split(".");
  let obj = artifacts;
  for (const part of parts) {
    if (obj == null) return false;
    obj = obj[part];
  }
  return Boolean(obj);
}

function getTasksCompletion(artifacts) {
  const total = artifacts.speckit?.tasks_total || 0;
  if (total === 0) return 0;
  const done = artifacts.speckit?.tasks_done || 0;
  return done / total;
}

function evaluateCondition(condition, artifacts) {
  const tasksCompletion = getTasksCompletion(artifacts);

  // Parse simple conditions like "tasks_completion < 0.5"
  // Supports: <, <=, >, >=, ==, AND
  const parts = condition.split(/\s+AND\s+/i);

  for (const part of parts) {
    const match = part.trim().match(/^(\w+)\s*(>=|<=|==|>|<)\s*([\d.]+)$/);
    if (!match) continue;

    const [, varName, op, valueStr] = match;
    const value = parseFloat(valueStr);

    let actual;
    if (varName === "tasks_completion") {
      actual = tasksCompletion;
    } else {
      continue;
    }

    let result;
    switch (op) {
      case "<":  result = actual < value; break;
      case "<=": result = actual <= value; break;
      case ">":  result = actual > value; break;
      case ">=": result = actual >= value; break;
      case "==": result = Math.abs(actual - value) < 0.001; break;
      default:   result = false;
    }

    if (!result) return false;
  }

  return true;
}

export function computeStage(artifacts, stageRules, manualOverride = null) {
  // Manual override takes precedence
  if (manualOverride && STAGE_ORDER.includes(manualOverride)) {
    return { stage: manualOverride, progress: computeProgress(manualOverride, artifacts) };
  }

  // Evaluate top-to-bottom, highest matching stage wins
  // Iterate in reverse order (release → ideation) and return first match
  let highestStage = null;

  for (let i = STAGE_ORDER.length - 1; i >= 0; i--) {
    const stageName = STAGE_ORDER[i];
    const rule = stageRules[stageName];
    if (!rule) continue;

    // Skip manual-only stages
    if (rule.requires_manual) continue;

    let matches = true;

    // Check requires_all
    if (rule.requires_all) {
      for (const key of rule.requires_all) {
        if (!getArtifactValue(artifacts, key)) {
          matches = false;
          break;
        }
      }
    }

    // Check requires_any
    if (matches && rule.requires_any) {
      let anyMatch = false;
      for (const key of rule.requires_any) {
        if (getArtifactValue(artifacts, key)) {
          anyMatch = true;
          break;
        }
      }
      matches = anyMatch;
    }

    // Check condition
    if (matches && rule.condition) {
      matches = evaluateCondition(rule.condition, artifacts);
    }

    if (matches) {
      highestStage = stageName;
      break;
    }
  }

  const stage = highestStage || "ideation";
  return { stage, progress: computeProgress(stage, artifacts) };
}

function computeProgress(stage, artifacts) {
  const tasksCompletion = getTasksCompletion(artifacts);

  switch (stage) {
    case "ideation": return 0;
    case "spec": return 0.1;
    case "plan": return 0.2;
    case "tasks": return 0.3;
    case "implement": return 0.3 + tasksCompletion * 0.5;
    case "test": return 0.9;
    case "release": return 1.0;
    default: return 0;
  }
}
