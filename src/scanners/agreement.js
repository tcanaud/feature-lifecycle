import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function scanAgreement(projectRoot, config, featureId) {
  const result = { exists: false, status: "", check: "MISSING" };

  const agreementsDir = config.agreements_dir || ".agreements";
  const agreementPath = join(projectRoot, agreementsDir, featureId, "agreement.yaml");

  if (!existsSync(agreementPath)) return result;

  result.exists = true;

  const content = readFileSync(agreementPath, "utf-8");

  // Extract status field via regex
  const statusMatch = content.match(/^status:\s*["']?(.+?)["']?\s*$/m);
  if (statusMatch) {
    result.status = statusMatch[1];
  }

  // Check for check-report.md and read verdict
  const reportPath = join(projectRoot, agreementsDir, featureId, "check-report.md");
  if (existsSync(reportPath)) {
    const report = readFileSync(reportPath, "utf-8");
    const verdictMatch = report.match(/verdict:\s*(PASS|FAIL)/i);
    if (verdictMatch) {
      result.check = verdictMatch[1].toUpperCase();
    } else {
      // If report exists but no verdict, mark as FAIL
      result.check = "FAIL";
    }
  } else {
    // Agreement exists but no check report
    result.check = "MISSING";
  }

  return result;
}
