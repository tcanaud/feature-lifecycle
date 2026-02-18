import { existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

function detectBmadDir(projectRoot) {
  if (existsSync(join(projectRoot, "_bmad"))) return "_bmad";
  if (existsSync(join(projectRoot, ".bmad"))) return ".bmad";
  return null;
}

function getGitUserName() {
  try {
    return execSync("git config user.name", { encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

function hasCommand(cmd) {
  try {
    execSync(`command -v ${cmd}`, { encoding: "utf-8", stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function detect(projectRoot) {
  const bmadDir = detectBmadDir(projectRoot);
  const hasBmad = bmadDir !== null;
  const hasSpeckit = existsSync(join(projectRoot, ".specify"));
  const hasAgreements = existsSync(join(projectRoot, ".agreements"));
  const hasAdr = existsSync(join(projectRoot, ".adr"));
  const hasClaudeCommands = existsSync(join(projectRoot, ".claude", "commands"));
  const hasMermaid = existsSync(join(projectRoot, ".bmad_output", "mermaid"));
  const hasQa = existsSync(join(projectRoot, ".qa"));
  const hasProduct = existsSync(join(projectRoot, ".product"));
  const hasGhCli = hasCommand("gh");
  const gitUserName = getGitUserName();

  return {
    hasBmad,
    bmadDir,
    hasSpeckit,
    hasAgreements,
    hasAdr,
    hasClaudeCommands,
    hasMermaid,
    hasQa,
    hasProduct,
    hasGhCli,
    gitUserName,
  };
}
