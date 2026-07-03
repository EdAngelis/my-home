You are working on the GitHub repository configured in `.claude/repository.md`. Your job is to fully resolve **one** GitHub issue end-to-end: pick it from the project board's **Ready** column, analyze it, implement the fix or feature, and open a Pull Request.

This command takes **no arguments**. It is the unattended sibling of `/issue`: instead of being given an issue number, it pulls the next issue from the **Ready** column. It is designed to be driven by `/loop` (e.g. every 15 minutes) — each run handles exactly one issue and exits. Because Step 1 moves the chosen issue to **In progress**, it leaves the Ready column, so the next `/loop` tick picks a different issue and the same one is never processed twice.

---

## Step 0 — Load repository configuration

Read `.claude/repository.md` and extract the values from its frontmatter into shell variables, used by every step below:

```bash
REPO=$(grep '^repo:' .claude/repository.md | head -1 | sed 's/^repo: *//')
PROJECT_OWNER=$(grep '^project_owner:' .claude/repository.md | head -1 | sed 's/^project_owner: *//')
PROJECT_NUMBER=$(grep '^project_number:' .claude/repository.md | head -1 | sed 's/^project_number: *//')
BASE_BRANCH=$(grep '^base_branch:' .claude/repository.md | head -1 | sed 's/^base_branch: *//')
```

This lets the same command work unmodified in another repository — just edit `.claude/repository.md` there.

---

## Step 1 — Pick one issue from "Ready" and move it to "In progress"

Resolve the project, then take the **oldest** issue (lowest number) currently in the **Ready** column:

```bash
PROJECT_ID=$(gh project view "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.id')

# Lowest-numbered open Issue whose Status is "Ready" (gh flattens the Status single-select to .status)
ISSUE_NUMBER=$(gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json \
  --jq '[.items[] | select(.status=="Ready" and .content.type=="Issue")] | sort_by(.content.number) | .[0].content.number // empty')
```

**If `ISSUE_NUMBER` is empty, there is nothing to do:** print `No issues in the Ready column. Nothing to do.` and **stop cleanly** (this is the normal idle outcome for a `/loop` tick — do not error). Otherwise continue with this `$ISSUE_NUMBER` for the rest of the run.

Now move that issue's card to **In progress**:

```bash
ITEM_ID=$(gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq ".items[] | select(.content.number==$ISSUE_NUMBER) | .id")

FIELD_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.fields[] | select(.name=="Status") | .id')
OPTION_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.fields[] | select(.name=="Status") | .options[] | select(.name=="In progress") | .id')

gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" --field-id "$FIELD_ID" --single-select-option-id "$OPTION_ID"
```

If the project has no field literally named `Status`, or no option literally named `Ready` / `In progress`, list the available field/option names instead of guessing and stop with that report. If the `gh project` commands fail due to missing scopes, ask the user to run `gh auth refresh -s project,read:project` and retry — do not skip this step silently.

---

## Step 2 — Read and understand the issue

- Fetch the issue with: `gh issue view $ISSUE_NUMBER --repo "$REPO" --json title,body,comments,labels,state`
- Read the title, body, and all comments carefully.
- Identify: what is broken or missing? What is the expected behavior? Are there any constraints or hints in the comments?
- If the issue references files, routes, or components, note them for exploration.

---

## Step 3 — Explore the codebase

- Based on the issue context, locate the relevant files using `Glob` and `Grep`.
- Read the relevant source files to fully understand the existing implementation before making any changes.
- Identify the root cause (for bugs) or the best integration point (for features).
- Do not guess — verify by reading the actual code.

---

## Step 4 — Plan the implementation

- Write out a clear, step-by-step plan of what needs to change and why.
- Identify which files will be created or modified.
- Consider edge cases, security implications, and regressions.
- Keep the scope tight: only implement what is needed to resolve the issue. Do not refactor unrelated code.

---

## Step 5 — Create a dedicated branch from main

- Before branching, make sure `main` is checked out and up to date with its remote:
  ```bash
  git checkout main
  git pull origin main
  ```
  If `git checkout` or `git pull` fails (e.g. uncommitted local changes, diverged history), stop and report to the user — do not stash, discard, or force anything automatically. (Under `/loop`, the run simply ends and the next tick retries.)
- Create and checkout a new branch named after the issue, off of `main`:
  ```bash
  git checkout -b issue-$ISSUE_NUMBER
  ```

---

## Step 6 — Implement the changes

- Make the necessary code changes using the `Edit` or `Write` tools.
- Follow the existing code style, patterns, and conventions of the project.
- Do not add unnecessary comments, docstrings, or abstractions.
- Do not introduce new dependencies unless strictly required.

---

## Step 7 — Verify the changes

- Re-read every file you modified to confirm the changes are correct and complete.
- If the project has tests, check if existing tests need updating or new ones should be added.
- Check for obvious errors: syntax issues, broken imports, missing exports.

---

## Step 8 — Check for TypeScript and lint errors (deployment gate)

Before committing, make sure the code compiles and lints cleanly — these are what break the deployment. Run the checks **only for the app(s) whose files you actually changed**:

- **`my-home-api`** (no lint script — TypeScript only):
  ```bash
  cd my-home-api && npm run build   # tsc
  ```
- **`my-home-front`**:
  ```bash
  cd my-home-front && npm run build  # tsc && vite build
  cd my-home-front && npm run lint   # eslint, fails on any warning (--max-warnings 0)
  ```

If install is needed first, run `npm ci` (or `npm install`) in that app directory.

If any of these fail, **fix the reported errors and re-run until they pass.** Do not commit, push, or open the PR while the build or lint is failing — a broken `tsc`/`eslint` will block the deployment. If an error originates in pre-existing code unrelated to your change and cannot be fixed within the issue's scope, stop and report it to the user instead of opening a PR that will fail to deploy.

---

## Step 9 — Commit the changes

- Stage only the files relevant to the issue:
  ```bash
  git add <files>
  ```
- Write a clear, descriptive commit message focused on *why*, not just *what*:
  ```bash
  git commit -m "fix: <short description> (closes #$ISSUE_NUMBER)"
  ```

---

## Step 10 — Push the branch

- Push the branch to origin:
  ```bash
  git push -u origin issue-$ISSUE_NUMBER
  ```

---

## Step 11 — Open a Pull Request

- Create the PR using the GitHub CLI:
  ```bash
  gh pr create \
    --repo "$REPO" \
    --title "<concise title matching the issue>" \
    --body "..." \
    --head issue-$ISSUE_NUMBER \
    --base "$BASE_BRANCH"
  ```
- The PR body must include:
  - **Summary:** what was changed and why
  - **Closes:** `Closes #$ISSUE_NUMBER` (so GitHub auto-closes the issue on merge)
  - **Test plan:** steps to verify the fix or feature works
  - Credit line: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

---

## Step 12 — Move the ticket to "Review"

Once the Pull Request is created, move the issue's card on the project board to the **Review** column, using the same `ITEM_ID`, `PROJECT_ID`, and `FIELD_ID` resolved in Step 1 (re-resolve them if this is a fresh session):

```bash
OPTION_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.fields[] | select(.name=="Status") | .options[] | select(.name=="Review") | .id')

gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" --field-id "$FIELD_ID" --single-select-option-id "$OPTION_ID"
```

---

## Step 13 — Log the work to the Issues Creator app

Record this resolution with the **post-worklog** skill so the app tracks what was done and the tokens spent. This is **best-effort**: if worklog isn't configured (no `.claude/skills/post-worklog/worklog.env`) or the POST fails, print a one-line note and continue — never fail or block the run over it (important under `/loop`).

Gather the inputs, then run the post-worklog skill with them:

- `type`: `solve-issues`
- issue number: `$ISSUE_NUMBER`
- PR number: the PR opened in Step 11
- `emptyColumn`: whether the **Ready** column is now empty after this run:
  ```bash
  READY_LEFT=$(gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json \
    --jq '[.items[] | select(.status=="Ready" and .content.type=="Issue")] | length')
  ```
  `true` if `READY_LEFT` is `0`, otherwise `false`.
- summary: 1–2 sentences on what you changed.
- tokensSpent: `node .claude/skills/post-worklog/session-tokens.mjs` (message tokens).

The post-worklog skill reads `owner`/`repo` from `.claude/repository.md` and posts to `POST /api/worklog`. Pass it the values above so it doesn't need to ask.

---

## Step 14 — Return to the base branch

Once all the work is done (PR opened and ticket moved), switch back to `BASE_BRANCH` so the working tree is left on a clean, stable branch:

```bash
git checkout "$BASE_BRANCH"
```

Leave the `issue-$ISSUE_NUMBER` branch in place (it backs the open PR) — just stop being checked out on it. If `git checkout` fails because of uncommitted changes, stop and report to the user instead of stashing or discarding anything.

---

## Important rules

- Process **exactly one** issue per run, then stop — the loop will trigger the next run.
- If the Ready column is empty, stop cleanly with the idle message; do not invent work.
- Never commit secrets, `.env` files, or credentials.
- Never force-push or amend published commits.
- Never skip pre-commit hooks (`--no-verify`).
- Always confirm with the user before running destructive git operations.
- If you are unsure about scope or approach, stop and report rather than guessing — the next `/loop` tick can retry once the issue is clarified.
