# API.md

Reference for the `my-home-api` HTTP API consumed by `my-home-front`.

## Overview

`my-home-api` is a REST API built with Express and Mongoose (MongoDB). There is no authentication mechanism on any route — no API key, session cookie, or bearer token is checked anywhere in the codebase (`src/routes/`, `src/controller/`). All routes below are publicly callable by anyone who can reach the server.

CORS is restricted in `src/app.ts` to two origins: `http://localhost:5173` and `https://my-home-front.vercel.app`.

Every controller response is JSON with the shape:

```json
{ "message": "string", "data": "any" }
```

`data` is typically a Mongoose document, an array of documents, or `null`/an error object on failure. On unexpected errors, controllers return HTTP `500` with `message: "Error"` and `data` set to the caught error object (see `src/types/response-body.type.ts` for the `response()` helper used everywhere).

## Base URL / configuration

- The server listens on `process.env.PORT`, defaulting to `3000` (`src/server.ts`).
- There is no API versioning or path prefix — resource routers are mounted directly at the root (`src/routes/routes.ts`): `/products`, `/buyers`, `/cart`, `/duties`, `/categories`, `/makers`.
- The frontend points at this server via the `VITE_API_URL` environment variable (`my-home-front/src/service/api.ts`).
- `GET /` (defined directly in `app.ts`, outside the resource routers) returns a plain text string and is not part of the resource API.

## Internal routes

### Products — `src/routes/products.routes.ts` / `src/controller/products.controller.ts`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/products` | List products. |
| GET | `/products/create-many` | Bulk-insert the hardcoded seed catalog from `src/models/products.ts` (~50 grocery items). Intended as a one-off seeding endpoint, not a real query route. |
| POST | `/products` | Create a product. |
| GET | `/products/:id` | Get a product by id. |
| PATCH | `/products/:id` | Update a product by id. |
| PATCH | `/products` | Bulk-update products matching a query. |
| DELETE | `/products/:id` | Delete a product by id. |
| DELETE | `/products` | Bulk-delete products matching a query. |

Details:
- `GET /products`, `PATCH /products`, `DELETE /products` all pass `req.query` straight through to Mongoose's `find`/`updateMany`/`deleteMany` as the filter — there is no schema validation on the query shape.
- `POST /products` / `PATCH /products/:id` body: a `IProducts`-shaped object (see Data schemas below); not all fields are required by the route handler itself (Mongoose schema validation still applies: `name`, `unit`, `price` are required).
- Responses: `200` with the product/array on success; `404` with `{ message: "Product(s) not found" }` when a lookup/update/delete affecting a missing id returns falsy; `500` with `{ message: "Error", data: error }` on exceptions.

### Buyers — `src/routes/buyers.routes.ts` / `src/controller/buyers.controller.ts`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/buyers/signIn` | "Sign in": find a buyer by CPF. Query param `cpf` (string, required). Returns `201` with `message: "Buyer not found"` if no match, `200` with the buyer (cart populated) if found. |
| GET | `/buyers/create-many` | Bulk-create buyers from the request body. |
| POST | `/buyers` | "Sign up": create a buyer. Body: `{ cpf: string, marketPhone?: string, cart?: Cart }`. |
| GET | `/buyers/:id` | Get a buyer by id (cart populated). |
| PATCH | `/buyers/:id` | Update a buyer by id (cart populated in the response); used by the frontend to persist cart changes and the store phone number. |
| PATCH | `/buyers` | Bulk-update buyers matching a query. |
| DELETE | `/buyers/:id` | Delete a buyer by id. |
| DELETE | `/buyers` | Bulk-delete buyers matching a query. |

Details:
- `getByCpf`/`findOne`/`findMany`/`updateOne` in `buyers.repo.ts` all populate `cart.items.product`, so buyer responses embed full product documents inside `cart.items[].product`, not just ids.
- Responses follow the same `{ message, data }` / status-code pattern as Products.

### Cart — `src/routes/cart.routes.ts` / `src/controller/cart.controller.ts`

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/cart/add/:id` | Push items onto a buyer's cart. `:id` is the buyer id. Body: `Items[]` (array of `{ product: IProducts, qt: number }`). |
| POST | `/cart/remove/:id` | Remove items from a buyer's cart. `:id` is the buyer id. Body: `{ productIds: ... }`. |
| GET | `/cart/send/:id` | Build an order summary (total + formatted item lines) for a buyer's cart. `:id` is the buyer id. Returns `200` with `{ message: "Order sended", data: { total: number, items: string[] } }`, or `404` if the buyer is not found. |

Known issues (do not treat as reference behavior — see `CLAUDE.md` "What NOT to do"):
- `POST /cart/add/:id` rethrows the caught error before reaching its own `return response(...)` line in the catch block, so on failure it will surface as an unhandled exception rather than a clean `500` JSON response.
- `cart.repo.ts`'s `pullItem` (used by `POST /cart/remove/:id`) issues `$pull: { "cart.product": { $in: data } }`, but the schema field is `cart.items`, not `cart.product`, and `data` is the raw `Items[]` payload rather than a list of ids — this route does not reliably remove anything.
- In practice, the frontend does not call `POST /cart/add` or `POST /cart/remove`; it mutates the buyer's cart client-side and persists the whole buyer via `PATCH /buyers/:id` instead.

### Duties — `src/routes/duties.routes.ts` / `src/controller/duties.controller.ts`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/duties` | List duties. |
| POST | `/duties/create` | Create a duty. Body: `IDuties`-shaped object. |
| GET | `/duties/:id` | Get a duty by id. |
| PATCH | `/duties/:id` | Update a duty by id. Used by the frontend to append a new `history` entry when a duty is marked done, to pause/unpause, and to edit. |
| PATCH | `/duties` | Bulk-update duties matching a query. |
| DELETE | `/duties/:id` | Delete a duty by id. |
| DELETE | `/duties` | Bulk-delete duties matching a query. |

`GET /duties` passes `req.query` straight through to Mongoose's `find`, so the frontend scopes the list per user and filters with query params: `createdByUserId` (owner buyer id), `category` (category id), `status` (`active` | `paused`), and `makers` (a maker id — matches duties whose `makers` array contains it).

### Categories — `src/routes/categories.routes.ts` / `src/controller/categories.controller.ts`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/categories` | List categories. Scoped per user via `?createdByUserId=<id>`. |
| POST | `/categories/create` | Create a category. Body: `{ name: string, createdByUserId?: string }`. |
| GET | `/categories/:id` | Get a category by id. |
| PATCH | `/categories/:id` | Update a category by id. |
| PATCH | `/categories` | Bulk-update categories matching a query. |
| DELETE | `/categories/:id` | Delete a category by id. **Cascades**: clears `category` on any duty that referenced it (`Duty.updateMany({ category: id }, { category: "" })`). |
| DELETE | `/categories` | Bulk-delete categories matching a query. |

### Makers — `src/routes/makers.routes.ts` / `src/controller/makers.controller.ts`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/makers` | List makers. Scoped per user via `?createdByUserId=<id>`. |
| POST | `/makers/create` | Create a maker. Body: `{ name: string, createdByUserId?: string }`. |
| GET | `/makers/:id` | Get a maker by id. |
| PATCH | `/makers/:id` | Update a maker by id. |
| PATCH | `/makers` | Bulk-update makers matching a query. |
| DELETE | `/makers/:id` | Delete a maker by id. **Cascades**: pulls its id from every duty's `makers` array (`Duty.updateMany({ makers: id }, { $pull: { makers: id } })`). |
| DELETE | `/makers` | Bulk-delete makers matching a query. |

### Search — `src/routes/search.routes.ts` / `src/controller/search.controller.ts`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/search/products` | Search the web for products via SerpAPI's Google Shopping engine (Brazilian Google, prices in BRL). Query params: `q` (product name, required), `brand` (optional), `size` (optional), `page` (default `1`), `limit` (default `10`, max `50`). |

Details:
- Returns `data` shaped as `{ results: { name, price, image, badge?, size?, unit?, category? }[], page: number, hasMore: boolean }`. `price` is a number (BRL), `image` is a thumbnail URL.
- Requires the `SEARCH_API_KEY` environment variable (a [SerpAPI](https://serpapi.com) API key — the free tier allows 100 searches/month). Without it the route returns `503` with `message: "Search is not configured (missing SEARCH_API_KEY)"`.
- `400` when `q` is missing; `500` with `{ message: "Error" }` when the provider call fails.
- Paging is done server-side by slicing the provider's single result set, so each `page` request costs one SerpAPI search.

## External / backend endpoints consumed

`my-home-api` calls one external service: SerpAPI (`https://serpapi.com/search.json`, `engine=google_shopping`) from `src/repository/search.repo.ts`, to back `GET /search/products`. The key is read from `SEARCH_API_KEY`; no other backend service is called.

`my-home-front` calls only `my-home-api` over HTTP for data. The one external integration is client-side, not an API call: `app.service.ts`'s `sendWhatsapp()` opens `https://api.whatsapp.com/send?phone={marketPhone}&text={message}` in a new browser tab to hand off the formatted shopping list to WhatsApp; this is a navigation, not a fetch/axios request, and expects no response.

## Data schemas

Defined as Mongoose schemas + TypeScript interfaces in `my-home-api/src/models/` (and mirrored as plain interfaces, without the `Document` extension, in `my-home-front/src/models/`).

**`IProducts`** (`models/products.model.ts`)
```ts
{
  createdByUserId: string;
  name: string;          // required
  unit: string;          // required, enum: "kg" | "un"
  badge: string;
  size: string;
  price: number;         // required
  characteristic: string;
  description: string;
  image: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**`IBuyer`** (`models/buyer.model.ts`)
```ts
{
  cpf: string;            // required, unique
  marketPhone?: string;
  cart?: {
    status: string;
    items: { product: IProducts; qt: number }[];  // product is a populated ref to "Products"
  };
}
```

**`IDuties`** (`models/duties.model.ts`)
```ts
{
  cod: string;            // required, unique
  name: string;           // required
  frequency: number;      // required — expected days between executions
  value: number;          // required, default 1
  history: { date?: Date; maker?: string }[];
  description: string;
  createdByUserId?: string; // owner buyer id — scopes the list per user
  category?: string;        // category id
  makers?: string[];        // maker ids, default []
  status?: string;          // enum: "active" | "paused", default "active"
  createdAt?: Date;
  updatedAt?: Date;
}
```

**`ICategory`** (`models/categories.model.ts`)
```ts
{
  name: string;             // required
  createdByUserId?: string; // owner buyer id — scopes the list per user
  createdAt?: Date;
  updatedAt?: Date;
}
```

**`IMaker`** (`models/makers.model.ts`)
```ts
{
  name: string;             // required
  createdByUserId?: string; // owner buyer id — scopes the list per user
  createdAt?: Date;
  updatedAt?: Date;
}
```

**`response` body type** (`types/response-body.type.ts`) — the shape of every API response:
```ts
{ message: string; data: any }
```

**`WhatsMessageType`** (`types/whatsapp-message.type.ts`) — the `data` shape returned by `GET /cart/send/:id`:
```ts
{ total: number; items: string[] }
```

The following types exist under `src/types/` but are only used by each other and by the unused `src/controller/repo.ts` module (not by any active route, controller, or repository): `ProductType`, `CartType`, `DutiesType`, `ShopHistoryType`.
