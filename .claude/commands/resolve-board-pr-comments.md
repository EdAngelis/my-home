You are working on the GitHub repository configured in `.claude/repository.md`. Your job is to find the Pull Request attached to **one** issue currently in the project board's **Resolving** column, read every comment on that PR, and address each one — either by fixing the code or by replying with a clear explanation of why no change is needed — repeating until none are left unaddressed.

This command takes **no arguments**. It is the board-driven sibling of `/resolve-pr-comments`: instead of being given a PR number, it pulls the next issue from the **Resolving** column and works on that issue's linked PR. It is designed to be driven by `/loop` — each run handles exactly one PR and exits.

---

## Step 0 — Load repository configuration

Read `.claude/repository.md` and extract the values from its frontmatter into shell variables, used by every step below:

```bash
REPO=$(grep '^repo:' .claude/repository.md | head -1 | sed 's/^repo: *//')
PROJECT_OWNER=$(grep '^project_owner:' .claude/repository.md | head -1 | sed 's/^project_owner: *//')
PROJECT_NUMBER=$(grep '^project_number:' .claude/repository.md | head -1 | sed 's/^project_number: *//')
BASE_BRANCH=$(grep '^base_branch:' .claude/repository.md | head -1 | sed 's/^base_branch: *//')

# Split REPO (owner/repo) into its parts for the GraphQL lookup in Step 2
REPO_OWNER=${REPO%%/*}
REPO_NAME=${REPO##*/}
```

This lets the same command work unmodified in another repository — just edit `.claude/repository.md` there.

---

## Step 1 — Pick one issue from the "Resolving" column

Resolve the project, then take the **oldest** issue (lowest number) currently in the **Resolving** column:

```bash
PROJECT_ID=$(gh project view "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.id')

# Lowest-numbered open Issue whose Status is "Resolving" (gh flattens the Status single-select to .status)
ISSUE_NUMBER=$(gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json \
  --jq '[.items[] | select(.status=="Resolving" and .content.type=="Issue")] | sort_by(.content.number) | .[0].content.number // empty')
```

**If `ISSUE_NUMBER` is empty, there is nothing to do:** print `No issues in the Resolving column. Nothing to do.` and **stop cleanly** (this is the normal idle outcome for a `/loop` tick — do not error). Otherwise continue with this `$ISSUE_NUMBER` for the rest of the run.

Resolve the project item id and Status field now, so the board move in Step 7 can reuse them:

```bash
ITEM_ID=$(gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq ".items[] | select(.content.number==$ISSUE_NUMBER) | .id")
FIELD_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.fields[] | select(.name=="Status") | .id')
```

If the project has no field literally named `Status`, or no option literally named `Resolving`, list the available field/option names instead of guessing and stop with that report. If the `gh project` commands fail due to missing scopes, ask the user to run `gh auth refresh -s project,read:project` and retry — do not skip this step silently.

---

## Step 2 — Find the Pull Request linked to that issue

Look up the open PR that closes this issue via GraphQL:

```bash
PR_NUMBER=$(gh api graphql -f query='
query($owner:String!,$repo:String!,$number:Int!){
  repository(owner:$owner,name:$repo){
    issue(number:$number){
      closedByPullRequestsReferences(first:20, includeClosedPrs:false){
        nodes{ number state }
      }
    }
  }
}' -F owner="$REPO_OWNER" -F repo="$REPO_NAME" -F number="$ISSUE_NUMBER" \
  --jq '[.data.repository.issue.closedByPullRequestsReferences.nodes[] | select(.state=="OPEN")] | sort_by(.number) | .[0].number // empty')
```

If that returns nothing, fall back to searching for an open PR whose body references the issue:

```bash
[ -z "$PR_NUMBER" ] && PR_NUMBER=$(gh pr list --repo "$REPO" --state open --search "$ISSUE_NUMBER in:body" \
  --json number,body --jq "[.[] | select(.body | test(\"(?i)(close[sd]?|fix(e[sd])?|resolve[sd]?) #$ISSUE_NUMBER\\\\b\"))] | sort_by(.number) | .[0].number // empty")
```

**If no PR can be found**, the issue is in the Resolving column but has no open PR — do not guess. Report `Issue #$ISSUE_NUMBER is in Resolving but has no linked open PR.` and stop cleanly. Otherwise continue with `$PR_NUMBER` for the rest of the run.

---

## Step 3 — Load the PR

```bash
gh pr view $PR_NUMBER --repo "$REPO" --json title,body,number,headRefName,baseRefName,state,comments,reviews
ME=$(gh api user --jq '.login')
```

- Note `headRefName` — the branch you'll need to check out if any comment requires a code change.
- `ME` is your own `gh` login — use it below to tell which comments you've already replied to, so you don't loop on the same comment forever or double-reply.

---

## Step 4 — Gather every comment

A PR has two distinct comment surfaces — fetch both:

```bash
# Top-level PR conversation comments
gh pr view $PR_NUMBER --repo "$REPO" --json comments --jq '.comments[] | {id: .id, author: .author.login, body: .body}'

# Inline review comments (anchored to a diff line), with pagination
gh api "repos/$REPO/pulls/$PR_NUMBER/comments" --paginate --jq '.[] | {id: .id, in_reply_to: .in_reply_to_id, author: .user.login, path: .path, line: .line, body: .body}'
```

Build a list of comments that:
- Were **not** authored by `$ME`, and
- Have **no existing reply authored by `$ME`** (for inline comments, no other comment in the thread with matching context has `in_reply_to_id` pointing at it and `author == $ME`; for top-level comments, no later top-level comment by `$ME` already responds to it).

Those are the comments still needing action this pass.

If there are none, you're done — skip to Step 9.

---

## Step 5 — Decide an action for each unaddressed comment

For every comment found in Step 4, read it carefully alongside the diff hunk / file it's anchored to (use `gh pr diff $PR_NUMBER --repo "$REPO"` for full context) and decide:

- **Code change required** — the comment points out a real bug, regression, missed convention, or requested change.
- **No change needed** — the comment is based on a misunderstanding, is out of scope, already handled elsewhere, or is a question that can be answered without touching code.

Do not guess — verify against the actual current code, not just the diff, before deciding.

---

## Step 6 — If any comment needs a code change

Do this **once**, before making any edits, the first time this PR needs a code change in this run — check out the PR's branch:

```bash
gh pr checkout $PR_NUMBER --repo "$REPO"
```

Then make the change with `Edit`/`Write`, following the project's existing conventions. Keep each change scoped to what the comment actually asked for — do not use this as an opportunity to refactor unrelated code.

The issue is already in the **Resolving** column, so there is no "move to In progress" step here — that column *is* the working state for this command. You only need to check out the branch once per run, even if multiple comments require code changes — keep working on the same checked-out branch for all of them.

---

## Step 7 — Reply to each comment

For inline review comments, reply **in the same thread** so context is preserved:

```bash
gh api -X POST "repos/$REPO/pulls/$PR_NUMBER/comments/<comment_id>/replies" -f body="<your reply>"
```

For top-level PR conversation comments:

```bash
gh pr comment $PR_NUMBER --repo "$REPO" --body "<your reply>"
```

- If you made a code change for that comment, say what you changed (briefly — the diff speaks for itself) rather than re-explaining the whole fix.
- If no change was needed, explain why in plain terms — point at the specific behavior, line, or test that makes the requested change unnecessary or incorrect.

---

## Step 8 — Repeat until nothing is left

Go back to Step 4 and re-fetch comments. Replying can itself prompt a follow-up from a reviewer, so don't treat one pass as sufficient — keep looping until a fresh fetch shows every comment already has a reply from `$ME`.

---

## Step 9 — Commit, push, move the card, and wrap up

**If you made any code changes during this run**, commit and push them first:

1. Re-read every file you modified to confirm correctness.
2. Stage only the files relevant to the addressed comments:
   ```bash
   git add <files>
   ```
3. Commit with a message describing what review feedback was addressed:
   ```bash
   git commit -m "address review feedback on PR #$PR_NUMBER"
   ```
4. Push to the PR's existing branch:
   ```bash
   git push
   ```
5. Return to the base branch so the working tree is left clean:
   ```bash
   git checkout "$BASE_BRANCH"
   ```

**Then — always, whether or not any code changed** — move the issue's card from **Resolving** to **Review**, reusing the `ITEM_ID`, `PROJECT_ID`, `FIELD_ID` from Step 1 (re-resolve them if this is a fresh session):

```bash
OPTION_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.fields[] | select(.name=="Status") | .options[] | select(.name=="Review") | .id')
gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" --field-id "$FIELD_ID" --single-select-option-id "$OPTION_ID"
```

If there is no option literally named `Review`, list the available option names instead of guessing and ask the user which one to use.

Report back: the issue and PR worked on, which comments were addressed with code vs. with an explanation, what was pushed (if anything), and the resulting board column.

---

## Step 10 — Log the work to the Issues Creator app

Record this pass with the **post-worklog** skill so the app tracks what was done and the tokens spent. This is **best-effort**: if worklog isn't configured (no `.claude/skills/post-worklog/worklog.env`) or the POST fails, print a one-line note and continue — never fail or block the run over it (important under `/loop`).

Gather the inputs, then run the post-worklog skill with them:

- `type`: `resolve-comments`
- issue number: `$ISSUE_NUMBER`
- PR number: `$PR_NUMBER`
- `emptyColumn`: whether the **Resolving** column is now empty after this run (the card was moved to Review in Step 9):
  ```bash
  RESOLVING_LEFT=$(gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json \
    --jq '[.items[] | select(.status=="Resolving" and .content.type=="Issue")] | length')
  ```
  `true` if `RESOLVING_LEFT` is `0`, otherwise `false`.
- summary: 1–2 sentences on which comments you addressed (with code vs. explanation).
- tokensSpent: `node .claude/skills/post-worklog/session-tokens.mjs` (message tokens).

The post-worklog skill reads `owner`/`repo` from `.claude/repository.md` and posts to `POST /api/worklog`. Pass it the values above so it doesn't need to ask.

---

## Important rules

- Process **exactly one** PR per run, then stop — the loop will trigger the next run.
- If the Resolving column is empty, or the chosen issue has no linked open PR, stop cleanly with the idle message; do not invent work.
- Never commit secrets, `.env` files, or credentials.
- Never force-push or amend published commits.
- Never skip pre-commit hooks (`--no-verify`).
- Never resolve a comment with a fix you haven't actually verified by reading the current code.
- If a comment's intent is ambiguous, ask the user before guessing — don't reply with a fix for the wrong problem.
- If the project has no field literally named `Status`, or no option literally named `Resolving` / `Review`, list the available field/option names instead of guessing and ask the user which one to use.
- If `gh project` commands fail due to missing scopes, ask the user to run `gh auth refresh -s project,read:project` and retry.
