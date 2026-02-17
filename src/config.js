import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = join(__dirname, "..", "templates");

function readBmadConfig(projectRoot, bmadDir) {
  const configPath = join(projectRoot, bmadDir, "core", "config.yaml");
  if (!existsSync(configPath)) return {};

  const content = readFileSync(configPath, "utf-8");
  const result = {};

  const match = (key) => {
    const re = new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m");
    const m = content.match(re);
    return m ? m[1].replace(/\{project-root\}\/?/, "") : null;
  };

  result.user_name = match("user_name");
  result.output_folder = match("output_folder");

  return result;
}

export function generateConfig(projectRoot, detected) {
  const bmadConfig = detected.hasBmad
    ? readBmadConfig(projectRoot, detected.bmadDir)
    : {};

  const owner = bmadConfig.user_name || detected.gitUserName || "";

  // Resolve bmad_output_dir
  let bmadOutputDir = null;
  if (detected.hasBmad && bmadConfig.output_folder) {
    bmadOutputDir = bmadConfig.output_folder.replace(/\/$/, "");
  } else if (detected.hasBmad) {
    bmadOutputDir = ".bmad_output";
  }

  // Resolve mermaid dir
  let mermaidDir = null;
  if (bmadOutputDir) {
    mermaidDir = bmadOutputDir + "/mermaid";
  }

  // Read config template and substitute
  const templatePath = join(TEMPLATES, "core", "config.yaml");
  let content = readFileSync(templatePath, "utf-8");

  content = content.replace("{{bmad_dir}}", detected.hasBmad ? detected.bmadDir : "null");
  content = content.replace("{{bmad_output_dir}}", bmadOutputDir || "null");
  content = content.replace("{{mermaid_dir}}", mermaidDir || "null");
  content = content.replace("{{default_owner}}", owner);

  const configPath = join(projectRoot, ".features", "config.yaml");
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, content);

  return configPath;
}

export function readConfig(projectRoot) {
  const configPath = join(projectRoot, ".features", "config.yaml");
  if (!existsSync(configPath)) return null;

  const content = readFileSync(configPath, "utf-8");
  const config = {};

  const matchSimple = (key) => {
    const re = new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m");
    const m = content.match(re);
    if (!m) return null;
    const val = m[1].trim();
    return val === "null" ? null : val;
  };

  config.version = matchSimple("version");
  config.bmad_dir = matchSimple("bmad_dir");
  config.bmad_output_dir = matchSimple("bmad_output_dir");
  config.speckit_specs_dir = matchSimple("speckit_specs_dir");
  config.agreements_dir = matchSimple("agreements_dir");
  config.adr_dir = matchSimple("adr_dir");
  config.mermaid_dir = matchSimple("mermaid_dir");
  config.default_owner = matchSimple("default_owner");

  return config;
}
