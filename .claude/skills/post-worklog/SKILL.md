---
name: post-worklog
description: >-
  Log completed resolution work to the Issues Creator app (POST /api/worklog).
  Use at the END of resolving a GitHub issue, resolving PR review comments, or an
  AI-review pass — it records a short summary of what was done and the tokens the
  session spent. Trigger when the user says "log the work", "post worklog",
  "record what I did", or after finishing a solve-issues / resolve-comments /
  ai-review flow.
---

# Post a worklog

Record the work you just finished (summary + tokens spent) against the tracked
issue in the Issues Creator app. Authenticates with a shared bearer token, not a
browser cookie, so it works from the CLI.

## Prerequisites (one-time, set by the user)

The helper script needs two values:

- `WORKLOG_API_URL` — the app's base URL (e.g. `http://localhost:3000` or the deployed URL).
- `WORKLOG_API_TOKEN` — must equal the app's `WORKLOG_API_TOKEN`.

**Preferred — a local config file (persists, set once).** Copy the template and
fill it in:

```bash
cp .claude/skills/post-worklog/worklog.env.example .claude/skills/post-worklog/worklog.env
# then edit worklog.env and set both values
```

`worklog.env` is **gitignored** and is auto-sourced by `post-worklog.sh`, so you
don't have to export anything per shell. This is the robust path — Claude Code's
Bash calls don't reliably share shell state, so a one-off `export` may not survive
to the curl step.

**Alternative — environment variables.** If `worklog.env` is absent, the script
falls back to `WORKLOG_API_URL` / `WORKLOG_API_TOKEN` from the environment.

If neither is set the script exits with a message naming the missing value — read
it and ask the user to create `worklog.env`. **Never print the token value**; when
using the raw-curl fallback, always reference it as `$WORKLOG_API_TOKEN`.

## Steps

1. **Resolve owner + repo.** Read the `repo` key (`owner/repo`) from the
   frontmatter of `.claude/repository.md`. Split on `/` → `owner` and `repo`.
   Fallback if that file is absent: parse `git remote get-url origin`
   (`github.com[:/ ]<owner>/<repo>(.git)`).
   These must match the values stored in the app **exactly (case-sensitive)** —
   a mismatch returns `404 "No repository matches that owner/repo"`.

2. **Determine the issue number.** Use the issue you just worked on. If it isn't
   already in context, derive it from the branch name (patterns like `123-slug`,
   `issue-123`, `feature/123-…`) or the linked PR; if still unclear, ask the user.

3. **Choose the `type`** — exactly one of:
   - `solve-issues` — you implemented/solved the issue.
   - `resolve-comments` — you addressed PR review comments.
   - `ai-review` — you performed an AI review pass.
   Pick based on what this session did; if ambiguous, ask.

4. **Set `emptyColumn`** (boolean). `true` if, the source board
   column has no items to process and work on (the column is empty);
   otherwise `false`. Default `false` and confirm with the user if unsure.

5. **Write a concise `summary`** of what was done, grounded in the actual changes
   (e.g. from `git diff`/`git log` for this session). One or two sentences.

6. **Get `tokensSpent`** for this session — try to read it automatically first:

   ```bash
   node .claude/skills/post-worklog/session-tokens.mjs
   ```

   This sums the `usage` fields from the current session's Claude Code transcript
   and prints a single integer on stdout (with a component breakdown on stderr).
   By default it counts **message tokens only** (`input_tokens + output_tokens`) —
   the actual prompt + generation, excluding cache overhead. Use the printed
   number. Add `--total` only if you want the grand total including cache tokens.

   Fall back to asking the user **only if** the command fails (non-zero exit —
   e.g. `node` unavailable, no transcript found, or the transcript format changed):
   ask them to run `/cost` and give you the total token count, or to pass a number
   in. It must be a non-negative integer.

7. **Optional fields:** `model` (e.g. `claude-opus-4-8`) and `prNumber` (the linked
   PR number), when known.

8. **Build the JSON body** and write it to a temp file, e.g. `.git/worklog.json`
   (or any scratch path). Example shape:

   ```json
   {
     "owner": "EdAngelis",
     "repo": "my-home",
     "issueNumber": 47,
     "type": "solve-issues",
     "emptyColumn": false,
     "summary": "Removed the Duties heading from the Duties page and updated tests.",
     "tokensSpent": 18432,
     "model": "claude-opus-4-8",
     "prNumber": 12
   }
   ```

9. **Post it** with the helper script in this skill folder (reads URL + token from
   the environment):

   ```bash
   bash .claude/skills/post-worklog/post-worklog.sh .git/worklog.json
   ```

   Or pipe the body in without a file:

   ```bash
   printf '%s' "$BODY_JSON" | bash .claude/skills/post-worklog/post-worklog.sh -
   ```

   Raw-curl fallback (equivalent — source the config first so the vars exist, and
   keep the token as the env-var reference so it isn't printed):

   ```bash
   set -a; . .claude/skills/post-worklog/worklog.env; set +a
   curl -sS -w '\nHTTP %{http_code}\n' -X POST "$WORKLOG_API_URL/api/worklog" \
     -H "Authorization: Bearer $WORKLOG_API_TOKEN" \
     -H "Content-Type: application/json" \
     --data-binary @.git/worklog.json
   ```

## Interpreting the response

- **`HTTP 200`** `{ "id": "...", "ok": true }` → logged. Report success and the fields sent.
- **`HTTP 401`** → the token is missing/wrong. Check `WORKLOG_API_TOKEN` matches the app.
- **`HTTP 400`** → a field is missing/invalid; the `error` says which (e.g. `type must be one of: …`).
- **`HTTP 404 "No repository matches that owner/repo"`** → owner/repo don't match a
  stored repo — verify exact GitHub owner/name (case-sensitive).
- **`HTTP 404 "Issue #N is not tracked by this app"`** → the issue wasn't created
  through the app, so there's no worklog target. Tell the user; don't retry.

## Notes

- The endpoint is bearer-authenticated and does not use the login session — do not
  try to "log in" first.
- Only issues that the app created/tracks can receive a worklog.
