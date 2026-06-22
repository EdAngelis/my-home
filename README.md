# My Home

My Home is a personal grocery-shopping organizer. It lets a user catalog products, build a shopping list (cart), and send that list to a grocery store over WhatsApp. It also tracks recurring household duties (chores) and when they were last done. The project is split into two independent applications kept in this repository as sibling folders:

- `my-home-api` — the backend REST API (Node.js, Express, MongoDB).
- `my-home-front` — the frontend single-page app (React, Vite).

Each app has its own `package.json`, dependencies, and `.env` file, and each can be run and deployed independently.

## Tech stack

**`my-home-api`**
- Node.js, TypeScript
- Express 4 (HTTP server, routing)
- Mongoose 7 (MongoDB ODM)
- Winston (logging), Chalk (colored console output), Morgan (HTTP request logging)
- ts-node-dev (dev server with auto-restart)

**`my-home-front`**
- React 18, TypeScript
- Vite 4 (build tool / dev server) with `@vitejs/plugin-react-swc`
- React Router DOM 6 (client-side routing)
- Axios (HTTP client)
- React Hook Form (form state/validation)
- MUI (`@mui/material`, `@mui/icons-material`) and Emotion (used on the Duties page)
- CSS Modules for component-scoped styling

## Prerequisites

- Node.js and npm (no specific version is pinned in either `package.json`)
- A MongoDB database (local instance or MongoDB Atlas) for `my-home-api`

## Environment variables

**`my-home-api`** (`.env`, see `.env.example`)

| Variable | Required | Description |
| --- | --- | --- |
| `DB_URI` | Required in production mode | MongoDB connection string. Only read when `NODE_ENV=production` (see `src/config/config.ts`). |
| `NODE_ENV` | Optional | Set to `production` to use `DB_URI` from `.env`. When unset, the app falls back to a hardcoded local development URI in `src/config/config.ts`. |
| `PORT` | Optional | Port the Express server listens on. Defaults to `3000` (`src/server.ts`). |

Note: `src/db.ts` currently connects to a hardcoded MongoDB Atlas connection string instead of using `config.db_uri`. See `CLAUDE.md` for details — this should be fixed before relying on `DB_URI`/`config.ts` to control which database is used.

**`my-home-front`** (`.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Required | Base URL of the `my-home-api` server that the frontend calls (e.g. `http://localhost:3000`). |

## Installation

```
cd my-home-api
npm install

cd ../my-home-front
npm install
```

## Running locally

**API** (from `my-home-api`):

```
npm run dev
```

Starts the server with `ts-node-dev` (auto-restart on file changes), reading the port from `PORT` (default `3000`).

**Frontend** (from `my-home-front`):

```
npm run dev
```

Starts the Vite dev server (default `http://localhost:5173`). The frontend calls the API at the URL configured in `VITE_API_URL`.

## Building for production

**API**:

```
npm run start
```

Runs `tsc` to compile `src/` to `dist/`, then starts the server with `node dist/server.js`.

**Frontend**:

```
npm run build
```

Runs `tsc` then `vite build`, producing static assets. `npm run preview` serves the built output locally. The frontend is configured for deployment on Vercel (`vercel.json` rewrites all paths to `/` for SPA routing).

## Project structure

```
my-home/
├── my-home-api/         Backend REST API
│   └── src/
│       ├── app.ts            Express app setup (CORS, middleware, routes)
│       ├── server.ts         Entry point: connects to DB and starts the HTTP server
│       ├── config/           Environment-based config (db_uri)
│       ├── controller/       Request handlers per resource
│       ├── repository/       Mongoose data-access functions per resource
│       ├── models/           Mongoose schemas/models and TS interfaces
│       ├── routes/           Express routers per resource
│       ├── types/            Shared TypeScript types
│       ├── tools/             Logging (winston) and console coloring (chalk)
│       └── utils/            Small helpers (date diff, Mongo URI inspection)
└── my-home-front/       Frontend SPA
    └── src/
        ├── main.tsx           React entry point
        ├── App.tsx            Root component (providers + router)
        ├── routes.tsx         Route table
        ├── context.tsx        Global app state (React Context)
        ├── service/api.ts     Axios instance
        ├── app.service.ts     Functions that call the API
        ├── models/            Frontend TypeScript interfaces mirroring the API
        ├── pages/             Top-level views (home, products, cart, duties)
        ├── components/        Reusable UI building blocks
        └── shared/            Small cross-cutting helpers
```

## Key flows

- **Login / sign-up**: a user enters a CPF or email on the home page; the app looks up a buyer by CPF and creates one on the fly if none exists, storing the buyer id in app state.
- **Manage products**: browse the product catalog, filter by name, create or edit a product, and delete products.
- **Build and send a shopping list**: add products to a cart, adjust quantities, set the destination store's phone number, and send the formatted list to the store via a WhatsApp deep link.
- **Track recurring duties**: view household duties that are overdue based on their frequency and last execution date, and mark a duty as done.
