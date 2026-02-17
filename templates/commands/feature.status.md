# /feature.status — Detailed Feature Status

**Input**: `$ARGUMENTS` (feature_id, e.g., `001-bookstore-crud-api`)

## Execution

Follow these steps exactly:

### 1. Read config

Read `.features/config.yaml` and extract all path settings:
- `bmad_output_dir`, `speckit_specs_dir`, `agreements_dir`, `adr_dir`, `mermaid_dir`
- `default_owner`

Also read the `stage_rules` and `health_rules` sections.

### 2. Load or create feature manifest

If `.features/$ARGUMENTS/feature.yaml` exists, read it.
If not, create it from `.features/_templates/feature.tpl.yaml`:
- Replace `{{feature_id}}` with `$ARGUMENTS`
- Replace `{{title}}` with the feature directory name (human-readable from kebab-case)
- Replace `{{owner}}` with `default_owner` from config
- Replace `{{date}}` and `{{timestamp}}` with today's date/time

### 3. Scan all 5 artifact sources

For each source, check the filesystem:

**BMAD**: Check `{bmad_output_dir}/planning-artifacts/` for `prd.md`, `architecture.md`, `epics.md` (or `{feature_id}-` prefixed variants)

**SpecKit**: Check `{speckit_specs_dir}/{feature_id}/` for `spec.md`, `plan.md`, `research.md`, `tasks.md`, `contracts/` directory. For tasks.md, count `- [x]` (done) and `- [ ]` (pending) checkboxes.

**Agreement**: Check `{agreements_dir}/{feature_id}/agreement.yaml` existence, read `status` field, check for `check-report.md` and read verdict (PASS/FAIL).

**ADR**: Scan `{adr_dir}/` (global/, domain/*/, local/*/) for `.md` files. Read YAML frontmatter and check if `references.features` contains the feature_id. Count matching ADRs.

**Mermaid**: Check `{mermaid_dir}/{feature_id}/_index.yaml`, read diagram counts per layer (L0, L1, L2).

### 4. Compute lifecycle stage

Using the `stage_rules` from config, evaluate rules top-to-bottom:
- For each stage (ideation → spec → plan → tasks → implement → test → release):
  - Check `requires_all`: all referenced artifact keys must be true
  - Check `requires_any`: at least one must be true
  - Check `condition`: evaluate task completion thresholds (e.g., `tasks_completion >= 0.5`)
  - Skip `requires_manual` stages unless `manual_override` is set
- **Highest matching stage wins** (evaluate from release down to ideation)

Task completion = `tasks_done / tasks_total` from SpecKit scan.

### 5. Compute health indicators

Using `health_rules` from config:
- `critical_when` rules → set overall to CRITICAL if any match
- `warning_when` rules → set overall to WARNING if any match
- Otherwise → HEALTHY

Calculate:
- `spec_completeness` = count of present SpecKit artifacts / 5 (spec, plan, research, tasks, contracts)
- `task_progress` = tasks_done / tasks_total
- `agreement` = check result (PASS/FAIL/MISSING)
- `adr_coverage` = count of ADRs referencing this feature
- `diagram_coverage` = total Mermaid diagram count

### 6. Detect regression

Compare current scan with `last_scan` in feature.yaml:
- If current stage index < previous stage index → warn "Stage regression detected"
- If any artifact was `true` in `artifacts_snapshot` but is now `false` → warn "Artifact disappeared"

### 7. Update feature.yaml

Write the updated feature.yaml with:
- Fresh artifact scan data
- Computed lifecycle stage and progress
- Computed health indicators
- Updated `last_scan` with current timestamp and artifacts_snapshot
- Updated `updated` date

### 8. Update index.yaml

Update the feature's entry in `.features/index.yaml` with current stage, progress, health, and status.

### 9. Output Markdown report

```markdown
## Feature: {feature_id} — {title}

**Stage**: {stage} ({progress}%) | **Health**: {overall}
**Owner**: {owner} | **Updated**: {date}

### Artifacts
| Source    | Artifact         | Status |
|-----------|------------------|--------|
| BMAD      | PRD              | {present/missing} |
| BMAD      | Architecture     | {present/missing} |
| BMAD      | Epics            | {present/missing} |
| SpecKit   | spec.md          | {present/missing} |
| SpecKit   | plan.md          | {present/missing} |
| SpecKit   | research.md      | {present/missing} |
| SpecKit   | tasks.md         | {done}/{total} done ({pct}%) |
| SpecKit   | contracts/       | {present/missing} |
| Agreement | agreement.yaml   | {check} |
| ADR       | decisions        | {count} ADRs |
| Mermaid   | diagrams         | {count} (L0:{l0}, L1:{l1}, L2:{l2}) |

### Health Indicators
- Agreement: {check}
- Spec completeness: {pct}%
- Task progress: {pct}% ({done}/{total})
- ADR coverage: {count} decisions
- Diagram coverage: {count} diagrams

### Warnings
{list regression warnings and health warnings}
```

### 10. Write JSON output

Write the full feature object as JSON to `.features/_output/{feature_id}.json`.

## Handoffs

- If agreement health is FAIL → suggest `/agreement.check $ARGUMENTS`
- If agreement health is FAIL → suggest `/agreement.doctor $ARGUMENTS`
- To see dependency context → suggest `/feature.graph`
- To see all features → suggest `/feature.list`
