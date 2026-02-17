import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function scanSpeckit(projectRoot, config, featureId) {
  const result = {
    spec: false,
    plan: false,
    research: false,
    tasks: false,
    contracts: false,
    tasks_done: 0,
    tasks_total: 0,
  };

  const specsDir = config.speckit_specs_dir || "specs";
  const featureDir = join(projectRoot, specsDir, featureId);
  if (!existsSync(featureDir)) return result;

  result.spec = existsSync(join(featureDir, "spec.md"));
  result.plan = existsSync(join(featureDir, "plan.md"));
  result.research = existsSync(join(featureDir, "research.md"));
  result.contracts = existsSync(join(featureDir, "contracts"));

  // Parse tasks.md for checkbox counts
  const tasksPath = join(featureDir, "tasks.md");
  if (existsSync(tasksPath)) {
    result.tasks = true;
    const content = readFileSync(tasksPath, "utf-8");
    const doneMatches = content.match(/- \[x\]/gi);
    const pendingMatches = content.match(/- \[ \]/g);
    result.tasks_done = doneMatches ? doneMatches.length : 0;
    result.tasks_total =
      (doneMatches ? doneMatches.length : 0) +
      (pendingMatches ? pendingMatches.length : 0);
  }

  return result;
}
