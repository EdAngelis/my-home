# Plan document format

One file per feature at `docs/plans/<NN>-<slug>.md`. `<NN>` is the next zero-padded number; `<slug>` is kebab-case (e.g. `03-issue-comments-digest.md`). Use the template below verbatim — fill every section from the investigation; never leave a placeholder. Keep paths real and repo-relative.

```markdown
# <Feature title>

- **Status:** Draft | Approved | In progress | Done
- **Created:** <YYYY-MM-DD>
- **Relates to:** <PLAN.md section / concept.md / prior plan, if any>

## 1. Goal
One paragraph: what the user wants and why. Restated in plain terms, matching their wish.

## 2. Decisions
The load-bearing choices, each with the option taken and a one-line reason. These are the answers from the clarify step — the things that, if wrong, make the plan wrong.

| Decision | Choice | Why |
|---|---|---|

## 3. Approach
The shape of the solution in prose: how the change flows through the system (UI → API → lib → worker → DB, as applicable), and how it reuses existing patterns. No code — the design, not the diff.

## 4. Implementation steps
Ordered, each independently actionable by an engineer who hasn't seen the discussion. Reference concrete files/functions/routes. Use a checkbox per step so progress is trackable.

- [ ] 1. <step>
- [ ] 2. <step>

## 5. Files affected
Real, verified paths. Mark net-new files **(new)**. One line on the change per file.

| File | Change |
|---|---|

## 6. Testing & verification
How the feature will be proven to work: typecheck/build, manual steps, what to look for. Tie back to the goal.

## 7. Risks & out of scope
Known risks or tricky bits, and an explicit list of what this feature does **not** include.

## 8. Open questions
Anything still unresolved that should be answered before or during development. Empty once approved.

## Revision log
- <YYYY-MM-DD> Draft created.
```
