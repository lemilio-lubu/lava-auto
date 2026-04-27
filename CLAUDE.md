# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# CLAUDE.md — Body Shop

## Project Overview

Full-stack car wash management platform. Frontend: Next.js 16 (App Router) + React 19 + TypeScript 5. Backend: Express.js 4 (modular monolith) + PostgreSQL + Socket.IO. Roles: ADMIN, CLIENT, WASHER.

---

## Architecture Map

```
lava-auto/
├── src/                    # Next.js frontend
│   ├── app/                # App Router pages (server components by default)
│   ├── components/         # Feature + UI components
│   ├── contexts/           # AuthContext, ThemeContext
│   ├── hooks/              # useApi, useModal, domain hooks
│   └── lib/                # api-client.ts, validations (Zod)
│
├── backend/src/
│   ├── config/             # env.js, db.js, constants.js
│   ├── database/           # schema.sql, pool
│   ├── middleware/         # auth, error-handler, rate-limiter
│   ├── modules/            # auth | vehicles | reservations | payments | notifications
│   └── shared/             # BaseRepository, idGenerator
│
└── microservices/          # Legacy — do not touch unless migrating
```

---

## Development Commands

```bash
# ── Docker (todo en uno) ──────────────────────────────────────────
cd backend
docker-compose -f docker-compose.dev.yml up -d --build   # levanta postgres + backend + frontend
docker-compose -f docker-compose.dev.yml down             # detener todo
docker-compose -f docker-compose.dev.yml logs -f          # ver logs en vivo

# ── Manual (3 terminales) ────────────────────────────────────────
cd backend && npm run db:up    # PostgreSQL en Docker (puerto 5433)
cd backend && npm run dev      # Backend Express (puerto 4004)
npm run dev                    # Frontend Next.js (puerto 3000, raíz)

# ── Base de datos ─────────────────────────────────────────────────
cd backend && npm run migrate          # Crear/actualizar tablas
cd backend && npm run seed             # Usuarios de prueba
cd backend && npm run import:clients   # Importar clientes desde Excel CRM
cd backend && npm run import:clients:dry  # Dry-run (solo muestra, no inserta)
cd backend && node scripts/migrate_client_fields.js  # Migración campos CRM

# ── Lint ──────────────────────────────────────────────────────────
npm run lint                   # Frontend
cd backend && npm run lint     # Backend
```

### URLs locales

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:4004 |
| Swagger | http://localhost:4004/api-docs |
| PostgreSQL (DBeaver) | localhost:**5433** — user: postgres / pass: postgres |

### Usuarios de prueba (seed)

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@lavauto.com | admin123 |
| Cliente | cliente@test.com | client123 |
| Lavador | lavador@test.com | washer123 |

> La contraseña de clientes importados desde el Excel = primeros 6 dígitos de su cédula.

---

## TypeScript & JavaScript Guidelines

### Do
- Enable and respect strict TypeScript (`strict: true` in tsconfig).
- Define interfaces/types for all API response shapes in `src/lib/` or co-located with the hook.
- Use Zod schemas for all user-facing inputs (forms, API boundaries).
- Prefer `const` over `let`; never use `var`.
- Use named exports; avoid default exports except for Next.js pages/layouts.
- Use optional chaining (`?.`) and nullish coalescing (`??`) over manual null checks.
- Use `as const` for literal objects/arrays that should not be widened.

### Avoid (Code Smells)
- **Type `any`** — replace with `unknown` and narrow, or define a proper type.
- **Non-null assertions (`!`)** without a guarding condition.
- **Magic strings/numbers** — define constants in `backend/src/config/constants.js` or a `src/lib/constants.ts`.
- **Deep nesting** (> 3 levels) — extract early returns or helper functions.
- **Long functions** (> 40 lines) — split into smaller, single-responsibility units.
- **Duplicate code** across modules — create a shared utility or hook.
- **Commented-out code** — delete it; git history tracks what was removed.
- **Console.log in production code** — use the existing `logger` on the backend; remove or guard behind `process.env.NODE_ENV` on the frontend.

---

## React & Next.js Guidelines

### Component Rules
- Keep components **under 150 lines**. Extract sub-components when they grow.
- Prefer **server components** by default in `src/app/`. Add `'use client'` only when needed (event handlers, hooks, browser APIs).
- Place `'use client'` at the **leaf** of the component tree, not at layout level.
- One component per file; filename matches the exported component name (PascalCase).
- Co-locate component-specific logic in the same folder when it's not reused elsewhere.

### Hooks
- Custom hooks live in `src/hooks/`. Each hook handles one concern.
- Never call hooks conditionally.
- Always clean up effects (`return () => ...`) when subscribing to events or sockets.
- Use `useCallback` and `useMemo` only when profiling shows a real performance issue — not preemptively.

### State Management
- **AuthContext** and **ThemeContext** are the only global state providers — keep them that way.
- Local UI state (modals, form inputs, loading) stays in `useState` inside the component.
- API data fetching goes through domain hooks (`useVehicles`, `useReservations`, etc.) that wrap `useApi`.
- Do **not** introduce a third-party state library (Redux, Zustand) without discussing it first.

### Avoid
- Calling API methods directly inside components — use the hooks layer.
- Prop drilling beyond 2 levels — lift state or use context.
- `useEffect` with no dependency array (equivalent to `componentDidUpdate` every render).
- Mutating state directly — always return new references.

---

## Backend (Express.js) Guidelines

### Module Structure
Each domain module must follow this pattern:
```
modules/<domain>/
  ├── <domain>.routes.js       # Express router + Swagger JSDoc
  ├── <domain>.repository.js   # Extends BaseRepository, all DB queries here
  └── (optional) <domain>.service.js  # Business logic if complex
```

### Repository Rules
- All database access **must** go through a repository — never query `db` directly in a route handler.
- Use parameterized queries (`$1, $2, …`) — never string-interpolate user input into SQL.
- Use `db.transaction(callback)` for multi-step writes that must be atomic.
- Table names come from `constants.js` — never hardcode strings like `'auth.users'` inside queries.

### Route Handler Rules
- Route handlers are thin: validate input → call repository/service → return JSON.
- Validation happens in middleware or at the top of the handler before any DB call.
- Always return consistent response shapes: `{ data, message }` for success, delegated to `error-handler` for failures.
- Never `throw` raw errors from routes — let the error-handler middleware catch them.

### Avoid
- Business logic inside route handlers — move it to a service or repository method.
- Returning stack traces or internal error messages to the client.
- Bypassing `auth.middleware.js` on protected routes.
- Adding env vars directly in code — always read from `config/env.js`.

---

## Database Guidelines

- **Schema changes** go in `backend/src/database/schema.sql` as idempotent statements (`CREATE TABLE IF NOT EXISTS`, `DO $$ BEGIN ... EXCEPTION WHEN duplicate_column THEN NULL; END; $$`).
- **Never** mutate the schema directly in production without updating `schema.sql`.
- New tables must define a primary key, `created_at TIMESTAMPTZ DEFAULT NOW()`, and relevant indexes.
- **Soft deletes** preferred over hard deletes for audit-sensitive data (reservations, payments).
- Use PostgreSQL `ENUM` types for fixed value sets (roles, statuses) — they are already defined; extend via `ALTER TYPE … ADD VALUE`.

---

## API Client (Frontend)

- All API calls go through methods exported from `src/lib/api-client.ts`.
- Never use `fetch` directly in components or hooks.
- New endpoints require a typed method in the correct API object (`vehicleApi`, `reservationApi`, etc.) with TypeScript return types.
- Errors are `ApiError` instances — catch and inspect `error.status` for role-based or UX-specific handling.

---

## Authentication & Security

- JWT tokens live in `localStorage` via `AuthContext` — do not store them in cookies without a security review.
- All backend routes that require authentication use `auth.middleware.js`.
- Role checks (`requireRole('ADMIN')`) are enforced at the route level in addition to UI hiding.
- Never trust client-provided `userId` or `role` in request bodies — always derive from the verified JWT.
- Password hashing uses `bcryptjs` (cost factor 12) — do not change without benchmarking.
- Rate limiting is applied globally via `rate-limiter.js` middleware — do not disable it.

---

## Real-time (Socket.IO)

- Socket connections are authenticated — validate the JWT on the `connection` event in `socketHandler.js`.
- Emit only to the intended room/user (use `socket.to(userId).emit(...)`) — never broadcast sensitive data.
- Handle `disconnect` to clean up any server-side state (active user maps, etc.).

---

## Styling (Tailwind CSS 4)

- Use Tailwind utility classes directly — no custom CSS files unless a design token truly cannot be expressed in utilities.
- Dark mode is handled via the `dark:` variant — all new components must support it.
- Responsive breakpoints follow Tailwind defaults (`sm`, `md`, `lg`).
- Reusable style compositions go in `src/components/ui/` as typed React components (Button, Badge, Card, Modal).
- Do not use inline `style` props for layout — use utilities.

---

## Code Smells Checklist (Pre-commit Mental Review)

Before committing, verify:

- [ ] No `any` types introduced without a comment explaining why.
- [ ] No hardcoded strings for roles, statuses, table names.
- [ ] No direct `fetch` calls outside `api-client.ts`.
- [ ] No DB queries outside repository files.
- [ ] No `console.log` left in committed code.
- [ ] No commented-out code blocks.
- [ ] Components under 150 lines; functions under 40 lines.
- [ ] New UI components support dark mode.
- [ ] New backend routes are protected by `auth.middleware.js` (unless intentionally public).
- [ ] SQL uses parameterized placeholders (no string interpolation).

---

## Testing Guidelines

The project currently has **no test setup**. When adding tests:

- **Backend**: Use **Jest** + **supertest** for route integration tests against a real test database.
- **Frontend**: Use **Vitest** + **React Testing Library** for component and hook tests.
- Never mock the database in integration tests — test against a real PostgreSQL instance with a separate test schema.
- Test files live next to the source file: `foo.ts` → `foo.test.ts`.
- Priority order for coverage: authentication flows → reservation lifecycle → payment processing.

---

## Infrastructure & Deployment

### Docker local
- `backend/docker-compose.dev.yml` orquesta los 3 servicios: postgres (5433), backend (4004), frontend (3000).
- El Dockerfile del backend corre `migrate.js → seed.js → index.js` al arrancar.
- Puerto de PostgreSQL es **5433** (no 5432) porque hay un PostgreSQL nativo de macOS en 5432.

### Railway (producción)
- Deploy automático vía GitHub Actions (`.github/workflows/deploy.yml`) en push a `master`.
- El workflow hace SSH al servidor, `git pull`, `npm install`, `pm2 restart`.
- Variables requeridas en Railway backend: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL=https://body-shop.up.railway.app`, `STRIPE_SECRET_KEY`.
- Variable requerida en Railway frontend: `NEXT_PUBLIC_API_URL=https://backend-lavauto-production.up.railway.app`.

### CORS
- Los orígenes permitidos se leen de `FRONTEND_URL` (comma-separated para múltiples) + `localhost:3000` y `localhost:3001`.
- El handler usa `callback(null, false)` para orígenes bloqueados — nunca `new Error()` (causaría 500 en preflight).
- `app.options('*', cors(corsOptions))` se monta antes que helmet para responder preflights correctamente.

---

## Logo y Tema

- Componente `src/components/ui/ThemeLogo.tsx` centraliza el logo con dark mode.
- Modo claro → `/public/logo_claro.png`, modo oscuro → `/public/logo_oscuro.png`.
- Bordes redondeados 8px, no circular. Tamaños: navbar 36px, footer 32px, auth forms 72px, sidebar 40px.

---

## Importación de Clientes (CRM Excel)

- Script `backend/scripts/import_excel_clients.js` lee `OPORTUNIDADES SALE BY SERVICE_ 23 JUL 2025.xlsx` (raíz del proyecto).
- Cabecera real en fila 3 del Excel (índice 2), datos desde fila 4.
- Contraseña por defecto = primeros 6 dígitos de la cédula. Idempotente por `ON CONFLICT (email) DO NOTHING`.

---

## Git & PR Conventions

- Branch naming: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`.
- Commit messages in Spanish (project convention) with imperative mood: `feat: agregar validación de placa`.
- Keep PRs focused — one feature or fix per PR.
- Do not merge to `master` with failing lint.

---

## Environment Variables

Managed in `backend/src/config/env.js`. Required vars:

```
DATABASE_URL or (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
JWT_SECRET
JWT_REFRESH_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NODE_ENV
PORT
```

Frontend vars (prefix `NEXT_PUBLIC_`) go in `.env.local` and are validated at startup.

---

## Dependency Rules

- Do **not** add a new npm package without evaluating if existing dependencies already cover the need.
- Heavy dependencies (ORMs, state managers, UI component libraries) require explicit discussion before installation.
- Keep `bcryptjs` on both frontend and backend in sync (same major version).
- `microservices/` directory is legacy — do not add dependencies or modify it.
