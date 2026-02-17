import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const FEATURE_PATTERN = /^(\d{3})-(.+)$/;

function scanDirectory(dirPath) {
  const results = [];
  if (!existsSync(dirPath)) return results;

  const entries = readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    if (!statSync(fullPath).isDirectory()) continue;

    const match = entry.match(FEATURE_PATTERN);
    if (match) {
      results.push({
        featureId: entry,
        title: match[2].replace(/-/g, " "),
      });
    }
  }
  return results;
}

export function scanForFeatures(projectRoot, config) {
  const discoveries = new Map();

  // Scan specs directory
  const specsDir = config.speckit_specs_dir || "specs";
  const specsResults = scanDirectory(join(projectRoot, specsDir));
  for (const r of specsResults) {
    if (!discoveries.has(r.featureId)) {
      discoveries.set(r.featureId, { featureId: r.featureId, title: r.title, sources: [] });
    }
    discoveries.get(r.featureId).sources.push("specs");
  }

  // Scan agreements directory
  const agreementsDir = config.agreements_dir || ".agreements";
  const agreementsResults = scanDirectory(join(projectRoot, agreementsDir));
  for (const r of agreementsResults) {
    if (!discoveries.has(r.featureId)) {
      discoveries.set(r.featureId, { featureId: r.featureId, title: r.title, sources: [] });
    }
    discoveries.get(r.featureId).sources.push("agreements");
  }

  // Scan mermaid directory
  const mermaidDir = config.mermaid_dir;
  if (mermaidDir) {
    const mermaidResults = scanDirectory(join(projectRoot, mermaidDir));
    for (const r of mermaidResults) {
      if (!discoveries.has(r.featureId)) {
        discoveries.set(r.featureId, { featureId: r.featureId, title: r.title, sources: [] });
      }
      discoveries.get(r.featureId).sources.push("mermaid");
    }
  }

  return Array.from(discoveries.values());
}
