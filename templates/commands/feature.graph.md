# /feature.graph — Dependency Visualization

**Input**: `$ARGUMENTS` (optional: `--feature <id>` to center on one feature)

## Execution

Follow these steps exactly:

### 1. Read all feature manifests

Read all `.features/*/feature.yaml` files. For each feature, extract:
- `feature_id`, `title`
- `depends_on` array
- `lifecycle.stage`, `lifecycle.progress`
- `health.overall`

### 2. Build dependency graph

Build an adjacency list from `depends_on` fields across all features.

### 3. Detect circular dependencies

Run DFS-based cycle detection on the dependency graph. If cycles are found:
- Report each cycle as a warning: "Circular dependency detected: A → B → C → A"
- Include cycles as Mermaid comments in the output

### 4. Generate Mermaid flowchart

Create a Mermaid flowchart with:
- **Nodes**: Each feature as `featureId["Title\nstage progress%"]`
- **Edges**: For each `depends_on` entry: `dependency --> feature`
- **Color coding** via classDef:
  - `green`: release stage
  - `blue`: implement or test stage
  - `yellow`: ideation, spec, plan, or tasks stage
  - `red`: CRITICAL health (overrides stage color)

If `--feature <id>` is specified, only include the specified feature and its direct dependencies/dependents.

### 5. Write Mermaid output

Write the Mermaid diagram to `.bmad_output/mermaid/000-feature-lifecycle/L0-dependency-graph.mmd` following Mermaid Workbench conventions:
- Include YAML frontmatter (id, title, type, layer, feature)
- Write the Mermaid flowchart body

Create/update `_index.yaml` in the same directory. **Important**: use the Mermaid Workbench `_index.yaml` format with diagrams grouped by layer:

```yaml
feature: 000-feature-lifecycle
created: YYYY-MM-DD
updated: YYYY-MM-DD
diagrams:
  L0:
    - id: dependency-graph
      file: L0-dependency-graph.mmd
      type: flowchart
      title: Feature Dependencies
```

Do NOT use a flat array format — the Mermaid Viewer expects `diagrams.L0`, `diagrams.L1`, `diagrams.L2` keys.

### 6. Display inline

Output the full Mermaid diagram inline in a ```mermaid code block so Claude can render it.

## Handoffs

- To drill into a specific feature → suggest `/feature.status <id>`
- To see all features in table format → suggest `/feature.list`
