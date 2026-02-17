import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ── Read feature.yaml via regex ────────────────────────
export function readFeatureYaml(filePath) {
  if (!existsSync(filePath)) return null;

  const content = readFileSync(filePath, "utf-8");
  const feature = {};

  const str = (key) => {
    const re = new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m");
    const m = content.match(re);
    return m ? m[1] : "";
  };

  const num = (key) => {
    const re = new RegExp(`^${key}:\\s*([\\d.]+)`, "m");
    const m = content.match(re);
    return m ? parseFloat(m[1]) : 0;
  };

  const bool = (key) => {
    const re = new RegExp(`^\\s*${key}:\\s*(true|false)`, "m");
    const m = content.match(re);
    return m ? m[1] === "true" : false;
  };

  // Identity
  feature.feature_version = str("feature_version");
  feature.feature_id = str("feature_id");
  feature.title = str("title");
  feature.status = str("status");
  feature.owner = str("owner");
  feature.created = str("created");
  feature.updated = str("updated");

  // Dependencies
  feature.depends_on = extractYamlArray(content, "depends_on");
  feature.tags = extractYamlArray(content, "tags");

  // Lifecycle
  feature.lifecycle = {
    stage: str("stage"),
    stage_since: str("stage_since"),
    progress: num("progress"),
    manual_override: str("manual_override") || null,
  };
  if (feature.lifecycle.manual_override === "null") {
    feature.lifecycle.manual_override = null;
  }

  // Artifacts
  feature.artifacts = {
    bmad: {
      prd: bool("prd"),
      architecture: bool("architecture"),
      epics: bool("epics"),
    },
    speckit: {
      spec: bool("spec"),
      plan: bool("plan"),
      research: bool("research"),
      tasks: bool("tasks"),
      contracts: bool("contracts"),
      tasks_done: num("tasks_done"),
      tasks_total: num("tasks_total"),
    },
    agreement: {
      exists: bool("exists"),
      status: str("status"),
      check: str("check") || "MISSING",
    },
    adr: {
      count: num("count"),
      ids: extractYamlArray(content, "ids"),
    },
    mermaid: {
      count: num("count"),
      layers: {
        L0: extractNestedNum(content, "L0"),
        L1: extractNestedNum(content, "L1"),
        L2: extractNestedNum(content, "L2"),
      },
    },
  };

  // Health
  feature.health = {
    overall: str("overall") || "HEALTHY",
    agreement: str("agreement") || "MISSING",
    spec_completeness: num("spec_completeness"),
    task_progress: num("task_progress"),
    adr_coverage: num("adr_coverage"),
    diagram_coverage: num("diagram_coverage"),
    warnings: extractYamlArray(content, "warnings"),
  };

  // Last scan
  feature.last_scan = {
    timestamp: str("timestamp"),
    stage: "",
    artifacts_snapshot: {
      bmad_prd: false,
      speckit_spec: false,
      speckit_plan: false,
      speckit_tasks: false,
      agreement_exists: false,
    },
  };

  // Extract last_scan section more carefully
  const lastScanMatch = content.match(/last_scan:\s*\n([\s\S]*?)$/);
  if (lastScanMatch) {
    const section = lastScanMatch[1];
    const lsStr = (key) => {
      const re = new RegExp(`${key}:\\s*["']?(.+?)["']?\\s*$`, "m");
      const m = section.match(re);
      return m ? m[1] : "";
    };
    const lsBool = (key) => {
      const re = new RegExp(`${key}:\\s*(true|false)`, "m");
      const m = section.match(re);
      return m ? m[1] === "true" : false;
    };

    feature.last_scan.stage = lsStr("stage");
    feature.last_scan.artifacts_snapshot = {
      bmad_prd: lsBool("bmad_prd"),
      speckit_spec: lsBool("speckit_spec"),
      speckit_plan: lsBool("speckit_plan"),
      speckit_tasks: lsBool("speckit_tasks"),
      agreement_exists: lsBool("agreement_exists"),
    };
  }

  return feature;
}

function extractYamlArray(content, key) {
  // Match inline array: key: [val1, val2]
  const inlineRe = new RegExp(`^\\s*${key}:\\s*\\[([^\\]]*)\\]`, "m");
  const inlineMatch = content.match(inlineRe);
  if (inlineMatch) {
    const inner = inlineMatch[1].trim();
    if (!inner) return [];
    return inner.split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
  }
  return [];
}

function extractNestedNum(content, key) {
  const re = new RegExp(`^\\s*${key}:\\s*(\\d+)`, "m");
  const m = content.match(re);
  return m ? parseInt(m[1], 10) : 0;
}

// ── Write feature.yaml via template ────────────────────
export function writeFeatureYaml(filePath, f) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const yaml = `feature_version: "1.0"

# ── Identity ──────────────────────────────────────────
feature_id: "${f.feature_id}"
title: "${f.title}"
status: "${f.status || "active"}"
owner: "${f.owner || ""}"
created: "${f.created || ""}"
updated: "${f.updated || ""}"

# ── Dependencies ──────────────────────────────────────
depends_on: [${(f.depends_on || []).map((d) => `"${d}"`).join(", ")}]
tags: [${(f.tags || []).map((t) => `"${t}"`).join(", ")}]

# ── Lifecycle (computed) ──────────────────────────────
lifecycle:
  stage: "${f.lifecycle?.stage || "ideation"}"
  stage_since: "${f.lifecycle?.stage_since || ""}"
  progress: ${f.lifecycle?.progress ?? 0}
  manual_override: ${f.lifecycle?.manual_override ? `"${f.lifecycle.manual_override}"` : "null"}

# ── Artifacts (computed from scan) ────────────────────
artifacts:
  bmad:
    prd: ${f.artifacts?.bmad?.prd ?? false}
    architecture: ${f.artifacts?.bmad?.architecture ?? false}
    epics: ${f.artifacts?.bmad?.epics ?? false}
  speckit:
    spec: ${f.artifacts?.speckit?.spec ?? false}
    plan: ${f.artifacts?.speckit?.plan ?? false}
    research: ${f.artifacts?.speckit?.research ?? false}
    tasks: ${f.artifacts?.speckit?.tasks ?? false}
    contracts: ${f.artifacts?.speckit?.contracts ?? false}
    tasks_done: ${f.artifacts?.speckit?.tasks_done ?? 0}
    tasks_total: ${f.artifacts?.speckit?.tasks_total ?? 0}
  agreement:
    exists: ${f.artifacts?.agreement?.exists ?? false}
    status: "${f.artifacts?.agreement?.status || ""}"
    check: "${f.artifacts?.agreement?.check || "MISSING"}"
  adr:
    count: ${f.artifacts?.adr?.count ?? 0}
    ids: [${(f.artifacts?.adr?.ids || []).map((id) => `"${id}"`).join(", ")}]
  mermaid:
    count: ${f.artifacts?.mermaid?.count ?? 0}
    layers:
      L0: ${f.artifacts?.mermaid?.layers?.L0 ?? 0}
      L1: ${f.artifacts?.mermaid?.layers?.L1 ?? 0}
      L2: ${f.artifacts?.mermaid?.layers?.L2 ?? 0}

# ── Health (computed) ─────────────────────────────────
health:
  overall: "${f.health?.overall || "HEALTHY"}"
  agreement: "${f.health?.agreement || "MISSING"}"
  spec_completeness: ${f.health?.spec_completeness ?? 0}
  task_progress: ${f.health?.task_progress ?? 0}
  adr_coverage: ${f.health?.adr_coverage ?? 0}
  diagram_coverage: ${f.health?.diagram_coverage ?? 0}
  warnings: [${(f.health?.warnings || []).map((w) => `"${w}"`).join(", ")}]

# ── Regression Detection ─────────────────────────────
last_scan:
  timestamp: "${f.last_scan?.timestamp || ""}"
  stage: "${f.last_scan?.stage || ""}"
  artifacts_snapshot:
    bmad_prd: ${f.last_scan?.artifacts_snapshot?.bmad_prd ?? false}
    speckit_spec: ${f.last_scan?.artifacts_snapshot?.speckit_spec ?? false}
    speckit_plan: ${f.last_scan?.artifacts_snapshot?.speckit_plan ?? false}
    speckit_tasks: ${f.last_scan?.artifacts_snapshot?.speckit_tasks ?? false}
    agreement_exists: ${f.last_scan?.artifacts_snapshot?.agreement_exists ?? false}
`;

  writeFileSync(filePath, yaml);
}

// ── Index YAML I/O ───────────────────────────────────
export function readIndexYaml(filePath) {
  if (!existsSync(filePath)) {
    return { version: "1.0", updated: "", features: [] };
  }

  const content = readFileSync(filePath, "utf-8");
  const index = {
    version: "1.0",
    updated: "",
    features: [],
  };

  // Extract version
  const versionMatch = content.match(/^version:\s*["']?(.+?)["']?\s*$/m);
  if (versionMatch) index.version = versionMatch[1];

  // Extract updated
  const updatedMatch = content.match(/^updated:\s*["']?(.+?)["']?\s*$/m);
  if (updatedMatch) index.updated = updatedMatch[1];

  // Extract features array entries
  const featureBlocks = content.split(/\n\s*-\s+feature_id:/).slice(1);
  for (const block of featureBlocks) {
    const entry = {};
    const fullBlock = "feature_id:" + block;

    const extractField = (key) => {
      const re = new RegExp(`${key}:\\s*["']?(.+?)["']?\\s*$`, "m");
      const m = fullBlock.match(re);
      return m ? m[1] : "";
    };

    entry.feature_id = extractField("feature_id");
    entry.title = extractField("title");
    entry.stage = extractField("stage");
    entry.progress = parseFloat(extractField("progress")) || 0;
    entry.health = extractField("health");
    entry.status = extractField("status");

    if (entry.feature_id) {
      index.features.push(entry);
    }
  }

  return index;
}

export function writeIndexYaml(filePath, indexData) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  let yaml = `# Feature Lifecycle Index
# Auto-maintained by /feature.status, /feature.list, and /feature.discover
# Lists all registered features for global discovery

version: "${indexData.version || "1.0"}"
updated: "${indexData.updated || ""}"

features:
`;

  if (indexData.features && indexData.features.length > 0) {
    for (const f of indexData.features) {
      yaml += `  - feature_id: "${f.feature_id}"
    title: "${f.title || ""}"
    stage: "${f.stage || "ideation"}"
    progress: ${f.progress ?? 0}
    health: "${f.health || "HEALTHY"}"
    status: "${f.status || "active"}"
`;
    }
  } else {
    yaml = yaml.replace(/features:\n$/, "features: []\n");
  }

  writeFileSync(filePath, yaml);
}
