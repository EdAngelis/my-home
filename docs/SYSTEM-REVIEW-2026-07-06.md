# System Review — 2026-07-06

- **Command:** `/system-review` (driver for the `system-improvement-scan` skill)
- **Lenses run:** Architecture, Tests, UX/UI, Fragility, Security, Performance, Reliability & Scalability — all seven ran on Fable 5 sub-agents; none failed or returned empty.
- **Scope:** whole repo — `my-home-api` (Express/MongoDB) and `my-home-front` (React/Vite).
- **No code has been changed.** This document is the scan report only.

> Note: CLAUDE.md's "What NOT to do" claims `src/db.ts` hardcodes an Atlas connection string. That is no longer true — `db.ts:8` uses `config.db_uri` and the credential now lives in the gitignored `my-home-api/.env`. CLAUDE.md should be updated (see finding 36). The credential itself still needs rotation (finding 1).

## Summary table

| # | Severity | Lens | Finding | Files |
|---|----------|------|---------|-------|
| 1 | Critical | Security | Live MongoDB Atlas credential (previously committed) never rotated | `my-home-api/.env` |
| 2 | Critical | Security | NoSQL operator injection: `req.query` passed raw into `updateMany`/`deleteMany`/`findOne` | `buyers.controller.ts`, `buyers.repo.ts`, `products.repo.ts` |
| 3 | Critical | Security | No authentication/authorization on any route; CPFs (PII) enumerable | all routes, `buyers.controller.ts` |
| 4 | Critical | Reliability | Cart persisted via whole-buyer PATCH — concurrent devices clobber each other | `products.tsx`, `cart.tsx`, `app.service.ts`, `buyers.repo.ts` |
| 5 | Critical | Fragility | Deleting a product leaves dangling cart refs → cart page crashes | `products.tsx`, `cart.tsx`, `cart.controller.ts` |
| 6 | Major | Reliability | `addItem` rethrows in catch — 500 response unreachable, request hangs | `cart.controller.ts` |
| 7 | Major | Reliability | `pullItem` `$pull` targets nonexistent field — silent no-op, returns 200 | `cart.repo.ts` |
| 8 | Major | Security | Mass assignment: `req.body` passed wholesale into create/update | `buyers.controller.ts`, `products.controller.ts`, etc. |
| 9 | Major | Security | CORS `origin: "*"` | `app.ts` |
| 10 | Major | Reliability | Server listens without awaiting DB connection; no error handler or retry | `db.ts`, `server.ts` |
| 11 | Major | Reliability | Duty "Done": race loses executions; double-tap logs twice; history round-trips whole and grows unbounded | `duties.tsx`, `duties.repo.ts` |
| 12 | Major | Fragility | Sign-in miss returns 201 + frontend string-matches `"Buyer not found"` | `buyers.controller.ts`, `home.tsx` |
| 13 | Major | UX | Every failure is silent (`console.log` catches); success alert shown even on failure | all pages |
| 14 | Major | UX | No loading/empty/error states on any list page | `products.tsx`, `duties.tsx`, `categories.tsx`, `makers.tsx` |
| 15 | Major | UX | Cancel button submits the create-product form (saves on cancel) | `create_product.tsx` |
| 16 | Major | UX | One-click irreversible deletes on bare `<div>`s; cart Clear unconfirmed | `products.tsx`, `categories.tsx`, `makers.tsx`, `cart.tsx` |
| 17 | Major | UX | No form validation; price typed as `"1,99"` yields NaN cart totals | `create_product.tsx`, `create_duty.tsx`, `cart.tsx` |
| 18 | Major | Fragility | `cpfValidator` regex uses `g` flag — `test()` is stateful, results alternate | `validators/cpf.ts` |
| 19 | Major | Performance | No index on `createdByUserId` — every list endpoint is a full collection scan | 4 model files |
| 20 | Major | Tests | Zero tests and zero test tooling in either app | both `package.json` |
| 21 | Major | Security | `GET /products/create-many` publicly bulk-inserts 555 seed products | `products.routes.ts`, `models/products.ts` |
| 22 | Minor | Reliability | Repo queries returned without `await` — every repo catch block is dead | `buyers.repo.ts`, `duties.repo.ts`, `cart.repo.ts`, … |
| 23 | Minor | Reliability | `findByIdAndUpdate` without `{ new: true }` — update responses return the stale doc | all repos |
| 24 | Minor | Performance | Unbounded `find()` with no projection; `populate` hydrates full product docs | all repos, `buyers.repo.ts` |
| 25 | Minor | Performance | Full-collection refetch after every small mutation | `products.tsx`, `categories.tsx`, `makers.tsx`, `duties.tsx` |
| 26 | Minor | UX | Alert is a wordless color flash: no text, no ARIA, uncleared `setTimeout` | `alert.tsx` |
| 27 | Minor | Security | WhatsApp URL built without `encodeURIComponent` | `app.service.ts` |
| 28 | Minor | Reliability | Sign-up check-then-create race on unique CPF index | `home.tsx` |
| 29 | Minor | UX | `filteredProducts` duplicated state desyncs from filter text after mutations | `products.tsx` |
| 30 | Minor | UX | `InputButton` accepts but never binds its `value` prop; input unlabeled | `input-button.tsx` |
| 31 | Minor | Fragility | Inconsistent response unwrapping (`response.data` vs `response.data.data`) | `app.service.ts` |
| 32 | Minor | Architecture | Dead code: `controller/repo.ts`, `cover.tsx`, duplicated date utils, unused cart HTTP tier | several |
| 33 | Minor | Architecture | Pass-through repos + copy-paste controllers + twin categories/makers pages | `repository/*`, `controller/*`, 2 pages |
| 34 | Minor | Architecture/Tests | Business logic trapped in components/controllers — no pure seams to test | `cart.tsx`, `cart.controller.ts`, `app.service.ts` |
| 35 | Minor | Architecture | `buyerId` localStorage session handling scattered across three files | `home.tsx`, `context.tsx`, `menu.tsx` |
| 36 | Minor | Docs | CLAUDE.md stale: `db.ts` no longer hardcodes the connection string | `CLAUDE.md` |

---

## Detailed findings

### 1. Live MongoDB Atlas credential never rotated — Critical / Security
**Files:** `my-home-api/.env:1`
**What's wrong:** The `.env` contains a live Atlas URI with username/password (`ed4ngelis:…@cluster0.l90zluj.mongodb.net/my-home`). `.gitignore` excludes it now and `.env.example` is empty, but per CLAUDE.md this same credential was previously committed to the repository, so it must be treated as compromised.
**Failure scenario:** Anyone who ever cloned or crawled the repo history has full read/write/drop access to the production database.
**Fix direction:** Rotate the password in MongoDB Atlas (external action — no code change), update the local `.env`. Optionally scrub git history.
**Size:** XS
- [ ] Implement

### 2. NoSQL operator injection in bulk endpoints — Critical / Security
**Files:** `my-home-api/src/controller/buyers.controller.ts:99-103, 127-131`; `buyers.repo.ts:60, 78`; `products.repo.ts:51, 69`; `buyers.controller.ts:15` (signIn)
**What's wrong:** `req.query` is passed directly as the Mongoose filter to `updateMany`/`deleteMany`. Express parses `?cpf[$ne]=x` into `{ cpf: { $ne: "x" } }`. `signIn` casts `cpf as string` but the runtime value can be an object.
**Failure scenario:** `DELETE /buyers?cpf[$ne]=x` deletes every buyer in the database. `PATCH /buyers?...` mass-updates arbitrary records.
**Fix direction:** Whitelist allowed filter fields and coerce values to strings (or add `express-mongo-sanitize`); remove or protect the bulk endpoints the frontend never calls.
**Size:** S
- [ ] Implement

### 3. No authentication/authorization anywhere — Critical / Security
**Files:** `my-home-api/src/app.ts` (only cors/json/morgan), all of `src/routes/*.routes.ts`; worst exposure `buyers.controller.ts:15` (`GET /buyers/signIn?cpf=`) and `GET /buyers/:id`
**What's wrong:** Every route is public. Any caller can read any buyer (including CPF — Brazilian national ID, PII), modify or delete any record by guessing/enumerating ids or CPFs.
**Failure scenario:** A script iterates CPFs against `/buyers/signIn` and harvests PII plus cart/phone data; anyone PATCHes/DELETEs other users' data.
**Fix direction:** Add an auth layer (even a simple signed-token session tied to buyer id) plus per-user ownership checks in controllers. This is a feature-sized change — plan separately (e.g. via `/plan-feature`).
**Size:** L
- [ ] Implement

### 4. Cart persisted by whole-buyer PATCH — concurrent clobbering — Critical / Reliability
**Files:** `my-home-front/src/pages/products/products.tsx:58-61`, `pages/cart/cart.tsx:45-64`, `src/app.service.ts:89-92`, `my-home-api/src/repository/buyers.repo.ts:49-58`
**What's wrong:** The frontend mutates the in-memory `buyer.cart.items` array and PATCHes the entire buyer document (read-modify-write). Last write wins.
**Failure scenario:** Two devices/tabs on the same buyer: device A adds items, device B taps a quantity — A's items vanish. Also ships the full populated buyer (products with images) both ways per click (perf).
**Fix direction:** Persist cart changes through atomic server ops (`$push`/`$pull`/positional `$set` on `cart.items`) — the cart routes already exist but are broken/unused (see 6, 7); fix and adopt them.
**Size:** M
- [ ] Implement

### 5. Deleting a product leaves dangling cart references — Critical / Fragility
**Files:** `my-home-front/src/pages/products/products.tsx:71-78` (delete), crash sites `pages/cart/cart.tsx:36` (`item.product.price`), `products.tsx:52` (`item.product._id`), `my-home-api/src/controller/cart.controller.ts:65` (`item?.product.name` — the chain stops at `item`)
**What's wrong:** `DELETE /products/:id` never removes the product from buyers' embedded carts. `populate("cart.items.product")` then yields `null` for those items.
**Failure scenario:** User deletes a product that is in someone's cart → cart page white-screens with no recovery except Clear.
**Fix direction:** Filter out null products after populate (defense) and cascade-clean carts on product delete (cause) — mirrors the existing category/maker cascade pattern.
**Size:** S
- [ ] Implement

### 6. `addItem` rethrows — response unreachable, request hangs — Major / Reliability
**Files:** `my-home-api/src/controller/cart.controller.ts:22-27` (route `cart.routes.ts:6`)
**What's wrong:** The catch block does `throw error;` before `return response(res, 500, …)`, making the response unreachable. Express 4 doesn't catch async throws.
**Failure scenario:** Any DB error on `POST /cart/add/:id` sends no response; the client hangs until the 15s axios timeout; the server logs an unhandled rejection.
**Fix direction:** Delete the `throw` (CLAUDE.md already flags this as a known don't-replicate bug).
**Size:** XS
- [ ] Implement

### 7. `pullItem` `$pull` targets a nonexistent field — silent no-op — Major / Reliability
**Files:** `my-home-api/src/repository/cart.repo.ts:22` (schema: `buyer.model.ts:31-42`)
**What's wrong:** `$pull: { "cart.product": { $in: data } }` — the schema has `cart.items` (`{ product, qt }`), not `cart.product`. Mongo matches zero elements; the controller still returns 200 "Items removed".
**Failure scenario:** Any caller of the remove route believes the item was removed; nothing changed.
**Fix direction:** `$pull: { "cart.items": { product: { $in: productIds } } }` — prerequisite for adopting the cart routes in finding 4.
**Size:** XS
- [ ] Implement

### 8. Mass assignment on create/update — Major / Security
**Files:** `my-home-api/src/controller/buyers.controller.ts:57` (`create(req.body)`), `:87` (`updateOne(id, req.body)`); same pattern in products/duties/categories/makers controllers
**What's wrong:** The raw body goes straight into Mongoose, so a caller can set any schema field (e.g. overwrite another field like `cart` or `cpf` in the same request).
**Failure scenario:** `PATCH /buyers/:id` with `{"cpf": "<someone else's>"}` corrupts identity data; combined with finding 2, arbitrary field injection.
**Fix direction:** Pick allowed fields into an explicit DTO per resource before passing to the repo.
**Size:** S
- [ ] Implement

### 9. CORS `origin: "*"` — Major / Security
**Files:** `my-home-api/src/app.ts:8-12`
**What's wrong:** Any website can call the API from any visitor's browser.
**Failure scenario:** Combined with no auth, a malicious page can read/modify any data server-side data from any visitor's browser.
**Fix direction:** Restrict origin to the deployed frontend URL(s) via env var.
**Size:** XS
- [ ] Implement

### 10. Server starts without a DB connection; no error handling or retry — Major / Reliability
**Files:** `my-home-api/src/db.ts:8` (`mongoose.connect` not awaited; only a `connected` listener), `src/server.ts:10, 17` (listens unconditionally)
**What's wrong:** If Mongo is unreachable, the rejection lands in the global `unhandledRejection` logger and the server still serves requests, each failing after Mongoose's ~10s buffering timeout.
**Failure scenario:** Deploy with bad `DB_URI` → server looks healthy, every request hangs then 500s.
**Fix direction:** `await mongoose.connect` before `app.listen`; add `error`/`disconnected` handlers; exit or retry on failure.
**Size:** S
- [ ] Implement

### 11. Duty "Done" loses executions and grows unbounded — Major / Reliability + Performance + UX
**Files:** `my-home-front/src/pages/duties/duties.tsx:94-102` (unshift + whole-duty PATCH + full refetch), `:165` (`<span onClick>` with no pending state), `my-home-api/src/repository/duties.repo.ts:42`
**What's wrong:** Marking a duty done unshifts into `history` client-side and PATCHes the entire duty. Concurrent marks lose one record; a double-tap logs the execution twice; the full ever-growing history array ships both ways every time. `history[0] = latest` is maintained only by this one unshift (convention shared with `shared/duty-status.ts:9`).
**Failure scenario:** Two household members mark the same duty done → one execution vanishes; impatient double-tap → duplicate history entries.
**Fix direction:** Server-side `$push` with `$position: 0` (atomic); disable the control while in flight; make it a real `<button>`.
**Size:** M
- [ ] Implement

### 12. Sign-in miss signaled by 201 + message string-matching — Major / Fragility
**Files:** `my-home-api/src/controller/buyers.controller.ts:19` (201 + `"Buyer not found"`), `my-home-front/src/pages/home/home.tsx:31`
**What's wrong:** The frontend branches on `message === "Buyer not found"`. Any wording change breaks find-or-create login: the else-branch dereferences a missing `_id`, stores `"undefined"` in localStorage, and every later query silently returns empty.
**Failure scenario:** Someone "fixes" the message text → login silently breaks for everyone.
**Fix direction:** Return 404 for not-found; branch on status in the frontend.
**Size:** S
- [ ] Implement

### 13. Every failure is silent — Major / UX + Fragility
**Files:** `products.tsx:65-77`, `create_product.tsx:48`, `cart.tsx:66-83`, `duties.tsx:61, 99`, `home.tsx:39, 47`, `categories.tsx`, `makers.tsx` — every catch is `console.log(error)`
**What's wrong:** Failed saves/deletes/add-to-cart show nothing. Worse, `cart.tsx` `onPhoneChange` shows the success Alert unconditionally, and `products.tsx:48-49` shows the "added" Alert *before* the request and mutates state in place, so a failed save still looks successful.
**Failure scenario:** API down → user taps "add to cart", sees the success flash, item was never saved.
**Fix direction:** Show alerts only after the await succeeds; add a visible error path (extend the Alert component per finding 26).
**Size:** M
- [ ] Implement

### 14. No loading/empty/error states on list pages — Major / UX
**Files:** `products.tsx`, `duties.tsx`, `categories.tsx`, `makers.tsx`; uncaught loaders at `products.tsx:35-46`, `cart.tsx:27-30`
**What's wrong:** Lists render blank while fetching, blank at zero items, and blank forever on fetch failure (loader rejections are uncaught). The `Loading` component exists but isn't used here.
**Failure scenario:** New user sees an empty white area and can't tell "loading" from "nothing" from "broken".
**Fix direction:** Add `<Loading />`, a deliberate empty message with the create action, and an error + retry branch per list page.
**Size:** M
- [ ] Implement

### 15. Cancel button submits the create-product form — Major / UX
**Files:** `my-home-front/src/pages/products/create/create_product.tsx:109`
**What's wrong:** `<button onClick={…}>Cancel</button>` inside a `<form>` defaults to `type="submit"` — clicking Cancel saves/creates the product before navigating. (`create_duty.tsx:197` already does it right with `type="button"`.)
**Failure scenario:** User opens the form by accident, hits Cancel → junk product created.
**Fix direction:** Add `type="button"`.
**Size:** XS
- [ ] Implement

### 16. One-click irreversible deletes; unconfirmed cart Clear — Major / UX
**Files:** `products.tsx:117-121`, `categories.tsx:73`, `makers.tsx:69` (trash icon in `<div onClick>`), `cart.tsx:149-156` (Clear)
**What's wrong:** Deletes fire instantly with no confirmation, on non-keyboard-reachable divs. Duty delete confirms (`create_duty.tsx:75`) — inconsistent.
**Failure scenario:** Stray tap on mobile permanently deletes a product/category/maker or wipes the cart.
**Fix direction:** Named confirmation ("Delete <name>?") + real `<button>`s, matching the duty-delete pattern.
**Size:** S
- [ ] Implement

### 17. No form validation; comma-price yields NaN totals — Major / UX (data-corrupting)
**Files:** `create_product.tsx:74-105` (price is `type="text"`, placeholder "Ex: 1,99"), `create_duty.tsx:150-162`, NaN surfaces at `cart.tsx:36`
**What's wrong:** No required rules; empty submits create junk records. The price placeholder invites `1,99`, which `Number()` turns into `NaN`, corrupting cart totals and the WhatsApp message. Labels lack `htmlFor`/`id`.
**Failure scenario:** Brazilian user types the locale-normal `1,99` → product saves, cart total shows `NaN`.
**Fix direction:** Add validation rules with inline field errors; parse/normalize price input (accept comma), use a numeric input.
**Size:** M
- [ ] Implement

### 18. `cpfValidator` regex is stateful — Major / Fragility
**Files:** `my-home-front/src/components/validators/cpf.ts:1-4`
**What's wrong:** The regex uses the `g` flag; `regex.test()` then keeps `lastIndex` between calls, so repeated validations of valid CPFs alternate true/false.
**Failure scenario:** User's valid CPF is rejected every second login attempt.
**Fix direction:** Drop the `g` flag (and add the unit test once finding 20 lands).
**Size:** XS
- [ ] Implement

### 19. No index on `createdByUserId` — Major / Performance
**Files:** `my-home-api/src/models/products.model.ts:19`, `duties.model.ts`, `categories.model.ts`, `makers.model.ts`
**What's wrong:** Every list endpoint filters by `createdByUserId`, yet no schema declares an index — every GET is a full collection scan across all users' data. `cpf` (unique) is already indexed.
**Failure scenario:** Linear slowdown of every page load as total data grows.
**Fix direction:** Add `index: true` to `createdByUserId` in the four schemas.
**Size:** XS
- [ ] Implement

### 20. Zero tests, zero test tooling — Major / Tests
**Files:** `my-home-api/package.json`, `my-home-front/package.json` (no test script, no runner deps, no test files)
**What's wrong:** Nothing in either app has a feedback loop; every other finding here shipped silently because nothing could go red. Good news: `app.ts:22` exports the Express app separately from `server.ts`'s listen, so a supertest harness is easy; `shared/duty-status.ts` is a pure, well-shaped first test target.
**Failure scenario:** Any refactor (including fixes from this review) can only be verified by hand.
**Fix direction:** Add vitest to the front (first tests: `duty-status.ts`, `cpf.ts`) and vitest + supertest + mongodb-memory-server to the API.
**Size:** M
- [ ] Implement

### 21. `GET /products/create-many` publicly seeds 555 products — Major / Security + Architecture
**Files:** `my-home-api/src/routes/products.routes.ts:16`, `src/models/products.ts` (555-line seed array), `products.repo.ts:33-40`
**What's wrong:** A GET endpoint bulk-inserts the entire seed catalog, callable by anyone, repeatedly.
**Failure scenario:** Every hit duplicates 555 products into the shared collection; a crawler following GETs can do it by accident.
**Fix direction:** Delete the route and move the seed data to an npm script.
**Size:** S
- [ ] Implement

### 22. Repo queries not awaited — dead catch blocks — Minor / Reliability
**Files:** `buyers.repo.ts:24, 51, 62, 71, 80`; `duties.repo.ts:15, 42, 51, 60, 69`; `cart.repo.ts:6, 20`; same pattern elsewhere
**What's wrong:** Queries are returned without `await` inside try/catch, so repo catches never fire; errors only surface because controllers await the returned thenable. Misleading, and any future logging added in those catches would never run.
**Fix direction:** `return await …` in repo functions.
**Size:** S
- [ ] Implement

### 23. Updates return the stale document — Minor / Reliability
**Files:** every repo `updateOne` (e.g. `makers.repo.ts:42`, `duties.repo.ts:42`, `buyers.repo.ts:51`)
**What's wrong:** `findByIdAndUpdate` without `{ new: true }` returns the pre-update doc while the frontend assumes `response.data.data` is the updated entity.
**Failure scenario:** Any consumer of an update response renders stale data.
**Fix direction:** Pass `{ new: true }` in every repo `updateOne`.
**Size:** XS
- [ ] Implement

### 24. Unbounded queries, no projections — Minor / Performance
**Files:** all `findMany` in `src/repository/*.repo.ts`; `buyers.repo.ts` populate calls (getByCpf, findOne, findMany, updateOne)
**What's wrong:** No limit/pagination/projection anywhere; products ship their `image` string, duties their whole `history`, and every buyer op hydrates full product docs via `populate`.
**Fix direction:** Add `.select()` projections and a populate field selection; pagination when data warrants it.
**Size:** S
- [ ] Implement

### 25. Full-collection refetch after every mutation — Minor / Performance
**Files:** `products.tsx:71-78`, `categories.tsx:36-55`, `makers.tsx`, `duties.tsx:98`
**What's wrong:** Every add/delete triggers a refetch of the whole list instead of updating local state from the mutation response.
**Fix direction:** Update local state from the response (needs finding 23 for correct updated docs).
**Size:** S
- [ ] Implement

### 26. Alert component: wordless, inaccessible, leaky — Minor / UX
**Files:** `my-home-front/src/components/alert/alert.tsx:12-15`
**What's wrong:** A colored div flashed for 500ms — no text, no `role="status"`, meaning encoded in color alone, `setTimeout` never cleared (setState after unmount under rapid triggers).
**Fix direction:** Accept a message prop, add `role="status"`, longer visibility, clear the timer in effect cleanup. Prerequisite for finding 13's error feedback.
**Size:** S
- [ ] Implement

### 27. WhatsApp URL built without encoding — Minor / Security
**Files:** `my-home-front/src/app.service.ts:104-127` (`sendWhatsapp` — manual `%20`/`%0a` replacement, `marketPhone` and product fields interpolated raw)
**What's wrong:** A product name containing `&` or `=` injects URL params into the WhatsApp link; odd characters corrupt the message.
**Fix direction:** Build the message string then `encodeURIComponent` it; encode the phone too.
**Size:** XS
- [ ] Implement

### 28. Sign-up check-then-create race — Minor / Reliability
**Files:** `my-home-front/src/pages/home/home.tsx:28-33`
**What's wrong:** Lookup-then-create; concurrent first logins with the same CPF hit the unique index → 500, swallowed by `console.log`, user stuck on the login screen.
**Fix direction:** Server-side upsert (`findOneAndUpdate` with `upsert: true`) behind the signIn route.
**Size:** S
- [ ] Implement

### 29. Duplicated products/filter state desyncs — Minor / UX
**Files:** `my-home-front/src/pages/products/products.tsx:20-23, 35-39, 84-90`
**What's wrong:** `filteredProducts` is a state copy of `products`; `loadProducts` resets it to the full list while the filter input still holds text (visible after a delete). No debounce.
**Fix direction:** Keep only `products` + query string in state; derive the filtered list with `useMemo`.
**Size:** S
- [ ] Implement

### 30. `InputButton` ignores its `value` prop — Minor / UX
**Files:** `my-home-front/src/components/input-button/input-button.tsx:35-41`
**What's wrong:** `value` is accepted but never bound, so callers (Home, Cart) can't clear or prefill the input; the input also has no associated label.
**Fix direction:** Bind `value` (controlled input), add `id` + label support.
**Size:** XS
- [ ] Implement

### 31. Inconsistent response unwrapping in the service layer — Minor / Fragility
**Files:** `my-home-front/src/app.service.ts` (`getDuties`/`getBuyerByCpf` return `response.data`; most others `response.data.data`), consumers e.g. `duties.tsx:58`
**What's wrong:** Each page encodes which unwrapping its call uses; normalizing either side silently yields `undefined` lists.
**Fix direction:** Unwrap uniformly (return the `data` payload) in `app.service.ts` and adjust the few consumers.
**Size:** S
- [ ] Implement

### 32. Dead code — Minor / Architecture
**Files:** `my-home-api/src/controller/repo.ts` (unimported), `my-home-front/src/pages/cover/cover.tsx` + `components/animations/animation.tsx` (unreachable), `my-home-front/src/shared/dates-interval.ts` (zero imports), `my-home-api/src/utils/dates-diference.ts` (re-exported, never used), cart HTTP tier (`cart.routes.ts`/`cart.controller.ts`/`cart.repo.ts`) never called by the SPA
**What's wrong:** Navigation cost and a live-looking-but-dead cart tier that duplicates frontend logic (`sendOrder` vs `sendWhatsapp`).
**Fix direction:** Delete the dead files; for the cart tier, either delete it or adopt it as the fix for finding 4 (recommended: adopt).
**Size:** S
- [ ] Implement

### 33. Pass-through tiers and copy-paste scaffolding — Minor / Architecture
**Files:** `src/repository/*.repo.ts` (~500 lines of `try { return Model.op(args) } catch { throw }`), `src/controller/{makers,categories,duties,buyers,products}.controller.ts` (~600 lines, same 7 handlers with the noun swapped), `pages/makers/makers.tsx` + `pages/categories/categories.tsx` (byte-near-identical)
**What's wrong:** Shallow modules — the interface is as complex as the implementation (deletion test: deleting the repo tier as-is loses nothing). Every cross-cutting fix (22, 23, 8, 2) must be repeated per resource.
**Fix direction:** A generic CRUD controller/repo factory parameterized by model + hooks (the maker/category delete cascades become the hooks); one shared `NamedListPage` for makers/categories. Best done *after* the per-resource fixes are agreed, so the factory bakes them in once.
**Size:** L
- [ ] Implement

### 34. Business logic has no testable seams — Minor / Architecture + Tests
**Files:** `cart.controller.ts:51-83` (order/total building interleaved with DB + `res`), `app.service.ts:104-127` (WhatsApp message building fused with `window.open`), `cart.tsx:32-56` (kg÷10 quantity rule + pruning inside a `filter` predicate), duplicated unit convention at `app.service.ts:117`
**What's wrong:** The app's real behaviors (order math, message encoding, quantity rules) are only testable past their interfaces — through HTTP+Mongo or a rendered component.
**Fix direction:** Extract pure functions — `buildOrder(cart)`, `buildWhatsappMessage(items)`, `adjustQuantity(items, product, delta)`, `cartTotal(items)` — and test them (pairs with finding 20).
**Size:** M
- [ ] Implement

### 35. Session handling scattered — Minor / Architecture
**Files:** `home.tsx:37, 44` (writes `buyerId` to localStorage), `context.tsx:7` (reads it), `menu.tsx:28` (removes it); `setUserId` doesn't persist
**What's wrong:** The session seam has no owner; any new login/logout path must remember three files.
**Fix direction:** Persist/clear inside the context's `setUserId` so pages only ever touch context.
**Size:** S
- [ ] Implement

### 36. CLAUDE.md stale on `db.ts` — Minor / Docs
**Files:** `CLAUDE.md` ("What NOT to do", first bullet); actual code `my-home-api/src/db.ts:8`
**What's wrong:** CLAUDE.md says `db.ts` hardcodes an Atlas connection string; it now correctly uses `config.db_uri`. The remaining true part is the rotation advice (finding 1).
**Fix direction:** Update the bullet to reflect the current state, keeping the rotation warning until finding 1 is done.
**Size:** XS
- [ ] Implement

---

## Clean areas (checked, found healthy)

- **XSS / path traversal:** no `dangerouslySetInnerHTML`, no unescaped HTML interpolation, no file-path sinks in either app.
- **Secrets hygiene (current state):** `.env` is gitignored; the tracked `.env.example` is empty; `db.ts`/`config.ts` load from env correctly (the historical credential still needs rotation — finding 1).
- **Test harness readiness:** `app.ts` exports the Express app without listening — supertest-ready; `server.ts` correctly separates the process entry.
- **`shared/duty-status.ts`:** a pure, exported, well-shaped module — the model for what finding 34 asks of the rest.
- **TypeScript:** `strict: true` in both apps; no `@ts-ignore` epidemic found.
- **Duty delete flow:** confirms before deleting and lives on the edit form (recent fix #71) — the pattern finding 16 should copy.
- **Process-level handlers:** `server.ts` wires `unhandledRejection`, `uncaughtException`, SIGINT/SIGTERM.

## Suggested implementation order

1. **Rotate the credential** (1) — external, do it first, independent of all code.
2. **Quick dangerous-bug batch** (6, 7, 15, 18, 23, 22, 19, 9, 27, 36) — all XS/S, independent, one small PR.
3. **API hardening** (2, 8, 21, 10, 12) — input validation, DTOs, seed route removal, startup ordering, signIn status.
4. **Cart integrity** (5, 4, adopting the cart tier per 32) — cascade-clean product deletes, then move cart writes to atomic `$push`/`$pull`.
5. **Duties integrity** (11) — atomic history push + button pending state.
6. **Frontend feedback pass** (26, 13, 14, 16, 17, 31) — Alert upgrade first, then error/loading/empty states, confirmations, validation.
7. **Tests bootstrap** (20, 34) — harness + pure-seam extraction; write regression tests for the bugs fixed above.
8. **Structural cleanup** (32, 33, 35, 24, 25, 28, 29, 30) — dead code, CRUD factory, session seam, perf niceties.
9. **Authentication** (3) — feature-sized; plan separately (`/plan-feature`).
