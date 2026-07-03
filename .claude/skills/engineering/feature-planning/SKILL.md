---
name: feature-planning
description: Plan a new feature end-to-end before any code is written — investigate the codebase, write a reviewable step-by-step plan doc, iterate on it with the user, and only begin development once the user explicitly approves. Use when the user wants to plan a feature, scope work before building, design an implementation before coding, or invokes /plan-feature.
---

# Feature Planning

Turn a feature wish into a **grounded**, reviewable plan, and hold all feature code behind **the gate**: the user's explicit approval. The plan is a living document the user reads, challenges, and signs off on — not a preamble you rush through to start coding.

Two rules govern every run:

- **Grounded** — every step, file path, and claim comes from the real codebase, not a guess. An ungrounded plan wastes the review.
- **The gate** — you write **no feature code** until the user says the plan is approved. Investigation, reading, and writing the plan doc are allowed; editing `src/` to build the feature is not.

## Step 1 — Load context

Read what already exists so the plan fits the project, not a generic template:

- `PLAN.md` (the master roadmap) and `concept.md` — where this feature sits and what's already decided.
- `CLAUDE.md` / `README.md` if present, and any `docs/` already written.
- Scan `docs/plans/` for prior plans (format + numbering).

**Done when** you can state, in one line, where this feature fits relative to what already exists.

## Step 2 — Clarify the wish

Restate the feature in your own words and surface every ambiguity **before** investigating deeply. The plan must match what the user actually wants, so resolve intent first.

- List what you understand the feature to be, and the decisions it forces (scope, data model, UX, edge cases, non-goals).
- For decisions the user's answer would change the plan, ask with `AskUserQuestion` — give a recommended option. Do not guess on choices that reshape the work.

**Done when** the user's intent and the load-bearing decisions are written down, not assumed.

## Step 3 — Investigate the codebase

Ground the plan in reality. Trace the full path of the change end to end (UI → API route → lib → worker → DB, as applicable), using Glob/Grep/Read to find the **specific** files, functions, and conventions involved. Follow the patterns already in the code (see `CLAUDE.md` / existing modules) rather than inventing new ones.

**Done when** you have verified, real file paths for every part of the change, and net-new files are identified as such.

## Step 4 — Write the plan document

Write the plan to `docs/plans/<NN>-<slug>.md` (zero-padded next number; create `docs/plans/` if absent). Follow [`PLAN-FORMAT.md`](PLAN-FORMAT.md) exactly. Set **Status: Draft**.

The implementation steps must be ordered and each one independently actionable by an engineer who hasn't seen this conversation. The files table must use real paths from Step 3, marking net-new files **(new)**.

**Done when** the doc exists, follows the format, and every section is filled from Steps 2–3 (no placeholders).

## Step 5 — Review loop (behind the gate)

Present the plan to the user — summarize it inline and link the doc — and **explicitly invite changes**: "Tell me what to change, or say it's approved to start." Then:

- Apply each round of feedback to the doc, appending a dated line to its **Revision log**.
- Re-present what changed.
- Repeat until the user signals approval. **Write no feature code in this loop**, regardless of how clear the plan seems — the gate is the user's to open.

**Done when** the user explicitly approves the plan (e.g. "approved", "looks right, go"). Silence or general agreement is not approval — confirm.

## Step 6 — Open the gate

On explicit approval, set the doc's **Status: Approved** and record the approval in the Revision log. Then ask whether to begin development now or later.

If now, implement **step by step in the doc's order**, checking off each implementation step in the doc as you complete it so the plan stays the source of truth. Stop and re-confirm with the user if reality diverges from the plan (a step turns out wrong or a new decision appears) — update the doc rather than silently deviating.

**Done when** Status is Approved and either development has started against the checklist or the user has chosen to defer it.
