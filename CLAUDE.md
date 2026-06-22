# CLAUDE.md

Context for Claude Code when working in this repository.

## Project overview

My Home is a grocery-shopping organizer: catalog products, build a shopping cart per buyer, and send the cart as a WhatsApp message to a grocery store. It also tracks recurring household duties and flags which are overdue. The repository contains two independent apps: `my-home-api` (Express/MongoDB REST API) and `my-home-front` (React/Vite SPA). They are developed and deployed separately and communicate only over HTTP (the frontend calls the API via `VITE_API_URL`).

## Architecture

**`my-home-api`** is layered:

```
routes/*.routes.ts  -->  controller/*.controller.ts  -->  repository/*.repo.ts  -->  models/*.model.ts (Mongoose)
```

- `routes/routes.ts` mounts the per-resource routers (`/products`, `/buyers`, `/cart`, `/duties`) onto a single `Router`, which `app.ts` mounts at the app root.
- Controllers parse `req`/build `res`, call a repository function, and wrap the result with the shared `response(res, status, { message, data })` helper (`src/types/response-body.type.ts`). Every controller action is wrapped in try/catch; on error it returns HTTP 500 with `{ message: "Error", data: error }`.
- Repositories contain the actual Mongoose calls (`find`, `findById`, `create`, `findByIdAndUpdate`, `deleteMany`, etc.) and re-throw on error.
- `src/server.ts` is the process entry point: it calls `connect()` (`src/db.ts`) then `app.listen`. It also wires `unhandledRejection`, `uncaughtException`, `SIGINT`/`SIGTERM` handlers.
- `src/controller/repo.ts` (`printProducts`, `total`, `generateShopMessage`) is not imported by any route or controller — it is dead code from an earlier CLI-style version of the app.

**`my-home-front`** is a standard Vite/React SPA:

```
main.tsx -> App.tsx (AppProvider + BrowserRouter) -> routes.tsx (useRoutes) -> pages/* -> components/*
```

- Pages call functions in `src/app.service.ts`, which call the shared Axios instance in `src/service/api.ts` (`baseURL` from `VITE_API_URL`, 15s timeout).
- Global UI state (current buyer id, cart item count) lives in `src/context.tsx` (`AppContext`/`AppProvider`), consumed via `useContext`.
- `src/components/menu/menu.tsx` renders the nav bar and is included alongside the page element on every route in `routes.tsx`. It also renders `<Outlet />`, but the route table does not use nested routes, so the outlet currently has no effect.
- `src/pages/cover/cover.tsx` exists but is not registered in `routes.tsx` — it is unreachable from the current route table.

## Authentication

There is no real authentication system.

- "Login" (`pages/home/home.tsx`) takes a CPF or email string, validates it client-side (`components/validators/cpf.ts`, `email.ts`), then calls `GET /buyers/signIn?cpf=...`. If no buyer matches, the frontend immediately calls `POST /buyers` to create one with that CPF and proceeds as if logged in.
- The resulting buyer `_id` is stored only in the in-memory `AppContext` (`userId`). It is not persisted (no cookies, localStorage, or tokens), so a page refresh logs the user out.
- The API has no auth middleware at all. Every route under `/products`, `/buyers`, `/cart`, `/duties` is public — any caller that knows or guesses a buyer/product/duty id can read or modify it. There are no protected vs. public route distinctions on the server.

## Data models

All defined as Mongoose schemas in `my-home-api/src/models/`, mirrored (without Mongoose `Document`) as plain interfaces in `my-home-front/src/models/`.

**Product** (`products.model.ts`, `IProducts`)
- `createdByUserId: string` — buyer id of whoever created the product (used by the frontend to filter "my products").
- `name: string` (required)
- `unit: string` (required, enum `"kg" | "un"`)
- `badge: string` — brand name (labeled "Marca" in the UI).
- `size: string`
- `price: number` (required)
- `characteristic: string`
- `description: string`
- `image: string`
- `category: string`
- `createdAt` / `updatedAt: Date`

**Buyer** (`buyer.model.ts`, `IBuyer`) — acts as the "user" record.
- `cpf: string` (required, unique) — used as the login identifier.
- `marketPhone?: string` — destination WhatsApp number for orders.
- `cart?: Cart` — embedded subdocument: `{ status: string; items: Items[] }` where `Items = { product: IProducts (ref "Products"); qt: number }`.

**Duty** (`duties.model.ts`, `IDuties`)
- `cod: string` (required, unique)
- `name: string` (required)
- `frequency: number` (required) — expected interval in days between executions.
- `value: number` (required, default `1`)
- `history: { date?: Date; maker?: string }[]` — execution log, most recent first by convention (frontend reads `history[0].date` as the last execution).
- `description: string`
- `createdAt` / `updatedAt: Date`

Other shared types in `my-home-api/src/types/` (`ProductType`, `CartType`, `DutiesType`, `ShopHistoryType`) are a separate, legacy type set used only by the unused `controller/repo.ts` and by each other — they are not used by the active routes/controllers/repositories. `WhatsMessageType` (`{ total: number; items: string[] }`) is the one still in active use, as the return shape of `cart.controller.ts`'s `sendOrder`.

## Service / business logic layer

**API repositories** (`my-home-api/src/repository/`) — thin Mongoose wrappers, one file per resource, each exposing the same CRUD shape (`findMany`, `findOne`, `create`, `createMany`, `updateOne`, `updateMany`, `deleteOne`, `deleteMany`), plus:
- `buyers.repo.ts`: `getByCpf(cpf)` — looks up a buyer by CPF with `cart.items.product` populated.
- `cart.repo.ts`: `pushItem(id, items)` (`$push` onto `cart.items`), `pullItem(id, items)` (`$pull` — see "What NOT to do" below for a bug here).

**Frontend service layer** (`my-home-front/src/app.service.ts`) — every API call the frontend makes:
- `createBuyer(buyer)` — `POST /buyers`
- `getBuyerByCpf(cpf)` — `GET /buyers/signIn?cpf=`
- `getBuyer(id)` — `GET /buyers/:id`
- `updateCart(buyer)` — `PATCH /buyers/:id` (sends the whole buyer object; used to persist cart changes)
- `getProducts()` — `GET /products`
- `createProduct(product)` — `POST /products`
- `updateProduct(id, product)` — `PATCH /products/:id`
- `deleteProduct(id)` — `DELETE /products/:id`
- `getDuties()` — `GET /duties`
- `updateDuty(duty)` — `PATCH /duties/:id`
- `sendWhatsapp(buyer)` — builds a numbered text message from `buyer.cart.items` and opens `https://api.whatsapp.com/send?phone=...&text=...` in a new tab (client-side only, not an API call).

## API layer

REST API served by Express; see `API.md` for the full route reference. The frontend talks to it directly over HTTP via Axios (no proxy/gateway layer) using the base URL from `VITE_API_URL`. Every controller response is JSON shaped as `{ message: string, data: any }`.

## UI / pages

| Route | File | Purpose |
| --- | --- | --- |
| `/`, `/home` | `pages/home/home.tsx` | CPF/email "login" (find-or-create buyer). |
| `/products` | `pages/products/products.tsx` | List/filter products, add to cart, delete, navigate to create/edit. |
| `/create-product` | `pages/products/create/create_product.tsx` | Create or edit a product (same form, branches on whether a product was passed via route state). |
| `/cart` | `pages/cart/cart.tsx` | View cart items, adjust quantities, set store phone number, send order via WhatsApp, clear cart. |
| `/duties` | `pages/duties/duties.tsx` | List overdue duties and mark one as executed today. Reachable by URL but not linked from the nav menu. |
| `*` | `routes.tsx` (inline) | Renders a bare `<h1>404</h1>`. |

`pages/cover/cover.tsx` (tap-to-enter animated splash screen) exists but is not wired into `routes.tsx`.

## Components

`my-home-front/src/components/`, one subfolder per component, each with its own `*.module.css`:

- `menu/menu.tsx` — top nav bar, shown on every active route; reads `userId`/`qtItemCart` from `AppContext` to decide which links are enabled and to show the cart badge count.
- `alert/alert.tsx` — brief CSS-driven flash/highlight triggered by an `alertOn` boolean prop, auto-resets after 500ms.
- `check-box/check-box.tsx` — labeled checkbox, controlled internally with its own `isChecked` state, calls `onChange(checked)`.
- `dropdown/dropdown.tsx` — custom (non-native) select: click to open, list of `{ label, value }` options, calls `hSelection(item)`.
- `input-button/input-button.tsx` — text/number input paired with a button; supports `onKey` (Enter key) and `onClick` (button) handlers.
- `loading/loading.tsx` — CSS spinner shown in place of content while async calls are pending.
- `animations/animation.tsx` (`AnimatedSVG`) — rotating SVG used on the unreachable `Cover` page.
- `svg/cart-icon.tsx`, `svg/trash-icon.tsx` — inline icon components taking `color1`/`color2` props.
- `formatters/prices.ts` (`formatPrice`) — formats a number as BRL currency (`pt-BR` locale).
- `validators/cpf.ts`, `validators/email.ts` — regex-based input validators used on the login form.
- `index.tsx` — barrel re-exporting `Dropdown` and `Loading` only (other components are imported by their own path, not through this barrel).

## Conventions

- TypeScript throughout both apps; `strict: true` in both `tsconfig.json` files.
- Per-resource file naming: `<resource>.controller.ts`, `<resource>.repo.ts`, `<resource>.model.ts`, `<resource>.routes.ts`.
- Each repository file exposes the same CRUD function names (`findMany`, `findOne`, `create`, `createMany`, `updateOne`, `updateMany`, `deleteOne`, `deleteMany`) — follow this shape when adding a new resource.
- API responses always go through the shared `response()` helper; controllers always try/catch and return JSON, never throw past the controller (the one exception, `cart.controller.ts`'s `addItem`, rethrows after already entering the catch block — see below).
- Frontend: one folder per page/component, colocated `*.module.css` for CSS Modules; plain (non-module) CSS is used only in `pages/duties/duties.css`.
- Frontend interfaces in `src/models/` mirror the API's Mongoose interfaces but drop the `Document` extension and Mongoose-only fields.
- All frontend API calls are centralized in `app.service.ts` — pages do not call `axios`/`api` directly.
- Barrel files (`index.ts`/`index.tsx`) are used inconsistently — some folders (`types/`, `utils/`, `validators/`, `formatters/`) export everything through one; others (`components/`) only partially do. Match the existing pattern in the folder you're editing rather than introducing a new one.

## Environment variables

- `my-home-api` needs `DB_URI` (only honored when `NODE_ENV=production`) and optionally `PORT` (default `3000`). Without `NODE_ENV=production`, `config.ts` always points at a hardcoded local MongoDB URI regardless of `.env`.
- `my-home-front` needs `VITE_API_URL`; without it, Axios's `baseURL` is `undefined` and every API call fails.

## What NOT to do

- **Do not rely on `src/db.ts` for environment-based database selection.** It currently calls `mongoose.connect()` with a hardcoded MongoDB Atlas connection string (including a plaintext username/password) instead of using `config.db_uri` from `src/config/config.ts`. This means `DB_URI`/`NODE_ENV` currently have no effect on which database the app connects to, and a live credential is committed to the repository. This should be fixed (use `config.db_uri`) and the exposed credential should be rotated in MongoDB Atlas — do not reuse or further propagate that credential.
- Do not add authentication assumptions to new API routes unless an auth layer is actually built — today every route is unauthenticated by design (or by omission), so don't write code that assumes `req.user` or a verified session exists.
- Do not call `axios`/the API directly from a page component — add the call to `app.service.ts` and import it, matching every existing page.
- Do not assume `cart.repo.ts`'s `pullItem` removes a specific product: its `$pull` filter targets `cart.product` (a field that doesn't exist on the schema — the schema has `cart.items`) and matches with `$in` against the raw `Items[]` payload, not product ids. Treat this as a known-broken path rather than a pattern to copy.
- Do not let a controller `throw` past its own try/catch without also returning a response — `cart.controller.ts`'s `addItem` does `throw error;` before its `return response(...)` line in the catch block, which is unreachable and will surface as an unhandled rejection; don't replicate that.
- Do not introduce new global state outside `AppContext` for things like the logged-in buyer id — existing pages already read `userId`/`setUserId` from context.
