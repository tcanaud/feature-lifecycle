#!/usr/bin/env node

import { argv, exit } from "node:process";
import { install } from "../src/installer.js";
import { update } from "../src/updater.js";

const command = argv[2];
const flags = argv.slice(3);

const HELP = `
feature-lifecycle — File-based Feature Lifecycle Tracker.

Usage:
  npx feature-lifecycle init     Install the Feature Lifecycle Tracker in the current project
  npx feature-lifecycle update   Update commands and templates without touching existing features
  npx feature-lifecycle help     Show this help message

Options (init):
  --skip-bmad       Skip BMAD integration even if detected
  --yes             Skip confirmation prompts

Claude Code commands (after init):
  /feature.status <id>    Detailed status of one feature
  /feature.list           Dashboard of all features
  /feature.graph          Dependency visualization
  /feature.discover       Auto-register existing features
`;

switch (command) {
  case "init":
    install(flags);
    break;
  case "update":
    update(flags);
    break;
  case "help":
  case "--help":
  case "-h":
  case undefined:
    console.log(HELP);
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.log(HELP);
    exit(1);
}
