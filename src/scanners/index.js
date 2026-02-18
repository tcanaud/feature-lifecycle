import { scanBmad } from "./bmad.js";
import { scanSpeckit } from "./speckit.js";
import { scanAgreement } from "./agreement.js";
import { scanAdr } from "./adr.js";
import { scanMermaid } from "./mermaid.js";
import { scanQa } from "./qa.js";

export { scanBmad, scanSpeckit, scanAgreement, scanAdr, scanMermaid, scanQa };

export function scanAllArtifacts(projectRoot, config, featureId) {
  const bmad = scanBmad(projectRoot, config, featureId);
  const speckit = scanSpeckit(projectRoot, config, featureId);
  const agreement = scanAgreement(projectRoot, config, featureId);
  const adr = scanAdr(projectRoot, config, featureId);
  const mermaid = scanMermaid(projectRoot, config, featureId);
  const qa = scanQa(projectRoot, config, featureId);

  return {
    bmad: {
      prd: bmad.prd,
      architecture: bmad.architecture,
      epics: bmad.epics,
    },
    speckit: {
      spec: speckit.spec,
      plan: speckit.plan,
      research: speckit.research,
      tasks: speckit.tasks,
      contracts: speckit.contracts,
      tasks_done: speckit.tasks_done,
      tasks_total: speckit.tasks_total,
    },
    agreement: {
      exists: agreement.exists,
      status: agreement.status,
      check: agreement.check,
    },
    adr: {
      count: adr.count,
      ids: adr.ids,
    },
    mermaid: {
      count: mermaid.count,
      layers: mermaid.layers,
    },
    qa: {
      plan_exists: qa.plan_exists,
      verdict: qa.verdict,
      verdict_fresh: qa.verdict_fresh,
      passed: qa.passed,
      failed: qa.failed,
      total: qa.total,
    },
  };
}
