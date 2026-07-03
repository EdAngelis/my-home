Pull the latest changes for the **`.claude` directory's own git repository** from its remote.

The `.claude` directory is a separate git repo (remote `origin` → `https://github.com/EdAngelis/.claude.git`), nested inside the main project. Every git command below MUST target it explicitly with `git -C .claude` so the main project repo is never touched.

---

## Step 1 — Check the repo state

```bash
git -C .claude rev-parse --show-toplevel        # confirm we're operating on the .claude repo
git -C .claude branch --show-current             # current branch (expected: master)
git -C .claude status --short                    # any uncommitted local changes?
```

- If there are **uncommitted local changes**, do not discard them. Tell the user they have local changes and ask whether they want to commit/push first (via `/claude-push`) or stash them before pulling. Do not proceed without their answer.
- If the tree is clean, continue.

---

## Step 2 — Pull from the remote

```bash
git -C .claude pull --ff-only origin "$(git -C .claude branch --show-current)"
```

- Prefer a fast-forward pull to avoid surprise merge commits.
- If `--ff-only` fails because local and remote have diverged, report that to the user and ask whether to `git -C .claude pull --rebase` or do a regular merge. Do not force anything.
- If there is a merge/rebase conflict, stop and show the conflicting files (`git -C .claude status`) so the user can resolve them.

---

## Step 3 — Report back

Summarize what was pulled: the new commits (`git -C .claude log --oneline -5`) and any files that changed. Confirm the `.claude` repo is now up to date with its remote.
