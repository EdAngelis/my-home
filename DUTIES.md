# Duties Feature — Requirements

A duty is a recurring household task (e.g. "Clean the bathroom", "Water the
plants"). The app tracks when each duty was last done, works out when it is due
again, and lets the user mark it done — which restarts its recurrence clock.

This document describes **what** the feature does. The step-by-step build plan
lives in `planning_duties.md`.

---

## Core concepts

- **Duty** — a recurring task with a name, a recurrence period (in days), a
  category, and optionally one or more assigned makers.
- **Category** — a grouping for duties (e.g. Home, School, Work). Used for
  organizing and filtering.
- **Maker** — a person who can be assigned to / carry out a duty (e.g. a family
  member). A duty can have zero, one, or several makers.
- **Execution / history** — each time a duty is marked done, an entry is recorded
  (the date, and which maker did it). The most recent execution determines whether
  the duty is currently due.

### Ownership (important)

Everything is **per user**. Each duty, category, and maker belongs to the user who
created it (`createdByUserId`). A user only ever sees and manages their own duties,
categories, and makers — never another user's. _(Note: the app has no real
authentication today; "user" means the current buyer id held in app state.)_

---

## Status model

A duty's displayed status is one of three values:

| Status | Meaning |
| --- | --- |
| **To make** | The duty is due now or overdue — time since the last execution is greater than the recurrence period. A brand-new duty (no execution history yet) starts as **To make**. |
| **Expire in** | The duty is not due yet. The card shows the number of days remaining until it becomes due (e.g. "Expires in 3 days"). |
| **Paused** | The duty is temporarily inactive. It is excluded from the due/overdue calculation and is not surfaced as something to do. |

**To make** and **Expire in** are *derived* automatically from the recurrence
period and the last execution date — they are not set by hand. **Paused** is the
only status the user controls directly (set on the edit form).

---

## Requirements

### 0. Manage categories
- Create a category by name (e.g. Home, School, Work).
- List and delete the user's own categories.
- Categories are managed on a dedicated page.

### 1. Manage makers
- Create a maker by name.
- List and delete the user's own makers.
- Makers are managed on a dedicated page.

### 2. Create a duty
- Required: **name**, **recurrence period** (in days), **category**.
- Optional: **description**, **assigned makers** (zero or more).
- A new duty starts with status **To make** and an empty execution history.

### 3. Mark a duty as done
- Marking a duty done records an execution entry (date = today, plus which maker,
  when applicable).
- This **restarts the recurrence period**: the duty leaves **To make** and becomes
  **Expire in**, counting down from the recurrence period again.

### 4. Edit a duty
- Change the name, recurrence period, category, and description.
- Add or remove assigned makers.
- **Pause / un-pause** the duty (this is the only place pausing is controlled).

### 5. List and filter duties
- Show the user's duties as cards. Each card shows: name, category, current status
  (with remaining days when the status is **Expire in**), and assigned makers.
- Filter by **status** (To make / Expire in / Paused), **category**, and **maker**.
- Clicking a duty card opens its **edit page** (requirement 4).
- Each card also has a quick **"mark as done"** action (requirement 3).

### 6. Delete a duty
- The user can delete their own duties.

---

## Edge cases & rules

1. **Deleting a category that is still used by duties** — the delete is allowed.
   Affected duties are left **without a category** (their category becomes empty);
   they are not deleted.
2. **Deleting a maker that is assigned to duties** — the delete is allowed. That
   maker is **removed from the assignments** of every duty it was on; the duties
   themselves are kept.
3. **Empty history** — a duty that has never been done counts as **To make**.
4. **Due-day boundary** — when "days since last execution" exactly equals the
   recurrence period, the duty is **To make** (it becomes due once it reaches the
   period).
5. **Un-pausing** — when a paused duty is re-activated, its due state **resumes
   from its last execution date**. Pausing and un-pausing never reset the
   recurrence clock.

---

## Data-model note

- **Duty code (`cod`)** — the data model has a unique `cod` field that nothing in
  the app surfaces. Decision: **keep it.** The create form auto-generates a unique
  value (so the user never types or sees it); existing duties keep working with no
  migration. See `planning_duties.md` §3.
