import { detectCycles } from "./cycle-detector.js";

const STAGE_COLORS = {
  release: "green",
  test: "blue",
  implement: "blue",
  tasks: "yellow",
  plan: "yellow",
  spec: "yellow",
  ideation: "yellow",
};

export function generateDependencyGraph(features) {
  const cycles = detectCycles(features);
  const lines = [];

  // YAML frontmatter
  lines.push("---");
  lines.push("id: dependency-graph");
  lines.push("title: Feature Dependencies");
  lines.push("type: flowchart");
  lines.push("layer: L0");
  lines.push("feature: 000-feature-lifecycle");
  lines.push("---");
  lines.push("");

  // Mermaid flowchart
  lines.push("flowchart TD");

  // Cycle warning
  if (cycles.length > 0) {
    lines.push(`  %% WARNING: ${cycles.length} circular dependency(ies) detected`);
    for (const cycle of cycles) {
      lines.push(`  %% Cycle: ${cycle.join(" → ")}`);
    }
    lines.push("");
  }

  // Nodes
  for (const f of features) {
    const id = sanitizeId(f.feature_id);
    const title = f.title || f.feature_id;
    const stage = f.lifecycle?.stage || f.stage || "ideation";
    const progress = Math.round((f.lifecycle?.progress || f.progress || 0) * 100);
    lines.push(`  ${id}["${title}<br/>${stage} ${progress}%"]`);
  }

  lines.push("");

  // Edges
  for (const f of features) {
    const id = sanitizeId(f.feature_id);
    const deps = f.depends_on || [];
    for (const dep of deps) {
      const depId = sanitizeId(dep);
      lines.push(`  ${depId} --> ${id}`);
    }
  }

  lines.push("");

  // Style classes
  lines.push("  classDef green fill:#2ecc71,color:#fff");
  lines.push("  classDef blue fill:#3498db,color:#fff");
  lines.push("  classDef yellow fill:#f1c40f,color:#333");
  lines.push("  classDef red fill:#e74c3c,color:#fff");
  lines.push("");

  // Apply styles
  for (const f of features) {
    const id = sanitizeId(f.feature_id);
    const stage = f.lifecycle?.stage || f.stage || "ideation";
    const health = f.health?.overall || f.health || "HEALTHY";

    // CRITICAL health overrides stage color
    if (health === "CRITICAL") {
      lines.push(`  class ${id} red`);
    } else {
      const color = STAGE_COLORS[stage] || "yellow";
      lines.push(`  class ${id} ${color}`);
    }
  }

  return lines.join("\n");
}

function sanitizeId(id) {
  // Replace hyphens and special chars with underscores for Mermaid compatibility
  return id.replace(/[^a-zA-Z0-9]/g, "_");
}
