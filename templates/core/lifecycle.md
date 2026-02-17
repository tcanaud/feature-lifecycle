# .features/ — Feature Lifecycle Tracker

This directory contains feature lifecycle manifests managed by the Feature Lifecycle Tracker.

## Structure

```
.features/
├── config.yaml              # Project configuration (paths, stage rules, health rules)
├── index.yaml               # Global registry of all features
├── lifecycle.md              # This file
├── _templates/
│   └── feature.tpl.yaml     # Template for new feature manifests
├── _output/                  # Generated JSON output (gitignore-friendly)
│   ├── dashboard.json
│   └── {feature_id}.json
└── {feature_id}/
    └── feature.yaml          # Per-feature manifest with computed lifecycle data
```

## Commands

| Command | Purpose |
|---------|---------|
| `/feature.status <id>` | Detailed status of one feature |
| `/feature.list` | Dashboard of all features |
| `/feature.graph` | Dependency visualization |
| `/feature.discover` | Auto-register existing features |

## Lifecycle Stages

`ideation` → `spec` → `plan` → `tasks` → `implement` → `test` → `release`

Stages are automatically computed from artifact presence. Edit `config.yaml` to customize rules.
