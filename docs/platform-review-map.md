# Platform Review Map

Everything that runs the CP Hypermarket Robot Control Room is consolidated under this folder.

## Runtime Ownership

| Area | Canonical path | Owner |
| --- | --- | --- |
| Static deployed frontend | `frontend/static/` | Copernicus |
| Next.js frontend | `frontend/next/` | Copernicus |
| UX/UI contracts | `../docs/ux/` and `../docs/frontend/` | Sagan |
| Backend and unified API | `backend/` | Liskov |
| Canonical robot logic | `backend/canonical/` and `../docs/robot-logic/` | Euclid + Liskov |
| Supplier adapters | `backend/adapters/` | Liskov |
| Database and migrations | `database/` | Codd |
| Supplier fixtures | `shared/mock-data/` | Anscombe |
| Backend QA | `backend/tests/` | Turing |
| Runtime helpers | `tools/` | Lead Integrator |

## Frontend Implementations

`frontend/static/` is the current online-demo implementation. It is plain HTML, CSS, and JavaScript.

`frontend/next/` is the richer Next.js implementation and contains its own `app/`, `components/`, `src/`, `public/`, and configuration files.

Do not edit both implementations for one feature unless the task explicitly requires parity.

## Backend

The backend uses Node's built-in HTTP server and has no Express dependency.

```powershell
npm run server
npm run test:backend
```

Legacy dashboard endpoints and Phase 2A unified endpoints coexist in `backend/index.js`.

## Database

Database files are review-only until a user explicitly approves staging or production application.

- `database/current-schema.sql`: current six-table baseline.
- `database/migration-002-multi-supplier.sql`: unapplied Phase 2A migration draft.
- `database/seed-current-schema.sql`: current baseline seed.
- `database/legacy-backend-setup.md`: historical setup notes.

## Static Assets

Reference images live in `frontend/next/public/references/`. The local static server maps `/public/*` requests to the Next.js public directory so there is one canonical asset copy.

## Development Agent Roles

During development, specialized AI-assisted review roles were used
to separate responsibilities across frontend, backend, architecture,
robot logic, database design, testing, and integration.
