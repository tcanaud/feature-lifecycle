export function formatDashboard(features) {
  const count = features.length;
  const lines = [];

  lines.push(`## Feature Dashboard — ${count} feature${count !== 1 ? "s" : ""}`);
  lines.push("");
  lines.push("| ID | Title | Stage | Progress | Health | Agreement |");
  lines.push("|----|-------|-------|----------|--------|-----------|");

  for (const f of features) {
    const id = f.feature_id || "";
    const title = f.title || "";
    const stage = f.stage || "ideation";
    const progress = Math.round((f.progress || 0) * 100) + "%";
    const health = f.health || "HEALTHY";
    const agreement = f.agreement || "MISSING";

    lines.push(`| ${id} | ${title} | ${stage} | ${progress} | ${health} | ${agreement} |`);
  }

  return lines.join("\n");
}

export function formatDashboardJson(features) {
  return features.map((f) => ({
    feature_id: f.feature_id || "",
    title: f.title || "",
    stage: f.stage || "ideation",
    progress: f.progress || 0,
    health: f.health || "HEALTHY",
    agreement: f.agreement || "MISSING",
  }));
}
