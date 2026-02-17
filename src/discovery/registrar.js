import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { scanAllArtifacts } from "../scanners/index.js";
import { computeStage } from "../stage-engine.js";
import { computeHealth } from "../health-engine.js";
import { readFeatureYaml, writeFeatureYaml } from "../feature-io.js";
import { updateIndex } from "../index-manager.js";
import { buildArtifactsSnapshot } from "../regression.js";

function readTemplate(projectRoot) {
  const templatePath = join(projectRoot, ".features", "_templates", "feature.tpl.yaml");
  if (!existsSync(templatePath)) return null;
  return readFileSync(templatePath, "utf-8");
}

export function registerFeature(projectRoot, config, featureId, title, stageRules, healthRules) {
  const featurePath = join(projectRoot, ".features", featureId, "feature.yaml");
  const now = new Date().toISOString().split("T")[0];
  const timestamp = new Date().toISOString();

  // Scan artifacts
  const artifacts = scanAllArtifacts(projectRoot, config, featureId);

  // Compute stage and health
  const { stage, progress } = computeStage(artifacts, stageRules);
  const health = computeHealth(artifacts, healthRules);

  // Build feature data
  const feature = {
    feature_id: featureId,
    title: title,
    status: "active",
    owner: config.default_owner || "",
    created: now,
    updated: now,
    depends_on: [],
    tags: [],
    lifecycle: {
      stage,
      stage_since: now,
      progress,
      manual_override: null,
    },
    artifacts,
    health,
    last_scan: {
      timestamp,
      stage,
      artifacts_snapshot: buildArtifactsSnapshot(artifacts),
    },
  };

  // If existing feature.yaml, preserve identity fields
  if (existsSync(featurePath)) {
    const existing = readFeatureYaml(featurePath);
    if (existing) {
      feature.created = existing.created || now;
      feature.owner = existing.owner || config.default_owner || "";
      feature.depends_on = existing.depends_on || [];
      feature.tags = existing.tags || [];
      if (existing.lifecycle?.manual_override) {
        feature.lifecycle.manual_override = existing.lifecycle.manual_override;
      }
    }
  }

  writeFeatureYaml(featurePath, feature);

  return feature;
}

export function registerAll(projectRoot, config, discoveries, stageRules, healthRules) {
  const results = [];

  for (const discovery of discoveries) {
    const featurePath = join(projectRoot, ".features", discovery.featureId, "feature.yaml");
    const exists = existsSync(featurePath);

    const feature = registerFeature(
      projectRoot,
      config,
      discovery.featureId,
      discovery.title,
      stageRules,
      healthRules
    );

    const action = exists ? "UPDATED" : "CREATED";

    // Update index
    updateIndex(projectRoot, discovery.featureId, {
      title: feature.title,
      stage: feature.lifecycle.stage,
      progress: feature.lifecycle.progress,
      health: feature.health.overall,
      status: feature.status,
    });

    results.push({
      featureId: discovery.featureId,
      action,
      stage: feature.lifecycle.stage,
      sources: discovery.sources,
    });
  }

  return results;
}
