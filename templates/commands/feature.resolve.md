# /feature.resolve — Post-Merge Lifecycle Resolution

**Input**: `$ARGUMENTS` (feature ID, e.g., `010-feature-lifecycle-v2`)

## Execution

Follow these steps exactly:

### 1. Resolve feature identity

Store `$ARGUMENTS` as `FEATURE`. Read `.features/config.yaml` and extract path settings.

### 2. Prerequisite checks

All checks must pass before resolution proceeds:

| # | Check | How | Failure message |
|---|-------|-----|----------------|
| 1 | Feature exists | `.features/{FEATURE}.yaml` exists | "Feature not found: {FEATURE}" |
| 2 | Not already released | Read `.features/{FEATURE}.yaml`, check `lifecycle.stage`. Must NOT be `"release"`. | "Feature already released: {FEATURE}. No action needed." |
| 3 | `gh` installed | Run `command -v gh` | "GitHub CLI (`gh`) required for merge detection. Install: https://cli.github.com" |
| 4 | `gh` authenticated | Run `gh auth status` (check exit code) | "GitHub CLI not authenticated. Run: `gh auth login`" |
| 5 | PR is merged | Run `gh pr list --head "{FEATURE}" --state merged --json number --jq 'length'`. Result must be > 0. **Branch resolution**: Use the feature ID as the branch name. If the current git branch (`git branch --show-current`) matches the feature ID, use it. Otherwise, use the feature ID directly. | "PR for branch `{FEATURE}` is not yet merged. Merge the PR on GitHub first." |

**If ANY check fails**: Stop and display:

```markdown
## Resolution Blocked: {FEATURE}

The following issues prevent lifecycle resolution:

{for each failing check:}
- **{check name}**: {failure message}
```

**If feature is already released** (check #2): Display informational message and stop without error:

```markdown
Feature **{FEATURE}** is already in `release` stage. No action needed.
```

**If ALL checks pass**: Proceed to step 3.

### 3. Collect linked artifacts

**Linked backlogs**: If `.product/` directory exists, scan `.product/backlogs/*/BL-*.md` for files where the YAML frontmatter `features` array contains `"{FEATURE}"`. For each match, record:
- File path (current location)
- `id` from frontmatter
- `status` from frontmatter
- Skip if `status` is already `"done"` (idempotent)

**Originating feedbacks**: If `.product/` directory exists, scan `.product/feedbacks/*/FB-*.md` for files where the YAML frontmatter `linked_to.features` array contains `"{FEATURE}"`. For each match, record:
- File path (current location)
- `id` from frontmatter
- `status` from frontmatter
- Skip if `status` is already `"resolved"` (idempotent)

**If `.product/` does not exist**: Skip backlog and feedback transitions entirely. Only transition the feature stage.

### 4. Validate all transitions (pre-flight)

Before modifying ANY file, validate that ALL transitions can succeed:

| Validation | Check |
|-----------|-------|
| Feature YAML writable | `.features/{FEATURE}.yaml` exists and is readable |
| Backlog destination exists | `.product/backlogs/done/` directory exists — create if missing |
| Feedback destination exists | `.product/feedbacks/resolved/` directory exists — create if missing |
| Each backlog file accessible | File exists and is readable |
| Each feedback file accessible | File exists and is readable |
| No destination conflicts | No file with the same name exists in the target directory |

**If ANY validation fails**: Stop immediately. Report all validation errors. No files are modified.

```markdown
## Resolution Blocked: {FEATURE}

Pre-flight validation failed:

{for each validation error:}
- {error description}
```

### 5. Apply transitions (atomic — feature YAML last)

Apply in this exact order. The feature YAML is written LAST as the "commit record" — if it reaches "release", all other transitions already succeeded.

**5a. Transition backlogs** (for each linked backlog not already "done"):
1. Read current file content
2. Update YAML frontmatter: set `status: "done"`, `updated: "{today}"`
3. Write updated content to `.product/backlogs/done/{filename}`
4. Remove original file from source directory

**5b. Transition feedbacks** (for each linked feedback not already "resolved"):
1. Read current file content
2. Update YAML frontmatter:
   - `status: "resolved"`
   - `updated: "{today}"`
   - Add/update `resolution` block:
     - `resolved_date: "{today}"`
     - `resolved_by_feature: "{FEATURE}"`
3. Write updated content to `.product/feedbacks/resolved/{filename}`
4. Remove original file from source directory

**5c. Update product index** (if `.product/` exists):
1. Re-scan `.product/` directories to recompute counts
2. Rewrite `.product/index.yaml` with updated counts

**5d. Transition feature** (LAST):
1. Read current `.features/{FEATURE}.yaml`
2. Update the following fields:
   - `lifecycle.stage: "release"`
   - `lifecycle.stage_since: "{today}"`
   - `lifecycle.progress: 1.0`
   - `lifecycle.manual_override: "release"`
   - `updated: "{today}"`
3. Write updated feature YAML

### 6. Update feature index

Read `.features/index.yaml` and update the entry for `{FEATURE}`:
- Set `stage` to `"release"`
- Set `progress` to `1.0`

Write the updated index.

### 7. Report

On success:

```markdown
## Lifecycle Resolution Complete: {FEATURE}

**Feature**: {FEATURE} — {title}
**Stage**: release
**Date**: {today}

### Transitions Applied

| Type | ID | From | To |
|------|----|------|----|
| Feature | {FEATURE} | {previous_stage} | release |
{for each backlog transitioned:}
| Backlog | {bl.id} | {bl.previous_status} | done |
{for each feedback transitioned:}
| Feedback | {fb.id} | {fb.previous_status} | resolved |

**Total**: 1 feature + {N} backlogs + {M} feedbacks

### Governance Chain Closed

Specification → Agreement → QA → PR → Release

### Next Steps

- Verify on GitHub: PR is merged
- Run `/feature.list` to see updated dashboard
- Run `/product.dashboard` to see updated product metrics
```

On partial failure (if a transition fails after some mutations have started):

```markdown
## Resolution Partially Failed: {FEATURE}

Some transitions succeeded before the failure:

### Completed
{list of completed transitions}

### Failed
{error description}

### Recovery
Re-run `/feature.resolve {FEATURE}` — already-completed transitions will be skipped (idempotent).
```

## Idempotency

- Running on a feature already in "release" → informational message, no error
- Backlogs already in "done" → skipped gracefully
- Feedbacks already in "resolved" → skipped gracefully
- Only pending transitions are applied
- Safe to re-run after partial failure

## Error Handling

| Condition | Behavior |
|-----------|----------|
| PR not merged | Clear message: "PR not yet merged" |
| Feature already released | Informational: "Already released" |
| `.product/` not installed | Only transition feature stage; skip backlogs/feedbacks |
| Backlog file missing/locked | Validation failure: list specific file |
| Feedback file missing/locked | Validation failure: list specific file |
| Destination conflict | Validation failure: file already exists at target |
| Partial failure | Report completed + failed transitions with recovery steps |
