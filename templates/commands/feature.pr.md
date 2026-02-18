# /feature.pr — Create PR with Governance Traceability

**Input**: `$ARGUMENTS` (feature ID, e.g., `010-feature-lifecycle-v2`)

## Execution

Follow these steps exactly:

### 1. Resolve feature identity

Store `$ARGUMENTS` as `FEATURE`. Read `.features/config.yaml` and extract path settings:
- `speckit_specs_dir`, `agreements_dir`, `default_owner`

### 2. Prerequisite checks

All checks must pass before PR creation proceeds. Evaluate ALL checks, then report all failures together.

| # | Check | How | Failure message |
|---|-------|-----|----------------|
| 1 | `gh` installed | Run `command -v gh` | "GitHub CLI (`gh`) is not installed. Install: https://cli.github.com" |
| 2 | `gh` authenticated | Run `gh auth status` (check exit code) | "GitHub CLI is not authenticated. Run: `gh auth login`" |
| 3 | Feature exists | `.features/{FEATURE}.yaml` exists | "Feature not found: {FEATURE}" |
| 4 | Tasks 100% | Read `{speckit_specs_dir}/{FEATURE}/tasks.md`, count `- [x]` and `- [ ]` checkboxes. `tasks_done == tasks_total AND tasks_total > 0` | "Implementation incomplete: {done}/{total} tasks done" |
| 5 | QA PASS | `.qa/{FEATURE}/verdict.yaml` exists and `verdict` field is `"PASS"` | "QA not passed. Run `/qa.run {FEATURE}` first" |
| 6 | QA fresh | Compute SHA-256 of `{speckit_specs_dir}/{FEATURE}/spec.md` using `shasum -a 256`. Compare against `spec_sha256` in verdict.yaml. Must match. | "QA verdict is stale — spec has changed since last QA run. Re-run `/qa.plan {FEATURE}` then `/qa.run {FEATURE}`" |
| 7 | Agreement Check PASS | Read `.agreements/{FEATURE}/check-report.md` and extract verdict. If check-report.md does not exist AND `.agreements/{FEATURE}/agreement.yaml` exists → treat as PASS. If agreement.yaml does not exist → treat as PASS (backward compat). | "Agreement check failed. Run `/agreement.doctor {FEATURE}` to generate fix tasks" |
| 8 | No duplicate PR | Run `gh pr list --head "{FEATURE}" --state open --json url --jq '.[0].url // ""'`. Must return empty string. | "PR already exists: {existing_url}" |

**If ANY check fails**: Stop and display:

```markdown
## PR Creation Blocked

The following prerequisites are not met:

{for each failing check:}
- **{check name}**: {failure message}
```

**If ALL checks pass**: Proceed to step 3.

### 3. Gather traceability data

Collect all governance artifacts for the PR body:

| Data | Source | Fallback |
|------|--------|----------|
| Feature title | `.features/{FEATURE}.yaml` → `title` field | Use FEATURE ID |
| Specification | `{speckit_specs_dir}/{FEATURE}/spec.md` | Required (always exists) |
| Agreement | `.agreements/{FEATURE}/agreement.yaml` | "N/A" if missing |
| QA Results | `.qa/{FEATURE}/verdict.yaml` → `passed`, `total`, `verdict` | Required (checked in step 2) |
| Agreement Check | `.agreements/{FEATURE}/check-report.md` → verdict | "PASS (no report)" if missing |
| Originating Feedbacks | Scan `.product/feedbacks/*/FB-*.md` for files where YAML frontmatter `linked_to.features` array contains `"{FEATURE}"`. Extract `id`, `title`, `status` from each. | "N/A" if none found or `.product/` missing |
| Linked Backlogs | Scan `.product/backlogs/*/BL-*.md` for files where YAML frontmatter `features` array contains `"{FEATURE}"`. Extract `id`, `title`, `status` from each. | "N/A" if none found or `.product/` missing |
| Diff Summary | Run `git diff --stat main...HEAD` | "N/A" if git fails |

### 4. Assemble PR body

Compose the following Markdown body:

```markdown
## {FEATURE}: {title}

### Governance Lineage

| Artifact | Status | Link |
|----------|--------|------|
| Specification | Present | `{speckit_specs_dir}/{FEATURE}/spec.md` |
| Agreement | {Present/N/A} | `.agreements/{FEATURE}/agreement.yaml` |
| QA Results | **{verdict}** — {passed}/{total} checks | `.qa/{FEATURE}/verdict.yaml` |
| Agreement Check | **{check_verdict}** | `.agreements/{FEATURE}/check-report.md` |

### Originating Feedbacks

{If feedbacks found:}
| ID | Title | Status |
|----|-------|--------|
| {fb.id} | {fb.title} | {fb.status} |

{If no feedbacks:}
N/A — no feedbacks linked to this feature

### Linked Backlogs

{If backlogs found:}
| ID | Title | Status |
|----|-------|--------|
| {bl.id} | {bl.title} | {bl.status} |

{If no backlogs:}
N/A — no backlogs linked to this feature

### Diff Summary

```
{git diff --stat output}
```
```

### 5. Create PR

Run the following command to create the PR:

```bash
gh pr create \
  --title "feat({FEATURE}): {title}" \
  --base main \
  --body "{assembled PR body from step 4}"
```

**Important**: The PR body is the complete Markdown assembled in step 4. Use heredoc or `--body-file` with a temporary file if the body is too long for inline `--body`.

**If `gh pr create` fails**: Display the error output from `gh` and stop.

### 6. Report

On success:

```markdown
## PR Created

**URL**: {pr_url from gh output}
**Title**: feat({FEATURE}): {title}
**Base**: main ← {FEATURE}

### Next Steps

- Review the PR on GitHub
- After merge, run `/feature.resolve {FEATURE}` to close the governance chain
- Run `/feature.workflow {FEATURE}` to see updated status
```

## Error Handling

| Condition | Behavior |
|-----------|----------|
| `gh` not installed | Clear error: "Install GitHub CLI: https://cli.github.com" |
| `gh` not authenticated | Clear error: "Run: `gh auth login`" |
| `gh pr create` fails | Display stderr from `gh` command |
| Network error | Display `gh` error message |
| PR already exists | Display existing PR URL, do not create duplicate |
| Missing optional artifacts (feedbacks, backlogs) | "N/A" in PR body — never error |
| Branch not pushed | `gh pr create` will fail with a clear message about unpushed branch |

## Non-Goals

- Does not push the branch (assumes branch is already pushed)
- Does not set reviewers, labels, or milestones (developer sets these on GitHub)
- Does not auto-merge
- Does not update feature stage (that happens via `/feature.resolve` after merge)
