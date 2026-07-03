Commit and push local changes in the **`.claude` directory's own git repository** to its remote.

The user's commit message / intent is: **$ARGUMENTS**

The `.claude` directory is a separate git repo (remote `origin` → `https://github.com/EdAngelis/.claude.git`), nested inside the main `exam-ai` project. Every git command below MUST target it explicitly with `git -C .claude` so the main project repo is never touched.

---

## Step 1 — Review what will be committed

```bash
git -C .claude rev-parse --show-toplevel        # confirm we're operating on the .claude repo
git -C .claude branch --show-current             # current branch (expected: master)
git -C .claude status --short
git -C .claude diff                              # unstaged changes
git -C .claude diff --staged                     # already-staged changes
```

- If there is **nothing to commit and nothing unpushed**, tell the user there's nothing to push and stop.
- If the only changes are ones the user clearly did not intend to commit, point them out before proceeding.

---

## Step 2 — Stage and commit

```bash
git -C .claude add -A
```

Commit message:
- If `$ARGUMENTS` is non-empty, use it as the commit message.
- Otherwise, derive a short, descriptive message from the actual diff (e.g. `Update new-issue command`, `Add claude-pull/claude-push commands`).

Use a HEREDOC to preserve newlines:

```bash
git -C .claude commit -m "$(cat <<'EOF'
<commit message here>
EOF
)"
```

---

## Step 3 — Push to the remote

```bash
git -C .claude push origin "$(git -C .claude branch --show-current)"
```

- If the push is rejected because the remote has new commits, do **not** force-push. Tell the user to run `/claude-pull` first to integrate remote changes, then retry `/claude-push`.

---

## Step 4 — Report back

Confirm the commit was created and pushed, and show the result (`git -C .claude log --oneline -3`).
