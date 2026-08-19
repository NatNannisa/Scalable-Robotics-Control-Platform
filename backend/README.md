# Backend And Unified API

This folder contains the dependency-free Node HTTP backend.

- `index.js`: route entrypoint.
- `auth/`: demo sessions, roles, permissions, authorization.
- `canonical/`: canonical enums, models, and validators.
- `adapters/`: Supplier A/B/C normalization boundary.
- `services/`: legacy dashboard and unified services.
- `tests/`: backend regression and supplier-isolation tests.

Run:

```powershell
npm run server
npm run test:backend
```

