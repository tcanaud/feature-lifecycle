import { join } from "node:path";
import { readIndexYaml, writeIndexYaml } from "./feature-io.js";

export function updateIndex(projectRoot, featureId, summary) {
  const indexPath = join(projectRoot, ".features", "index.yaml");
  const index = readIndexYaml(indexPath);

  // Find or create entry
  let entry = index.features.find((f) => f.feature_id === featureId);
  if (!entry) {
    entry = { feature_id: featureId };
    index.features.push(entry);
  }

  // Update fields
  entry.title = summary.title || entry.title || "";
  entry.stage = summary.stage || entry.stage || "ideation";
  entry.progress = summary.progress ?? entry.progress ?? 0;
  entry.health = summary.health || entry.health || "HEALTHY";
  entry.status = summary.status || entry.status || "active";

  // Update timestamp
  index.updated = new Date().toISOString().split("T")[0];

  // Sort features by ID
  index.features.sort((a, b) => a.feature_id.localeCompare(b.feature_id));

  writeIndexYaml(indexPath, index);
}

export function readIndex(projectRoot) {
  const indexPath = join(projectRoot, ".features", "index.yaml");
  return readIndexYaml(indexPath);
}
