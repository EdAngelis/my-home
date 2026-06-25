# my-home-api — Architecture Review & Improvement Plan

A point-in-time review of `my-home-api`'s current architecture, with findings grouped by
severity and a phased plan to address them. This is a planning document, not a changelog —
nothing here has been implemented yet.

## Current architecture

- **Layering:** `routes/*.routes.ts` → `controller/*.controller.ts` → `repository/*.repo.ts` →
  `models/*.model.ts` (Mongoose). Consistent across all four resources (products, buyers, cart,
  duties); each repository exposes the same CRUD shape (`findMany`, `findOne`, `create`,
  `createMany`, `updateOne`, `updateMany`, `deleteOne`, `deleteMany`). This consistency is a
  genuine strength and worth preserving as new resources are added.
- **Runtime:** Express + Mongoose (MongoDB). `src/server.ts` always exports a `serverless-http`
  handler (`exports.handler`) for AWS Lambda, and additionally calls `app.listen()` for local
  dev/standalone use, gated by `config.serverless !== "true"` (set via `SERVERLESS=true` in
  `template.yaml`'s Lambda environment).
- **Deployment:** AWS SAM (`template.yaml`, `samconfig.toml`) is the active path, per the latest
  commit ("Deploy with SAM").
- **No auth, no input-validation library, no automated tests.** Logging is mostly `console.log`,
  with `winston` present but barely wired in.

## Findings

### 1. Security — fix first

- **A live MongoDB Atlas credential was committed to git history** (commit `f9cb2d6`, in
  `src/db.ts`, as a hardcoded `mongoose.connect("mongodb+srv://...")` string). It was replaced
  with `config.db_uri` in a later commit (`439758b`), but the credential string itself is still
  reachable in history. **This must be rotated in MongoDB Atlas regardless of the code fix** —
  removing it from the latest revision does not un-expose it from history. (Do not reuse or
  re-paste the old credential anywhere, including in fix-up commits.)
- **CORS is wide open** (`src/app.ts`: `cors({ origin: "*" })`). Combined with zero
  authentication, this means any website can script reads/writes/deletes against any buyer,
  product, or duty from a visitor's browser. Either scope this back to known frontend origins or
  explicitly document why it's intentionally open.
- **No authentication/authorization on any route.** Already flagged in `CLAUDE.md`, confirmed by
  re-reading every controller — this is the single biggest structural gap. Anyone who can reach
  the API (and now, with CORS `"*"`, anyone whose browser can be pointed at it) can read or
  mutate any buyer's cart, any product, any duty.
- **No request body size limit** on `express.json()` — a large payload can be POSTed to any
  route with no guardrail.
- **Raw error objects are returned to callers** (`data: error` in every controller's catch
  block) — this can leak stack traces, Mongoose validation internals, and driver details to any
  caller. Errors should be sanitized before leaving the server.

### 2. Correctness bugs

- `cart.controller.ts`'s `addItem`: `throw error;` executes before the `return response(...)`
  line in its catch block, making the response line unreachable — failures surface as an
  unhandled rejection instead of a clean `500` JSON response.
- `cart.repo.ts`'s `pullItem`: issues `$pull: { "cart.product": { $in: data } }`, but the schema
  field is `cart.items` (not `cart.product`), and `data` is the raw `Items[]` payload rather than
  a list of ids. This route never reliably removes anything. (Not currently called by the
  frontend, so it's silently dead/broken rather than actively breaking the app.)
- `src/models/products.ts`'s seed catalog includes items with `unit: "dz"` (cod `16`, "Ovos")
  and `unit: "pacote"` (cod `46`, "Iorgute Danoninho"), but `products.model.ts`'s schema only
  allows `enum: ["kg", "un"]`. `GET /products/create-many` will fail Mongoose validation on
  these documents; since `insertMany` is ordered by default, the whole seed batch aborts at the
  first invalid document rather than partially succeeding.
- Several repository functions return the Mongoose `Query` object directly instead of awaiting
  it first (e.g. `products.repo.ts`'s `findOne`: `const product = Product.findById(_id); return
  product;`). This happens to work today (an `async` function returning a thenable still
  resolves correctly for the caller), but it's inconsistent with sibling functions in the same
  file (`create`, `createMany`) that do `await` before returning, and is easy to misread as a
  bug. Worth standardizing on `await`.

### 3. Dead code

- `src/controller/repo.ts` (`printProducts`, `total`, `generateShopMessage`) and the legacy
  `src/types/` set it depends on (`ProductType`, `CartType`, `DutiesType`, `ShopHistoryType`) —
  not imported by any route, controller, or repository. Leftover from an earlier CLI-style
  version of the app.
- `src/utils/dates-diference.ts` (`datesInterval`) — exported from `utils/index.ts` but never
  imported anywhere.
- `chalkDebug`/`chalkTrace` in `src/tools/chalk.ts` — exported but unused (only `chalkError`,
  `chalkSuccess`, `chalkWarning`, `chalkInfo` are actually used).

### 4. Architecture / design gaps

- **No input validation layer.** Every controller passes `req.body`/`req.query` straight to
  Mongoose. This means: arbitrary extra fields pass through silently; query params could
  theoretically carry Mongo query operators straight into `Product.find(query)` /
  `Buyer.find(query)` (e.g. `?name[$ne]=`); and a malformed `:id` (non-ObjectId string) throws a
  Mongoose `CastError` that surfaces as a generic `500` instead of a `400`. A schema-validation
  library (zod, joi, etc.) at the controller boundary would close all three gaps and let routes
  return proper `400`s for bad input.
- **No centralized error handling.** Every controller hand-rolls the same
  try/catch/`response(500, ...)` block — the same ~6 lines repeated over 30+ handlers. An Express
  error-handling middleware (controllers calling `next(err)` instead) would remove this
  duplication and make error formatting consistent and easy to change in one place.
- **Config is minimal** — only `db_uri` and `serverless` are environment-driven
  (`src/config/config.ts`); `PORT`, CORS origins, and log level are hardcoded constants. Worth
  folding into the same config module as the app grows.
- **Two deployment tools coexist, only one is live.** `package.json` still has a `deploy`
  script (`serverless deploy`) and a `serverless` devDependency, plus a stale `.serverless/`
  build directory — but there's no `serverless.yml` anymore, and the latest commit message
  ("Deploy with SAM") confirms AWS SAM (`template.yaml`, `sam:build`/`sam:deploy`) is the
  actual path. The Serverless Framework leftovers should be removed to avoid ambiguity about
  which deploy command is authoritative.
- `json.json` (repo root of `my-home-api`) looks like an ad-hoc sample/scratch dump of a buyer
  cart document — not referenced by any code. Should be deleted or moved out of the source tree
  if it's meant as a fixture.
- `kaban.md`'s backlog ("Remove Product", "Clean Cart", "Register Duties", "Remove Duties",
  "Tabs Menu") predates and duplicates the GitHub Projects board now in active use (see
  `.claude/repository.md`). Worth folding any still-relevant items into the board and removing
  this file so there's one source of truth for planned work.

### 5. Testing & observability

- **Zero automated tests** anywhere in `my-home-api` — no `*.test.ts`/`*.spec.ts`, no test
  runner in `package.json`. Given the uniform CRUD shape across all four resources, this is a
  good candidate for a small integration suite (e.g. against `mongodb-memory-server`) covering
  one happy-path + one error-path per repository function, plus controller tests asserting
  status codes and the `{ message, data }` response shape.
- **Logging is inconsistent.** `morgan("dev")` covers HTTP access logs (console only, not
  persisted); `winston` is wired up but used in only 3 places (`db.ts`'s connect callback, and
  the `SIGINT`/`SIGTERM` handlers in `server.ts`) — every controller and repository uses
  `console.log` instead. In the Lambda deployment, structured logs via `winston` (consistently
  applied) would be far more useful for production debugging than scattered `console.log`s.
- **No health-check route** (e.g. `GET /health`) for the HTTP API/Lambda to use for monitoring.

## Suggested phased plan

**Phase 1 — Stop the bleeding (security & correctness)**
1. Rotate the exposed MongoDB Atlas credential; update `.env` and the Lambda environment with
   the new value.
2. Fix `cart.controller.ts`'s `addItem` catch block (drop the stray `throw`).
3. Fix or remove `cart.repo.ts`'s `pullItem` (wrong field path, ids vs. raw payload).
4. Fix the seed catalog's `unit` values (`"dz"`/`"pacote"`) to match the schema enum, or widen
   the enum to match the real units in use.
5. Decide on CORS: scope it back to known frontend origins, or explicitly document why it's
   intentionally `"*"`.

**Phase 2 — Close the structural gaps**
6. Add a validation layer (zod/joi) at the controller boundary for `POST`/`PATCH` bodies and
   `:id` params; return `400` instead of `500` for invalid input.
7. Add a centralized Express error-handling middleware; have controllers call `next(err)`
   instead of duplicating try/catch/`response(500, ...)`.
8. Decide on an authentication strategy (even a minimal one, e.g. a signed token tied to buyer
   `cpf`) given every route is currently world-writable.

**Phase 3 — Cleanup & hygiene**
9. Delete dead code: `controller/repo.ts`, the legacy `src/types/*` set it depends on,
   `utils/dates-diference.ts`, unused `chalkDebug`/`chalkTrace`.
10. Standardize repository functions to consistently `await` before returning.
11. Remove the dead Serverless Framework path (`deploy` script, `serverless` devDependency,
    `.serverless/`) now that AWS SAM is the deployment mechanism.
12. Delete or relocate `json.json`; fold `kaban.md`'s backlog into the GitHub Projects board and
    remove the file.

**Phase 4 — Testing & observability**
13. Add an integration test suite (per-resource CRUD tests against `mongodb-memory-server`).
14. Route server-side logging through `winston` consistently (replace `console.log` in
    controllers/repos); keep `morgan` for HTTP access logs only.
15. Add a `GET /health` route for uptime monitoring.
