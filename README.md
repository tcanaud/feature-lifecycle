# feature-lifecycle

File-based Feature Lifecycle Tracker — unified status by aggregating BMAD, SpecKit, Agreement, ADR, and Mermaid artifacts.

## Installation

### Via tcsetup (recommended)

```bash
npx tcsetup install
```

### Standalone

```bash
npx feature-lifecycle init
```

### Options

| Flag | Description |
|------|-------------|
| `--yes` | Skip confirmation prompts |
| `--skip-bmad` | Skip BMAD agent integration |

## CLI Usage

```bash
npx feature-lifecycle init      # Install in current project
npx feature-lifecycle update    # Update commands/templates only
npx feature-lifecycle help      # Show usage
```

## Claude Code Commands

After `init`, these commands are available in Claude Code:

| Command | Purpose |
|---------|---------|
| `/feature.status <id>` | Detailed status of one feature |
| `/feature.list` | Dashboard of all features |
| `/feature.graph` | Dependency visualization (Mermaid) |
| `/feature.discover` | Auto-register existing features |

## How It Works

1. **`init`** scaffolds a `.features/` directory with config, templates, and index
2. **`/feature.status`** scans 5 artifact sources (BMAD, SpecKit, Agreement, ADR, Mermaid) and computes lifecycle stage + health
3. **`/feature.list`** aggregates all features into a dashboard table
4. **`/feature.graph`** generates a Mermaid dependency graph with status colors
5. **`/feature.discover`** scans `specs/`, `.agreements/`, and mermaid directories to auto-register existing features

## Lifecycle Stages

`ideation` → `spec` → `plan` → `tasks` → `implement` → `test` → `release`

Stages are automatically computed from artifact presence. Edit `.features/config.yaml` to customize rules.

## Directory Structure

```
.features/
├── config.yaml              # Project configuration
├── index.yaml               # Global registry of all features
├── lifecycle.md             # Documentation
├── _templates/
│   └── feature.tpl.yaml    # Template for new features
├── _output/                 # Generated JSON output
│   ├── dashboard.json
│   └── {feature_id}.json
└── {feature_id}/
    └── feature.yaml         # Per-feature manifest
```

## Requirements

- Node.js >= 18.0.0
- Zero runtime dependencies
