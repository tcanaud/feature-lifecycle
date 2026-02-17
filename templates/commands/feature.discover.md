# /feature.discover — Auto-Register Existing Features

**Input**: `$ARGUMENTS` (optional: `--dry-run` to preview without writing)

## Execution

Follow these steps exactly:

### 1. Read config

Read `.features/config.yaml` and extract all path settings, stage_rules, and health_rules.

### 2. Scan for feature directories

Scan these directories for subdirectories matching the `###-feature-name` pattern:
- `{speckit_specs_dir}/` (e.g., `specs/001-bookstore-crud-api/`)
- `{agreements_dir}/` (e.g., `.agreements/001-bookstore-crud-api/`)
- `{mermaid_dir}/` (e.g., `.bmad_output/mermaid/001-bookstore-crud-api/`)

### 3. Normalize and merge

For each discovered directory:
- Extract feature_id from directory name (e.g., `001-bookstore-crud-api`)
- Extract title from short-name (kebab-case → human readable)
- Track which sources contained this feature (specs, agreements, mermaid)
- Deduplicate by feature_id

### 4. Check for dry-run

If `$ARGUMENTS` contains `--dry-run`:
- Output the discovery report table (step 7) WITHOUT writing any files
- Skip steps 5 and 6
- Add a note: "Dry run — no files were modified"

### 5. Register each feature

For each discovered feature:
- Check if `.features/{feature_id}/feature.yaml` already exists
- If **new**: Create feature.yaml from template, run full artifact scan, compute stage and health
- If **existing**: Re-scan artifacts, recompute stage and health, update feature.yaml (preserve identity fields: owner, depends_on, tags, manual_override, created date)

### 6. Update index

Update `.features/index.yaml` with entries for all discovered features.

### 7. Output discovery report

```markdown
## Discovery Report — {count} features found

| Feature ID             | Sources              | Stage     | Action   |
|------------------------|----------------------|-----------|----------|
| 001-bookstore-crud-api | specs, agreements    | implement | CREATED  |
| 002-mermaid-workbench  | specs, agreements, mermaid | release | CREATED |
| 003-mermaid-viewer     | specs, mermaid       | implement | UPDATED  |
```

Actions:
- **CREATED**: New feature registered
- **UPDATED**: Existing feature re-scanned
- **SKIPPED**: Feature unchanged (dry-run only)

## Handoffs

- To see all features → suggest `/feature.list`
- To check a specific feature → suggest `/feature.status <id>`
