# /feature.list — Feature Dashboard

**Input**: `$ARGUMENTS` (optional filters: `--stage <stage>`, `--health <level>`, `--tag <tag>`)

## Execution

Follow these steps exactly:

### 1. Read config

Read `.features/config.yaml` and extract all path settings and stage_rules / health_rules.

### 2. Read index

Read `.features/index.yaml` to get the list of all registered features.

### 3. Re-scan each feature

For each feature in the index:
1. Read `.features/{feature_id}/feature.yaml`
2. Scan all 5 artifact sources (BMAD, SpecKit, Agreement, ADR, Mermaid) using the same scanning logic as `/feature.status`
3. Compute lifecycle stage from stage_rules
4. Compute health from health_rules
5. Update the feature.yaml with fresh data
6. Collect summary: feature_id, title, stage, progress, health, agreement check

### 4. Update index

Write the updated `.features/index.yaml` with fresh data for all features.

### 5. Apply filters

Parse `$ARGUMENTS` for optional filters:
- `--stage <stage>`: Filter by exact stage name (ideation, spec, plan, tasks, implement, test, release)
- `--health <level>`: Filter by health level (HEALTHY, WARNING, CRITICAL)
- `--tag <tag>`: Filter by tag presence in feature's tags array

### 6. Output dashboard

Display a Markdown table:

```markdown
## Feature Dashboard — {count} features

| ID | Title | Stage | Progress | Health | Agreement |
|----|-------|-------|----------|--------|-----------|
| {id} | {title} | {stage} | {progress}% | {health} | {check} |
```

### 7. Write JSON output

Write the dashboard data to `.features/_output/dashboard.json`.

## Handoffs

- To drill into a specific feature → suggest `/feature.status <id>`
- To see dependency graph → suggest `/feature.graph`
- To discover unregistered features → suggest `/feature.discover`
