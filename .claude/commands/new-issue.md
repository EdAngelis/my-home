Your job is to create a well-structured GitHub issue on the repository configured in `.claude/repository.md`, based on the user's description.

The user's description is: **$ARGUMENTS**

---

## Step 0 — Load repository configuration

Read `.claude/repository.md` and extract the values from its frontmatter into shell variables, used by every step below:

```bash
REPO=$(grep '^repo:' .claude/repository.md | head -1 | sed 's/^repo: *//')
PROJECT_OWNER=$(grep '^project_owner:' .claude/repository.md | head -1 | sed 's/^project_owner: *//')
PROJECT_NUMBER=$(grep '^project_number:' .claude/repository.md | head -1 | sed 's/^project_number: *//')
```

This lets the same command work unmodified in another repository — just edit `.claude/repository.md` there.

---

## Step 1 — Investigate the codebase before writing anything

Before drafting the issue, ground yourself in the actual project so the plan and the file list are real, not guesses:

1. Read the relevant `CLAUDE.md` file(s) for the part of the project the description touches. This is a monorepo — there is a root `CLAUDE.md` plus per-app docs:
   - `exam-ai-next/` — Next.js web frontend (see root `CLAUDE.md`, `exam-ai-next/API.md`, `exam-ai-next/FRONT.md`)
   - `exam-ai-mobile/` — React Native (Expo) app (see `exam-ai-mobile/CLAUDE.md`, `ARCHITECTURE.md`)
   - `exam-ai-api/` — Express backend (routes in `src/routes/`, controllers in `src/controller/`, etc.)
2. Determine which app(s) the ticket affects, then use Glob/Grep/Read to locate the **specific files** involved — routes, services, components, controllers, models, validators, etc. Trace the full path of the change (e.g. for an auth change: screen → service → api-client/proxy → backend route → controller → repository).
3. Follow the project conventions documented in the `CLAUDE.md` files (service layer, proxy rules, Atomic Design, the `subject`/`subJect` quirk, etc.) when reasoning about the solution.

Use real, verified file paths in the body. Do not list files you have not confirmed exist (except net-new files the ticket must create, which you must clearly mark as **(new)**).

---

## Step 2 — Derive a title and body from the description + investigation

Produce:

- **Title:** a short, imperative sentence (≤ 72 chars) that names the problem or feature. Examples: "Fix crash when exam has no questions", "Add email validation on signup form".
- **Type:** classify as one of: `bug`, `enhancement`, `question`.
- **Body:** a markdown body with these sections:
  - **Description** — one paragraph expanding on the title.
  - **Expected behavior** (for bugs) or **Motivation** (for enhancements) — why this matters.
  - **Steps to reproduce** (for bugs only) — numbered list; omit for enhancements.
  - **Implementation plan** — a numbered, step-by-step plan for how the ticket will be solved, derived from the Step 1 investigation. Reference concrete functions/components/routes and respect the documented architecture and conventions. Each step should be actionable by an engineer who has not seen this description.
  - **Files affected** — a markdown table listing the exact files the ticket will touch, with a one-line note on the change per file. Mark net-new files as **(new)**. Use repo-relative paths (e.g. `exam-ai-api/src/routes/auth.route.ts`). Group by app if the ticket spans more than one.

Base the plan and file list on what you actually found in Step 1. Do not invent details about the requested behavior that are not in the description, but you **are** expected to derive the implementation plan and affected files from the real codebase.

---

## Step 3 — Create the issue

Run:

```bash
gh issue create \
  --repo "$REPO" \
  --title "<derived title>" \
  --body "<derived body>" \
  --label "<bug|enhancement|question>"
```

Use a HEREDOC for the body to preserve newlines:

```bash
gh issue create --repo "$REPO" --title "<title>" --label "<type>" --body "$(cat <<'EOF'
<body markdown here>
EOF
)"
```

Capture the issue URL printed by `gh issue create` — it's needed in the next step.

---

## Step 4 — Add the issue to the project board, in the Backlog column

This requires the `project` scope on the `gh` token. If a command below fails with a missing-scope error, ask the user to run `gh auth refresh -s project,read:project` themselves (it's an interactive browser auth step) and retry.

```bash
# Resolve the project id, owned by $PROJECT_OWNER
PROJECT_ID=$(gh project view "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.id')

# Add the issue to the project, capture the new item's id
ITEM_ID=$(gh project item-add "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --url "<issue-url-from-step-3>" --format json --jq '.id')

# Resolve the Status field id and the "Backlog" option id
FIELD_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.fields[] | select(.name=="Status") | .id')
OPTION_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.fields[] | select(.name=="Status") | .options[] | select(.name=="Backlog") | .id')

# Move the item into the Backlog column
gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" --field-id "$FIELD_ID" --single-select-option-id "$OPTION_ID"
```

If the project has no field literally named `Status`, or no option literally named `Backlog`, list the available field/option names instead of guessing and ask the user which one to use.

---

## Step 5 — Report back

After the issue is created and added to the project, output the issue URL and confirm it was placed in the Backlog column so the user can open it directly.
