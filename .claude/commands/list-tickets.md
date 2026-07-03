List all tickets on the project board, grouped by status, **excluding tickets that are Done**.

---

## Step 0 — Load repository configuration

Read `.claude/repository.md` and extract the values from its frontmatter into shell variables:

```bash
PROJECT_OWNER=$(grep '^project_owner:' .claude/repository.md | head -1 | sed 's/^project_owner: *//')
PROJECT_NUMBER=$(grep '^project_number:' .claude/repository.md | head -1 | sed 's/^project_number: *//')
```

This lets the same command work unmodified in another repository — just edit `.claude/repository.md` there.

---

## Step 1 — Fetch and group the board items

This requires the `project` scope on the `gh` token. If the command fails with a missing-scope error, ask the user to run `gh auth refresh -s project,read:project` themselves (an interactive browser auth step) and retry.

```bash
gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --limit 500 --format json --jq '
  def order: ["Backlog","Ready","In progress","Review"];
  (order | to_entries | map({(.value): .key}) | add) as $rank
  | [ .items[] | select((.status // "No Status") != "Done") ]
  | group_by(.status // "No Status")
  | sort_by( ($rank[.[0].status // "No Status"]) // 99 )
  | .[]
  | "### \(.[0].status // "No Status") (\(length))",
    ( .[] | "- #\(.content.number // "?") \(.title)  \(.content.url // "")" ),
    ""
'
```

What this does:
- Pulls every item on the board (`--limit 500` covers the whole board).
- Drops anything whose Status is `Done`.
- Groups the rest by their Status column.
- Orders the groups by workflow (`Backlog` → `Ready` → `In progress` → `Review`); any unrecognized/empty status sorts last under `No Status`.
- Prints each group as a header with its count, then one line per ticket: issue number, title, and URL.

The board's Status options are `Backlog`, `Ready`, `In progress`, `Review`, `Done`. If the board uses a differently named field or different option names, list the available field/option names (`gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER"`) and adjust rather than guessing.

---

## Step 2 — Report back

Print the grouped output directly. If, after excluding `Done`, there are no remaining tickets, tell the user the board has no open tickets. Do not modify anything — this command is read-only.
