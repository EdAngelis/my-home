# Duties Feature — Implementation Plan

Plan for delivering the duties feature described in `DUTIES.md`. It is split into
phases (each independently shippable) and concrete, file-level steps that follow
the existing conventions in `CLAUDE.md` (layered API: `routes → controller → repo
→ model`; centralized frontend calls in `app.service.ts`; one folder per
page/component).

---

## 1. Requirements (from `DUTIES.md`)

0. **Categories** — create duty categories (e.g. Home, School, Work).
1. **Create duties** — with `name`, recurrence period, and a category. A duty is
   created with status **To make**; after being marked **made**, the recurrence
   period restarts.
2. **Makers** — create makers and assign them to duties.
3. **Edit duties** — change recurrence and add/remove makers.
4. **List + filter** — filter by **status** (To make / Expire in / Paused),
   **category**, and **maker**; clicking a duty card opens its edit page.

---

## 2. Gap analysis (current state vs. target)

Current `Duty` model: `cod`, `name`, `frequency`, `value`, `history[{date,maker}]`,
`description`. The frontend `duties.tsx` only **lists overdue duties** and lets you
mark one done; there is no create/edit page, no category, no maker entity, and no
explicit status.

| Need | Today | Work required |
| --- | --- | --- |
| Categories | none | new `categories` resource (model→routes) + FE service + UI |
| Makers | only a free-text `history.maker` string | new `makers` resource + FE service + UI |
| Duty.category | none | add field (ref to category id) |
| Duty.makers | none | add `makers: string[]` (maker ids) |
| Status: Paused | none | add stored `status` enum |
| Status: To make / Expire in | computed ad-hoc in `duties.tsx` | centralize derivation helper |
| Create duty UI | only a non-wired `AddCircleIcon` | new create/edit page |
| Edit duty UI | clicking card does nothing | route + page reusing create form |
| Filters | overdue-only hardcoded filter | category / maker / status filter bar |

**Known bug to fix in passing:** `duties.tsx` `handlePending` reads
`duty.history[0].date` and crashes when `history` is empty. A duty created fresh
has empty history, so this must be guarded (treat empty history as "To make").

---

## 3. Design decisions (resolved)

- **Status modeling.** Store only `status: "active" | "paused"` on the duty.
  Derive the display state from history + frequency when `active`:
  - empty history **or** `daysSinceLast > frequency` → **To make** (overdue/due now)
  - `daysSinceLast <= frequency` → **Expire in** (N days remaining)
  - `status === "paused"` → **Paused** (excluded from due calculation)
  This keeps a single source of truth and avoids a stored value going stale.
- **Category reference.** Store `category` as the category `_id` string on the duty
  (mirrors how `Product.createdByUserId` stores an id as a string — no Mongoose
  `populate` is currently used anywhere except `buyers.repo`). FE resolves the name
  from the loaded categories list.
- **Makers reference.** Store `makers: string[]` (array of maker `_id`s) on the
  duty. `history[].maker` keeps recording *who* executed it (maker id).
  **Makers are optional** — a duty can have zero assigned makers. _(Q3)_
- **Ownership / scoping.** _(Q6)_ Every duty stores `createdByUserId` (new field,
  same pattern as `Product`). The list only ever shows the current user's own
  duties — set on create from `AppContext.userId` and filtered on load (preferably
  server-side via `GET /duties?createdByUserId=<id>`, which the existing
  pass-through `findMany(query)` already supports). **Categories and makers are
  likewise per-user**: each stores `createdByUserId` and is filtered to the current
  user so the dropdowns only show the user's own categories/makers.
- **Paused control.** _(Q5)_ Pausing is a field on the **edit form only** — there
  is no quick toggle on the list card.
- **"Expire in" display.** _(Q4)_ The card shows the remaining days (e.g.
  "Expire in 3 days") via `daysRemaining(duty)`, not just a badge.
- **`cod` field.** _(Q1)_ **Keep it** and **auto-generate** a unique value in the
  create form (e.g. slug of name + timestamp), so the user never types or sees it.
  Zero migration; existing duties are unaffected. The form must guarantee
  uniqueness to avoid violating the `unique` index.
- **Reuse `updateDuty`.** Marking a duty done, pausing, and editing all go through
  the existing `PATCH /duties/:id` (sends the whole duty), matching `updateCart`.
- **Categories & makers UI.** _(Q2)_ Standalone management pages (not inline in the
  duty form) — see Phase 7.

> Everything below reflects these decisions. Only the `cod` choice (Q1) remains
> open; the plan assumes **B (remove)** until told otherwise.

---

## Phase 1 — API: Categories resource

Goal: full CRUD for categories, matching the per-resource file shape.

1. **Model** — `my-home-api/src/models/categories.model.ts`
   - `Category` schema: `name` (required), `createdByUserId` (owner buyer id, used
     to scope per user — Q6), `createdAt`/`updatedAt`. Export `Category` +
     `ICategory`. Note: `name` is **not** globally unique since categories are
     per-user (two users may each have "Home").
2. **Barrel** — add `Category` to `my-home-api/src/models/index.ts`.
3. **Repo** — `my-home-api/src/repository/categories.repo.ts` with the standard
   CRUD shape (`findMany`, `findOne`, `create`, `createMany`, `updateOne`,
   `updateMany`, `deleteOne`, `deleteMany`).
4. **Controller** — `my-home-api/src/controller/categories.controller.ts`
   mirroring `duties.controller.ts` (try/catch + `response()` helper).
   - **`deleteCategory` cascades** (DUTIES.md rule #1): after deleting the category,
     clear it from any duty that referenced it —
     `Duty.updateMany({ category: id }, { category: "" })`. Affected duties are kept,
     just left without a category.
5. **Routes** — `my-home-api/src/routes/categories.routes.ts`
   (`GET /`, `POST /create`, `GET /:id`, `PATCH /:id`, `DELETE /:id`).
6. **Mount** — register `/categories` in `my-home-api/src/routes/routes.ts`.
7. **Docs** — add the routes to `API.md`.

## Phase 2 — API: Makers resource

Same shape as Phase 1.

1. `my-home-api/src/models/makers.model.ts` — `Maker` schema: `name` (required),
   `createdByUserId` (owner buyer id, scopes per user — Q6), timestamps. Export
   `Maker` + `IMaker`.
2. Add `Maker` to `models/index.ts`.
3. `repository/makers.repo.ts` — standard CRUD shape.
4. `controller/makers.controller.ts`.
   - **`deleteMaker` cascades** (DUTIES.md rule #2): after deleting the maker, pull
     its id from every duty's `makers` array —
     `Duty.updateMany({ makers: id }, { $pull: { makers: id } })`. The duties are
     kept, just no longer reference the deleted maker.
5. `routes/makers.routes.ts` and mount `/makers` in `routes.ts`.
6. Update `API.md`.

## Phase 3 — API: Extend the Duty model

1. **Model** — `my-home-api/src/models/duties.model.ts`
   - add `createdByUserId?: string` (owner buyer id — enables per-user scoping, Q6)
   - add `category?: string` (category id)
   - add `makers?: string[]` (maker ids, default `[]`)
   - add `status?: string` (enum `["active","paused"]`, default `"active"`)
   - keep `cod` (unique), `value`, `history`, `frequency`, `description`.
   - **`cod`** stays required+unique; the create form auto-generates it (Phase 5).
2. No controller/repo change needed — `updateOne`/`create` already pass the whole
   body through. `findMany(query)` forwards `req.query` straight to `Duty.find`, so
   filtering by `createdByUserId`, `category`, `status`, and `makers` works via
   query string. The list loads with `?createdByUserId=<current user>` so the API
   never returns another user's duties. Document the supported query params in
   `API.md`.

## Phase 4 — Frontend: models + service layer

1. **Models** — `my-home-front/src/models/`
   - `category.model.ts` (`ICategory`: `_id?`, `name`, `createdByUserId?`).
   - `maker.model.ts` (`IMaker`: `_id?`, `name`, `createdByUserId?`).
   - extend `duties.model.ts` with `category?`, `makers?: string[]`,
     `status?: "active" | "paused"`.
2. **Service** — add to `my-home-front/src/app.service.ts` (the only place allowed
   to call `api`). All getters take the current `userId` and pass it as a
   `?createdByUserId=` query so each user only sees their own data:
   - `getCategories(userId)`, `createCategory()`, `updateCategory()`,
     `deleteCategory()`
   - `getMakers(userId)`, `createMaker()`, `updateMaker()`, `deleteMaker()`
   - `getDuties(userId)` → update the existing one to take `userId` and append
     `?createdByUserId=<id>`
   - `createDuty(duty)` → `POST /duties/create`
   - `deleteDuty(id)` → `DELETE /duties/:id`
   - (`updateDuty` already exists.)
3. **Shared helper** — `my-home-front/src/shared/duty-status.ts`:
   `getDutyState(duty): "to_make" | "expire_in" | "paused"` plus
   `daysRemaining(duty)`. Reuses `shared/dates-interval.ts`. Guards empty history.

## Phase 5 — Frontend: Create / Edit duty page

Mirror the products create/edit pattern (`create_product.tsx` + route state).

1. **Page** — `my-home-front/src/pages/duties/create/create_duty.tsx`
   - `react-hook-form`; if a duty is passed via `useLocation().state`, it's edit
     mode (prefill via `reset`), else create.
   - Fields: `name`, `frequency` (recurrence in days), `description`, category
     (`Dropdown` from `getCategories(userId)`), makers (optional multi-select /
     checkbox list from `getMakers(userId)`), and a **Paused** toggle (Q5 — this is
     the only place pausing is controlled).
   - On submit: create → set `createdByUserId: userId`, `status: "active"`,
     `history: []` (and `cod` only if decision A), then `createDuty`; edit →
     `updateDuty`. Then navigate back to `/duties`.
   - Colocated `create_duty.module.css`.
2. **Route** — add `{ path: "create-duty", element: <CreateDuty /> }` to
   `my-home-front/src/routes.tsx` (under the `Menu` children, like create-product).

## Phase 6 — Frontend: Duties list + filters (rework `duties.tsx`)

1. Load the current user's duties, categories, and makers on mount
   (`getDuties(userId)` etc.). If `userId` is empty, redirect to `/` like
   `products.tsx` does.
2. Replace the overdue-only hardcoded filter with a filter bar:
   - **Status** dropdown: All / To make / Expire in / Paused (uses
     `getDutyState`).
   - **Category** dropdown (from categories).
   - **Maker** dropdown (from makers).
3. Render each duty as a **card** showing name, category name, derived status badge,
   the remaining days when in "Expire in" (e.g. "Expires in 3 days" — Q4), and
   assigned makers.
4. Card click → `goTo("/create-duty", duty)` (edit). Keep the "mark as made"
   play button (`handleExecution`) — push `{date: now, maker}` and `updateDuty`.
5. Wire the `AddCircleIcon` to `goTo("/create-duty", null)`.
6. Fix the empty-`history` crash via the shared helper.
7. Add the `/duties` link to `components/menu/menu.tsx` (it is currently reachable
   only by URL).

## Phase 7 — Frontend: Categories & Makers management UI

Standalone management pages (Q2) so users can populate the dropdowns. Each lists
only the current user's items (`createdByUserId === userId`) and supports add +
delete (edit optional).

1. **Categories page** — `pages/categories/categories.tsx` + `categories.module.css`,
   registered as route `categories` under `Menu` children. List + add + delete.
2. **Makers page** — `pages/makers/makers.tsx` + `makers.module.css`, route
   `makers` under `Menu` children. List + add + delete.
3. Add nav links to both from `components/menu/menu.tsx` (alongside the new
   `/duties` link).

## Phase 8 — Verification & docs

1. Generate `.http` files for the new endpoints (the `rest-client` skill) and smoke
   test categories/makers/duties CRUD against a local API.
2. Manually verify create → appears as "To make" → mark made → flips to "Expire in"
   → after `frequency` days → "To make"; pause hides from due; filters work.
3. Update `API.md` and `CLAUDE.md` (new resources, new pages/routes, status model).

---

## 4. Suggested build order & dependencies

```
Phase 1 (Categories API) ─┐
Phase 2 (Makers API)     ─┼─→ Phase 3 (Duty model) ─→ Phase 4 (FE models+service)
                          │                                   │
                          │            ┌──────────────────────┼─→ Phase 5 (Create/Edit)
                          │            │                       │
                          └────────────┴───────────────────────→ Phase 6 (List+filters)
                                                               │
                                                  Phase 7 (Cat/Maker UI) ─→ Phase 8 (Verify)
```

Phases 1–3 are backend-only and can land first. Phase 7 can be pulled earlier if
you prefer to seed categories/makers before building the duty form.

---

## 5. Decisions log

| # | Question | Decision |
| --- | --- | --- |
| 1 | Keep `cod` (auto-generate) or remove it? | **Keep + auto-generate** — no migration; form generates a unique value. |
| 2 | Categories/makers UI: standalone vs. inline? | **Standalone pages** (Phase 7). |
| 3 | Maker required on a duty? | **Optional** — zero makers allowed. |
| 4 | "Expire in" display? | **Show remaining days** on the card. |
| 5 | Pausing control? | **Edit form field only** — no list-card toggle. |
| 6 | Owner scoping? | **Per-user** — duties, categories, and makers are all scoped to `createdByUserId`; users never see others' data. |

