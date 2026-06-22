# FRONT.md

Reference for the `my-home-front` SPA.

## Routing

Routing is config-based using React Router DOM's `useRoutes` hook, not file-based. The full route table lives in `src/routes.tsx` and is rendered inside a `BrowserRouter` from `src/App.tsx`.

| Path | Element | Notes |
| --- | --- | --- |
| `/` (index) | `<Menu /><Home />` | |
| `/home` | `<Menu /><Home />` | Same component as `/`. |
| `/products` | `<Menu /><Products />` | |
| `/cart` | `<Menu /><Cart />` | |
| `/duties` | `<Menu /><Duties />` | Reachable by direct URL; not linked from the nav menu (the link is commented out in `menu.tsx`). |
| `/create-product` | `<Menu /><CreateProduct />` | Also used for editing — see Pages below. |
| `*` | `<h1>404</h1>` | No menu on the 404 page. |

`src/pages/cover/cover.tsx` (an animated tap-to-enter splash screen) is not included in this route table and is currently unreachable.

## Layouts

There is no dedicated layout component/file. Every route except the `*` 404 route composes `<Menu />` directly alongside its page element in `routes.tsx` (e.g. `<><Menu /><Home /></>`), so the nav bar is effectively the layout, repeated per route rather than wrapping children via nested routes. `Menu` does render an `<Outlet />` (the React Router primitive for nested-route children), but since `routes.tsx` never nests a route under `Menu`, that outlet currently has no effect.

## Pages

**Home — `/`, `/home`** (`src/pages/home/home.tsx`)
- User action: enter a CPF or email and press Enter to "log in".
- Local state: `cpf`, `loading`, `error`.
- Calls: `getBuyerByCpf(cpf)`; if no buyer is found, `createBuyer({ cpf })`.
- Auth requirement: public (this *is* the login page).
- On success, sets `userId` in `AppContext` and navigates to `/products`.

**Products — `/products`** (`src/pages/products/products.tsx`)
- User action: browse/filter the catalog by name, toggle "only my products", open a product to edit, delete a product, add a product to the cart.
- Local state: `products`, `buyer`, `alertOn`, `userProductsOnly`, `filteredProducts`.
- Calls: `getProducts()`, `getBuyer(userId)`, `updateCart(buyer)` (when adding an item), `deleteProduct(id)`.
- Auth requirement: effectively requires `userId` — if it's empty, the page redirects to `/` on mount (no server-side enforcement).

**Create/Edit Product — `/create-product`** (`src/pages/products/create/create_product.tsx`)
- User action: fill out name, brand ("Marca"), price, unit (`kg`/`un` via `Dropdown`), and size (only shown for `un`); submit to create or update.
- Local state: `unitKg`, `loading`; form state via `react-hook-form` (`register`, `handleSubmit`, `setValue`, `reset`).
- Mode: determined by `useLocation().state` — if a product object was passed via navigation state, the form pre-fills and submits go to `updateProduct`; otherwise it creates a new product with `createdByUserId` set to the current `userId`.
- Calls: `createProduct(product)` or `updateProduct(id, product)`.
- Auth requirement: implicitly needs `userId` (only meaningful when reached from `/products`), not enforced by the route itself.

**Cart — `/cart`** (`src/pages/cart/cart.tsx`)
- User action: view cart items, increment/decrement quantity per item, set/edit the destination store phone number, send the order via WhatsApp, clear the cart.
- Local state: `buyer`, `total`, `alertOn`.
- Calls: `getBuyer(userId)` on mount; `updateCart(buyer)` whenever quantities, phone number, or a cleared cart need to be persisted; `sendWhatsapp(buyer)` to hand off to WhatsApp.
- Auth requirement: implicitly needs `userId`; not enforced by the route itself.

**Duties — `/duties`** (`src/pages/duties/duties.tsx`)
- User action: view duties that are currently overdue (based on `frequency` vs. days since last execution) and mark one as done.
- Local state: `pendents` (the filtered, overdue subset of duties).
- Calls: `getDuties()` on mount; `updateDuty(duty)` after pushing a new entry onto `duty.history` to mark it executed today.
- Auth requirement: none — does not read `userId` at all.
- Uses MUI (`Grid`, `PlayCircleFilledIcon`, `AddCircleIcon`) instead of the project's custom component set; the "add" icon (`AddCircleIcon`) is rendered but has no click handler.

## Component system

`src/components/`, one folder per component with a colocated `*.module.css` (except where noted). Not all are re-exported from a barrel — `src/components/index.tsx` only re-exports `Dropdown` and `Loading`; the rest are imported from their own file paths.

| Component | Location | Purpose | Key props |
| --- | --- | --- | --- |
| `Menu` | `menu/menu.tsx` | Top nav bar; cart badge count and link enablement driven by `AppContext`. | none (reads context) |
| `Alert` | `alert/alert.tsx` | Brief CSS flash/highlight effect, auto-clears after 500ms. | `alertOn: boolean`, `setAlertOn` |
| `CheckBox` | `check-box/check-box.tsx` | Labeled checkbox with its own internal checked state. | `label: string`, `checked: boolean` (unused as a controlled value — internal state drives the UI), `onChange(checked)` |
| `Dropdown` | `dropdown/dropdown.tsx` | Custom (non-native) single-select dropdown. | `title: string`, `options: { label, value }[]`, `hSelection?(item)` |
| `InputButton` | `input-button/input-button.tsx` | Text/number input paired with an action button. | `label`, `value`, `onClick()`, `onKey?(value)` (Enter key), `placeholder?`, `description?` |
| `Loading` | `loading/loading.tsx` | CSS spinner shown while data is loading. | none |
| `AnimatedSVG` | `animations/animation.tsx` | Rotating SVG used by the (unreachable) `Cover` page. | `width: number`, `height: number` |
| `CartIcon`, `TrashIcon` | `svg/cart-icon.tsx`, `svg/trash-icon.tsx` | Inline SVG icons. | `color1: string`, `color2?: string` |

## Styling

CSS Modules (`*.module.css`) scoped per component/page is the default approach across the app (`vite-env.d.ts` declares the module typings). One exception: `pages/duties/duties.css` is a plain (non-module) stylesheet, with class names referenced directly as strings (e.g. `className="duties"`).

Global styles live in `index.css` (loaded from `index.html`): sets the `Roboto` font (loaded from Google Fonts) on `*`, and a page background color (`#FFFAF8`) on `html`/`body`. There is no design-token/theme system (no CSS variables, no MUI `ThemeProvider`) — colors and sizes are hardcoded per component, including the icon `color1`/`color2` props passed inline at each call site.

## State management

State is local component state (`useState`) plus a single global React Context — there is no Redux/Zustand/MobX.

`AppContext` (`src/context.tsx`):
```ts
{
  userId: string;        // current buyer id, "" when logged out
  setUserId;
  qtItemCart: number;    // cart item count shown as a badge in Menu
  setQtItemCart;
}
```
It is provided once at the root in `App.tsx` (`AppProvider`) and consumed via `useContext(AppContext)` in `Home`, `Menu`, `Products`, `Cart`, and `CreateProduct`.

## Authentication on the client

There is no token/session-based auth. "Being logged in" means `AppContext.userId` is a non-empty buyer id, set after the CPF/email lookup-or-create flow on the Home page. Because it lives only in React state, it is lost on every full page reload. Pages that require a buyer (`Products`, `Cart`, `CreateProduct`) read `userId` from context; `Products` explicitly redirects to `/` if `userId` is empty, but `Cart` and `CreateProduct` do not guard against an empty `userId` themselves. There is no route-wrapper/HOC pattern (e.g. a `<ProtectedRoute>`) — each page does its own ad hoc check.

## Forms

`react-hook-form` is used in exactly one place: `pages/products/create/create_product.tsx`, via `register`/`handleSubmit`/`setValue`/`reset`. There is no schema-based validation (no Zod/Yup resolver) — fields are registered without validation rules, and the only "validation" in the app is the regex-based CPF/email check on the Home page (`components/validators/cpf.ts`, `email.ts`), invoked manually in the `onKeyDown` handler rather than through a form library.

## Navigation

Programmatic navigation uses `useNavigate()` from React Router throughout (`Home`, `Cover`, `Products`, `CreateProduct`). `Products` passes the clicked product as route state (`navigate(path, { state: params })`) when going to `/create-product`, and `CreateProduct` reads it back via `useLocation().state` to decide whether it's creating or editing. There are no URL path/query params used for navigation state in this app (e.g. no `/products/:id` frontend route) — ids are passed via route state or kept in component/context state instead.

## Loading and error states

There is no Suspense, error boundary, or toast/notification system. Each page that makes an async call on mount manages its own `loading: boolean` and swaps in the shared `Loading` spinner component while true (`Home`, `CreateProduct`); `Products` and `Cart` do not show a loading state for their initial fetch. Errors are handled inline with `try/catch` and `console.log(error)` in the catch block — the only user-visible error feedback in the app is the CPF/email format message on the Home page (`error` boolean -> inline `<p>` text). The `Alert` component is not used for errors; it is used as a generic success/flash indicator after cart/phone updates.

## Utilities

- `src/components/formatters/prices.ts` — `formatPrice(price: number): string`, formats a number as Brazilian Real currency using `Intl`/`toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`. Used in `Products` to render prices.
- `src/components/validators/cpf.ts` — `cpfValidator(cpf: string): boolean`, a permissive regex check (rejects repeated-digit strings, non-digit characters, and inputs outside 1–11 digits) — note it does not implement the real Brazilian CPF check-digit algorithm despite the name.
- `src/components/validators/email.ts` — `EmailValidator(email: string): boolean`, basic regex email format check.
- `src/shared/dates-interval.ts` — `dateDifference(firstDate, secondDate, inDays = true): number`, absolute difference between two dates, in days by default or milliseconds if `inDays` is `false`. Used by `Duties` to compute days since a duty's last execution. (This duplicates `my-home-api/src/utils/dates-diference.ts`, which is functionally identical but lives only on the API side and is not currently used by any API route.)
