function evaluateHealthRule(rule, artifacts) {
  // Parse rules like "agreement.check == FAIL", "spec_completeness < 0.5", "adr_coverage == 0"
  const match = rule.match(/^([\w.]+)\s*(==|>=|<=|>|<)\s*(.+)$/);
  if (!match) return false;

  const [, varName, op, valueStr] = match;

  let actual;
  switch (varName) {
    case "agreement.check":
      actual = artifacts.agreement?.check || "MISSING";
      break;
    case "spec_completeness":
      actual = computeSpecCompleteness(artifacts);
      break;
    case "adr_coverage":
      actual = artifacts.adr?.count || 0;
      break;
    default:
      return false;
  }

  // String comparison for non-numeric values
  if (typeof actual === "string") {
    return op === "==" && actual === valueStr;
  }

  // Numeric comparison
  const numValue = parseFloat(valueStr);
  switch (op) {
    case "==": return Math.abs(actual - numValue) < 0.001;
    case "<":  return actual < numValue;
    case "<=": return actual <= numValue;
    case ">":  return actual > numValue;
    case ">=": return actual >= numValue;
    default:   return false;
  }
}

function computeSpecCompleteness(artifacts) {
  const speckit = artifacts.speckit || {};
  const fields = ["spec", "plan", "research", "tasks", "contracts"];
  let present = 0;
  for (const f of fields) {
    if (speckit[f]) present++;
  }
  return fields.length > 0 ? present / fields.length : 0;
}

export function computeHealth(artifacts, healthRules) {
  const warnings = [];
  let overall = "HEALTHY";

  const specCompleteness = computeSpecCompleteness(artifacts);
  const tasksTotal = artifacts.speckit?.tasks_total || 0;
  const tasksDone = artifacts.speckit?.tasks_done || 0;
  const taskProgress = tasksTotal > 0 ? tasksDone / tasksTotal : 0;
  const agreementCheck = artifacts.agreement?.check || "MISSING";
  const adrCoverage = artifacts.adr?.count || 0;
  const diagramCoverage = artifacts.mermaid?.count || 0;

  // Evaluate critical rules
  if (healthRules?.critical_when) {
    for (const rule of healthRules.critical_when) {
      if (evaluateHealthRule(rule, artifacts)) {
        overall = "CRITICAL";
        warnings.push(`CRITICAL: ${rule}`);
      }
    }
  }

  // Evaluate warning rules (only if not already critical)
  if (healthRules?.warning_when) {
    for (const rule of healthRules.warning_when) {
      if (evaluateHealthRule(rule, artifacts)) {
        if (overall !== "CRITICAL") overall = "WARNING";
        warnings.push(`WARNING: ${rule}`);
      }
    }
  }

  return {
    overall,
    agreement: agreementCheck,
    spec_completeness: Math.round(specCompleteness * 100) / 100,
    task_progress: Math.round(taskProgress * 100) / 100,
    adr_coverage: adrCoverage,
    diagram_coverage: diagramCoverage,
    warnings,
  };
}
