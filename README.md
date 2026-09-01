# CV Anugrah Gemilang - Backend

Backend API service for CV Anugrah Gemilang's internal water-gallon delivery management system. Express.js REST API providing customer management, transaction & debt processing, gallon stock tracking, reporting, fleet management, and audit logging — consumed by the [companion SvelteKit dashboard](../frontend-dashboard-admin-anugrahgemilang).

## Features

- 🔐 **JWT Authentication & Role-based Access Control** (Admin / Editor / Driver)
- 👥 **Customer Management** (CRUD, photo via Google Drive link, sub-region/region hierarchy)
- 💰 **Transaction & Debt Processing** — Tunai/Hutang, customer balance auto-applied, overpayment auto-credited to balance, soft-delete + restore
- 💳 **Customer Balance Management**
- 🚰 **Gallon Stock & Movement Tracking** (per-customer and global ledger with running balance)
- 🧾 **Cross-customer Debt List** (`/paymentlogs/getdebts`)
- 🚚 **Fleet Management** (Armada CRUD, guarded against deleting a fleet still referenced by transactions)
- 📊 **Dashboard Analytics** & **Custom-range Reports**
- 🔍 **Global Search**
- 📝 **Audit Logging** (every create/update/delete recorded with before/after state)

## Technology Stack

- **Framework**: Express.js
- **Database**: MySQL 8.x (connection pool via `mysql2`)
- **Authentication**: JWT (access + refresh tokens)
- **Password Hashing**: bcrypt
- **Validation**: Joi (partial) + manual validation in controllers
- **Security**: helmet, express-rate-limit (login), configurable CORS allowlist
- **Testing**: Vitest (unit tests on the financial/auth logic)
- **Process Manager (production)**: PM2
- **Date Management**: moment-timezone

## Prerequisites

- Node.js v20+
- MySQL 8.x (or MariaDB 10.4+ for local dev)
- npm

## Local Setup

1. Clone the repository and install dependencies:

```bash
git clone git@github.com:mrdfn20/cv-anugrah-admin-backend.git
cd cv-anugrah-admin-backend
npm install
```

2. Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=db_cv_anugrah_gemilang_dev
JWT_SECRET=          # generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_REFRESH_SECRET=
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

> ⚠️ Env var names use the `DB_` prefix (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) rather than bare `HOST`/`USER`/`PASSWORD` — generic names like `USER` risk colliding with variables the OS/hosting platform sets on its own.

3. Create the database and import the schema (ask a maintainer for the current `schema.sql`, or export one from an existing environment with `mysqldump --no-data`).

4. Start the dev server (auto-restarts on file changes):

```bash
npm run start-dev
```

## Testing

```bash
npm test          # run once
npm run test:watch  # watch mode
```

30 Vitest unit tests cover the highest-risk logic — the financial services (`addTransaction`, `payDebt`, `customerBalanceService`), the DB transaction helper (commit/rollback behavior), and the auth/role middleware. Models are mocked; these are not full DB integration tests.

## API Endpoints

All routes are prefixed with `/api`. Endpoints marked 🔒 require a valid JWT (`Authorization: Bearer <token>`); role restrictions are noted where relevant.

### Authentication (`/auth`)

- `POST /auth/register` 🔒 Admin — register a new user
- `POST /auth/login` — login (rate-limited)
- `POST /auth/refresh-token` — refresh access token
- `GET /auth/verify` 🔒 — verify current token
- `POST /auth/logout` — logout

### Customers (`/customers`)

- `GET /customers` 🔒 · `GET /customers/:id` 🔒 · `POST /customers` 🔒 · `PUT /customers/:id` 🔒 · `DELETE /customers/:id` 🔒 Admin

### Transactions (`/transactions`)

- `GET /transactions` 🔒 — all transactions
- `GET /transactions/filter` 🔒 — filter by customer/sub-region/date range/sort. Optional `page`/`limit` for server-side pagination (returns `{ data, meta.pagination }`); omit both to get the full unpaginated result (used by Reports).
- `GET /transactions/deleted` 🔒 — soft-deleted transactions (for restore UI)
- `GET /transactions/:id` 🔒 · `GET /transactions/customer/:id` 🔒
- `POST /transactions` 🔒 — create (Tunai auto-settles; Hutang applies customer balance first, then any overpayment is credited back to balance). Runs inside a DB transaction — if any step fails, everything rolls back.
- `DELETE /transactions/:id` 🔒 — soft delete (Editor limited to within 60 minutes of creation)
- `PUT /transactions/restore/:id` 🔒 — restore a soft-deleted transaction

### Payment Logs & Debts (`/paymentlogs`)

- `GET /paymentlogs` 🔒 · `GET /paymentlogs/:id` 🔒 · `GET /paymentlogs/transaction/:id` 🔒
- `GET /paymentlogs/getdebts` 🔒 — cross-customer debt list. Filters: `customer_id`, `customer_name`, `startDate`/`endDate`, `status` (`Lunas`/`Belum Lunas`), `sortBy` (`transaction_date`/`remaining_debt`), `sortOrder`. Optional `page`/`limit` for pagination.
- `POST /paymentlogs` 🔒 · `POST /paymentlogs/paydebt` 🔒 — record a debt payment (also runs inside a DB transaction)

### Customer Balance (`/customerbalance`)

- `GET /customerbalance` 🔒 · `GET /customerbalance/:id` 🔒 · `POST /customerbalance` 🔒 · `PUT /customerbalance` 🔒 (adds to existing balance, not a hard set)

### Gallon (`/gallon`, `/gallonmovements`)

- `GET /gallon/stock` 🔒 · `GET /gallon/stock/:customer_id` 🔒 · `GET /gallon/stock/filter` 🔒 · `GET /gallon/price/:customer_id` 🔒
- `GET /gallonmovements` 🔒 — global movement ledger (running balance per customer); accepts `search`/`page`/`limit` — omit `page`/`limit` for the full unpaginated list
- `GET /gallonmovements/:customer_id` 🔒 — per-customer history

### Fleet / Armada (`/armadas`)

- `GET /armadas` 🔒 (Admin/Editor/Driver) · `POST /armadas` 🔒 Admin · `PUT /armadas/:id` 🔒 Admin · `DELETE /armadas/:id` 🔒 Admin (rejected with 409 if the fleet is still referenced by any transaction)

### Reports (`/reports`)

- `GET /reports/summary?startDate=&endDate=` 🔒 Admin/Editor — aggregate income/sales/debt for a custom date range (same income definition as the dashboard)

### Dashboard (`/dashboard`)

- `GET /dashboard/summary` 🔒 · `/income-summary` 🔒 · `/gallon-summary` 🔒 · `/active-customers` 🔒 · `/debt-status` 🔒 · `/today-activity` 🔒

### Search (`/search`)

- `GET /search` 🔒 — global search across customers/transactions/debts

### User Management (`/user`)

- `GET /user` 🔒 Admin · `DELETE /user` 🔒 Admin

### Audit Logs (`/auditlogs`)

- `GET /auditlogs` 🔒 Admin — accepts `search` (matches username/role/action/endpoint) and `page`/`limit`; omit both for the full unpaginated list

## Project Structure

```
src/
├── config/           # db.js - MySQL connection pool
├── controllers/      # Request handlers (validation + calling services + responseHelper)
├── helpers/          # responseHelper (response envelope), logHelper (audit log), dbTransactionHelper (withTransaction)
│   └── __tests__/
├── middlewares/       # authMiddleware, roleMiddleware, rateLimiterMiddleware
│   └── __tests__/
├── models/           # Raw SQL queries (mysql2)
├── routes/           # Express routers
├── services/         # Business logic (orchestrates models, wraps multi-step writes in withTransaction)
│   └── __tests__/
├── validators/       # Joi schemas (partial coverage)
└── server.js         # App entry point
```

## Architecture Notes

- **MVC-style layering**: routes → controllers (validation + HTTP concerns) → services (business logic) → models (SQL). Controllers use `helpers/responseHelper.js` for a consistent `{ success, message, data, meta? }` / `{ success: false, message, error }` envelope.
- **DB connection pool** (`src/config/db.js`), not a single connection — survives concurrent requests without one slow query blocking everything else.
- **Multi-step financial writes are atomic**: `addTransaction` and `payDebt` run their balance-adjust / insert-transaction / insert-payment-log / credit-overpayment sequence inside `helpers/dbTransactionHelper.js`'s `withTransaction()` — if any step throws, everything rolls back. Audit logging happens *after* a successful commit, deliberately outside the transaction (a failed audit-log write should never roll back money that was actually recorded).
- **Server-side pagination is opt-in per endpoint**: passing `page`/`limit` triggers `LIMIT`/`OFFSET` + a `COUNT(*)` and returns `meta.pagination`; omitting them returns the full result exactly as before (kept for the Reports page, which needs an entire date range at once). `LIMIT`/`OFFSET` values are interpolated directly rather than via `?` placeholders — `mysql2`'s prepared-statement binding for these two is inconsistent across MySQL versions (worked on local MariaDB, failed on production MySQL 8.4 with `ER_WRONG_ARGUMENTS`); the values are validated integers via `parseInt` + `Math.max` beforehand, so this is safe.

## Authentication & Authorization

JWT in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Three roles: `Admin` (full access), `Editor` (most write access, time-limited deletes), `Driver` (read-only on a subset of endpoints).

## Deployment

Backend and frontend are deployed together on a single VPS, behind nginx, managed by PM2. Two environments exist side by side on the same server:

| | Production | Staging |
|---|---|---|
| Branch | `main` | `develop` |
| Port (internal) | 5000 | 5001 |
| Public URL | `:80` via nginx | `:8080` via nginx |
| Database | `cv_anugrah_gemilang_prod` | `cv_anugrah_gemilang_staging` (separate DB + DB user) |
| PM2 process | `cv-anugrah-backend` | `cv-anugrah-backend-staging` |

nginx reverse-proxies `/api/*` to this backend and everything else to the frontend's Node server on the same origin — frontend calls the API via a relative `/api` path, so there's no cross-origin request in production and `ALLOWED_ORIGINS` mainly matters for local dev.

### CI/CD

`.github/workflows/deploy-production.yml` and `deploy-staging.yml` run on every push to `main`/`develop` respectively: `npm test` gates the deploy, then `appleboy/ssh-action` pulls the new code on the VPS, reinstalls dependencies, and restarts the matching PM2 process.

> **Push `main` and `develop` as two separate commands**, not `git push origin main develop` in one — a combined multi-branch push has been observed to only trigger the GitHub Actions workflow for one of the two refs.

### Manual server operations (if ever needed)

```bash
ssh <user>@<vps-host>
cd ~/apps/backend            # or backend-staging
git pull origin main         # or develop
npm install --omit=dev
pm2 restart cv-anugrah-backend   # or cv-anugrah-backend-staging
pm2 logs cv-anugrah-backend      # tail logs
```

## Error Handling

Consistent error envelope:

```json
{
  "success": false,
  "message": "Human-readable message",
  "error": { "code": "ERROR_CODE", "details": "..." }
}
```

## Audit Logging

Every create/update/delete is recorded in `audit_logs`: user ID & role, action, endpoint, request data, previous data (for updates/deletes), IP address, timestamp. Viewable via `GET /auditlogs` (Admin only).
