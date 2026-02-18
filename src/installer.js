import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { detect } from "./detect.js";
import { generateConfig } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = join(__dirname, "..", "templates");

function copyTemplate(src, dest) {
  const destDir = dirname(dest);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  copyFileSync(src, dest);
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

export async function install(flags = []) {
  const projectRoot = process.cwd();
  const skipBmad = flags.includes("--skip-bmad");
  const autoYes = flags.includes("--yes");

  console.log("\n  feature-lifecycle v1.1.0\n");

  // ── Detect environment ──────────────────────────────
  const env = detect(projectRoot);

  console.log("  Environment detected:");
  console.log(`    BMAD:            ${env.hasBmad ? `yes (${env.bmadDir}/)` : "no"}`);
  console.log(`    Spec Kit:        ${env.hasSpeckit ? "yes" : "no"}`);
  console.log(`    Agreements:      ${env.hasAgreements ? "yes" : "no"}`);
  console.log(`    ADR:             ${env.hasAdr ? "yes" : "no"}`);
  console.log(`    Claude commands: ${env.hasClaudeCommands ? "yes" : "no"}`);
  console.log(`    Mermaid:         ${env.hasMermaid ? "yes" : "no"}`);
  console.log(`    QA System:       ${env.hasQa ? "yes" : "no"}`);
  console.log(`    Product Manager: ${env.hasProduct ? "yes" : "no"}`);
  console.log(`    GitHub CLI:      ${env.hasGhCli ? "yes" : "no"}`);
  console.log();

  const featuresDir = join(projectRoot, ".features");

  if (existsSync(featuresDir) && !autoYes) {
    const answer = await ask("  .features/ already exists. Overwrite templates? (y/N) ");
    if (answer !== "y" && answer !== "yes") {
      console.log("  Skipping. Use 'feature-lifecycle update' to update commands only.\n");
      return;
    }
  }

  // ── Phase 1/3: Core ──────────────────────────────────
  console.log("  [1/3] Installing core...");

  const coreMappings = [
    ["core/feature.tpl.yaml", ".features/_templates/feature.tpl.yaml"],
    ["core/index.yaml", ".features/index.yaml"],
    ["core/lifecycle.md", ".features/lifecycle.md"],
  ];

  for (const [src, dest] of coreMappings) {
    const destPath = join(projectRoot, dest);
    // Don't overwrite index.yaml if it already has features
    if (dest === ".features/index.yaml" && existsSync(destPath)) {
      const content = readFileSync(destPath, "utf-8");
      if (content.includes("feature_id:")) {
        console.log(`    skip ${dest} (has existing features)`);
        continue;
      }
    }
    copyTemplate(join(TEMPLATES, src), destPath);
    console.log(`    write ${dest}`);
  }

  // Generate config with detected paths
  const configPath = join(projectRoot, ".features", "config.yaml");
  if (existsSync(configPath)) {
    console.log("    skip .features/config.yaml (already configured)");
  } else {
    generateConfig(projectRoot, env);
    console.log("    write .features/config.yaml (paths auto-detected)");
  }

  // Create _output directory
  const outputDir = join(projectRoot, ".features", "_output");
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
    console.log("    create .features/_output/");
  }

  // ── Phase 2/3: Claude Code commands ──────────────────
  console.log("  [2/3] Installing Claude Code commands...");

  if (!env.hasClaudeCommands) {
    mkdirSync(join(projectRoot, ".claude", "commands"), { recursive: true });
    console.log("    create .claude/commands/");
  }

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
      console.log(`    write ${dest}`);
    }
  }

  // ── Phase 3/3: BMAD Integration ─────────────────────
  const shouldInstallBmad = !skipBmad && env.hasBmad;

  if (shouldInstallBmad) {
    console.log(`  [3/3] Installing BMAD integration (${env.bmadDir}/)...`);

    const bmadCustomizeDir = join(projectRoot, env.bmadDir, "_config", "agents");

    if (!existsSync(bmadCustomizeDir)) {
      console.log(`    warn: ${env.bmadDir}/_config/agents/ not found, skipping`);
    } else {
      const customizeFile = "bmm-pm.customize.yaml";
      const destPath = join(bmadCustomizeDir, customizeFile);

      if (existsSync(destPath)) {
        const content = readFileSync(destPath, "utf-8");
        if (content.includes("feature-lifecycle")) {
          console.log(`    skip ${customizeFile} (already has Feature Lifecycle integration)`);
        } else {
          // Append our section to the existing file (don't overwrite other systems)
          const snippet = readFileSync(join(TEMPLATES, "bmad", customizeFile), "utf-8");
          appendFileSync(destPath, "\n" + snippet);
          console.log(`    append ${env.bmadDir}/_config/agents/${customizeFile}`);
        }
      } else {
        copyTemplate(join(TEMPLATES, "bmad", customizeFile), destPath);
        console.log(`    write ${env.bmadDir}/_config/agents/${customizeFile}`);
      }
    }
  } else if (env.hasBmad && skipBmad) {
    console.log("  [3/3] BMAD integration skipped (--skip-bmad).");
  } else {
    console.log("  [3/3] No BMAD detected, skipping integration.");
  }

  // ── Done ────────────────────────────────────────────
  console.log();
  console.log("  Done! Feature Lifecycle Tracker installed.");
  console.log("  Config: .features/config.yaml (edit to customize paths)");
  console.log();
  console.log("  Available commands:");
  console.log("    /feature.status <id>    Detailed status of one feature");
  console.log("    /feature.list           Dashboard of all features");
  console.log("    /feature.graph          Dependency visualization");
  console.log("    /feature.discover       Auto-register existing features");
  console.log("    /feature.workflow <id>  Guided workflow playbook");
  console.log("    /feature.pr <id>        Create PR with governance traceability");
  console.log("    /feature.resolve <id>   Post-merge lifecycle resolution");
  console.log();
}
