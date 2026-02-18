import { existsSync, copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = join(__dirname, "..", "templates");

function copyTemplate(src, dest) {
  const destDir = dirname(dest);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  copyFileSync(src, dest);
}

export function update(flags = []) {
  const projectRoot = process.cwd();

  console.log("\n  feature-lifecycle update\n");

  if (!existsSync(join(projectRoot, ".features"))) {
    console.error("  Error: .features/ not found. Run 'feature-lifecycle init' first.");
    process.exit(1);
  }

  // Update template
  console.log("  Updating templates...");
  copyTemplate(
    join(TEMPLATES, "core", "feature.tpl.yaml"),
    join(projectRoot, ".features", "_templates", "feature.tpl.yaml")
  );
  console.log("    update .features/_templates/feature.tpl.yaml");

  copyTemplate(
    join(TEMPLATES, "core", "lifecycle.md"),
    join(projectRoot, ".features", "lifecycle.md")
  );
  console.log("    update .features/lifecycle.md");

  // Update commands
  console.log("  Updating Claude Code commands...");

  const commandMappings = [
    ["commands/feature.status.md", ".claude/commands/feature.status.md"],
    ["commands/feature.list.md", ".claude/commands/feature.list.md"],
    ["commands/feature.graph.md", ".claude/commands/feature.graph.md"],
    ["commands/feature.discover.md", ".claude/commands/feature.discover.md"],
    ["commands/feature.workflow.md", ".claude/commands/feature.workflow.md"],
    ["commands/feature.pr.md", ".claude/commands/feature.pr.md"],
    ["commands/feature.resolve.md", ".claude/commands/feature.resolve.md"],
  ];

  for (const [src, dest] of commandMappings) {
    const srcPath = join(TEMPLATES, src);
    if (existsSync(srcPath)) {
      copyTemplate(srcPath, join(projectRoot, dest));
      console.log(`    update ${dest}`);
    }
  }

  // Update BMAD integration if present
  const bmadDir = existsSync(join(projectRoot, "_bmad")) ? "_bmad"
    : existsSync(join(projectRoot, ".bmad")) ? ".bmad"
    : null;

  if (bmadDir) {
    const bmadCustomizeDir = join(projectRoot, bmadDir, "_config", "agents");
    if (existsSync(bmadCustomizeDir)) {
      const srcPath = join(TEMPLATES, "bmad", "bmm-pm.customize.yaml");
      const destPath = join(bmadCustomizeDir, "bmm-pm.customize.yaml");
      if (existsSync(srcPath)) {
        console.log(`  Updating BMAD integration (${bmadDir}/)...`);
        if (existsSync(destPath)) {
          const existing = readFileSync(destPath, "utf-8");
          const snippet = readFileSync(srcPath, "utf-8");
          // Remove old feature-lifecycle block and re-append fresh version
          const marker = "# Feature Lifecycle Tracker";
          const markerIndex = existing.indexOf(marker);
          if (markerIndex >= 0) {
            // Replace from marker to end with fresh snippet
            const before = existing.substring(0, markerIndex).trimEnd();
            writeFileSync(destPath, before + "\n\n" + snippet);
            console.log(`    update ${bmadDir}/_config/agents/bmm-pm.customize.yaml (replaced section)`);
          } else {
            // Not present yet — append
            writeFileSync(destPath, existing.trimEnd() + "\n\n" + snippet);
            console.log(`    append ${bmadDir}/_config/agents/bmm-pm.customize.yaml`);
          }
        } else {
          copyTemplate(srcPath, destPath);
          console.log(`    write ${bmadDir}/_config/agents/bmm-pm.customize.yaml`);
        }
      }
    }
  }

  console.log();
  console.log("  Done! Commands and templates updated.");
  console.log("  Your existing features, config, and index are untouched.\n");
}
