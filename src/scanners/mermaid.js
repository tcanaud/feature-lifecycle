import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function scanMermaid(projectRoot, config, featureId) {
  const result = { count: 0, layers: { L0: 0, L1: 0, L2: 0 } };

  const mermaidDir = config.mermaid_dir;
  if (!mermaidDir) return result;

  const featureMermaidDir = join(projectRoot, mermaidDir, featureId);
  if (!existsSync(featureMermaidDir)) return result;

  const indexPath = join(featureMermaidDir, "_index.yaml");
  if (!existsSync(indexPath)) return result;

  const content = readFileSync(indexPath, "utf-8");

  // Count total diagrams
  const totalMatch = content.match(/total_diagrams:\s*(\d+)/);
  if (totalMatch) {
    result.count = parseInt(totalMatch[1], 10);
  }

  // Count per layer - look for layer entries
  const l0Match = content.match(/L0:\s*(\d+)/);
  const l1Match = content.match(/L1:\s*(\d+)/);
  const l2Match = content.match(/L2:\s*(\d+)/);

  if (l0Match) result.layers.L0 = parseInt(l0Match[1], 10);
  if (l1Match) result.layers.L1 = parseInt(l1Match[1], 10);
  if (l2Match) result.layers.L2 = parseInt(l2Match[1], 10);

  // If total not found, compute from layers
  if (!totalMatch) {
    result.count = result.layers.L0 + result.layers.L1 + result.layers.L2;
  }

  return result;
}
