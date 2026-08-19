# Frontend

- `static/` is the current deployable HTML/CSS/JavaScript dashboard.
- `next/` is the Next.js application and owns shared reference assets.

Run the static dashboard with `npm run serve:dashboard`.

Run the Next.js app with `npm run dev`.

For Phase 2B, confirm the target implementation before editing. The current recommendation is to connect role-based login and unified APIs to `static/` first because it is the deployed demo path.

## Verification

- Static dashboard and reference assets pass local HTTP smoke checks.
- JavaScript syntax checks pass.
- Next.js build verification is pending because the existing local
  `node_modules` cache is incomplete. No dependencies were installed or changed
  during the workspace consolidation.
