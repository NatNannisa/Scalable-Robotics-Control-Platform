# Supabase Backend Setup

This backend adds a read-only API layer for the standalone CP Hypermarket AI Robot Control Room dashboard. The browser calls the local API and never receives a Supabase service-role key. If the API or Supabase is unavailable, `app.js` keeps using its existing mock data.

## Security First

The service-role key supplied during development was shared in plain text. Rotate it in Supabase before using this integration:

1. Open the Supabase project dashboard.
2. Go to **Project Settings > API Keys**.
3. Rotate the exposed secret/service-role key.
4. Put only the new value in the local `.env` file.
5. Never paste the key into `app.js`, HTML, screenshots, source control, or chat.

The publishable key is intended for restricted browser access protected by Row Level Security. This implementation does not need a Supabase key in the browser because all dashboard reads go through the local API.

## Find Supabase Values

- Project URL: **Project Settings > Data API**. It looks like `https://xxxxx.supabase.co`.
- Publishable key: **Project Settings > API Keys**. It starts with `sb_publishable_`.
- Secret/service-role key: **Project Settings > API Keys**. Use it only in trusted server-side processes.

Do not append `/rest/v1/` to `SUPABASE_URL`. The server normalizes it for compatibility, but the canonical value is the project root URL.

## Create `.env`

Duplicate `.env.example` as `.env` and replace the placeholders:

```dotenv
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
SUPABASE_SERVICE_ROLE_KEY=your_rotated_service_role_key
PORT=3001
ALLOWED_ORIGIN=*
```

For a shared or deployed environment, replace `ALLOWED_ORIGIN=*` with the exact dashboard origin.

The repository ignores `.env` and `.env.*`, except `.env.example`.

## Current Six-Table Demo Setup

Use this flow for the current standalone CP Hypermarket AI Robot Control Room demo. It targets the existing six-table backend contract and keeps `event_logs` unchanged.

### Step 1: Run `platform/database/current-schema.sql`

1. Open **Supabase Dashboard > SQL Editor**.
2. Create a new query.
3. Paste and run [`current-schema.sql`](current-schema.sql).

This creates the current six tables if they do not exist:

- `public.zones`
- `public.campaigns`
- `public.robot_scripts`
- `public.robots`
- `public.event_logs`
- `public.customer_interactions`

### Step 2: Run `platform/database/seed-current-schema.sql`

Create a second SQL Editor query, paste and run [`seed-current-schema.sql`](seed-current-schema.sql).

The seed file is data-only and assumes Step 1 has already run. It includes a preflight guard that raises a clear error if any required table is missing.

### Step 3: Verify Row Counts

The seed file ends with a row-count summary. Expected demo counts:

| Table | Expected rows |
| --- | ---: |
| `zones` | 10 |
| `campaigns` | 6 |
| `robot_scripts` | 18 |
| `robots` | 5 |
| `event_logs` | 36 |
| `customer_interactions` | 120 |

You can also rerun this verification query:

```sql
select 'zones' as table_name, count(*) as row_count from public.zones
union all
select 'campaigns', count(*) from public.campaigns
union all
select 'robot_scripts', count(*) from public.robot_scripts
union all
select 'robots', count(*) from public.robots
union all
select 'event_logs', count(*) from public.event_logs
union all
select 'customer_interactions', count(*) from public.customer_interactions
order by table_name;
```

### Step 4: Run Backend API Test

Start the backend:

```powershell
npm run server
```

Then verify health and at least one data endpoint:

```powershell
Invoke-RestMethod http://localhost:3001/api/health
Invoke-RestMethod http://localhost:3001/api/control-center/overview
```

## Advanced 19-Table Schema Flow

[`schema.sql`](schema.sql) is the later advanced schema. Do not use it for the current six-table demo unless the backend mapping is also updated for that schema.

The backend uses Node.js built-in HTTP and `fetch`, so it does not require an additional server package. This preserves the project's no-install fallback on company-managed computers where npm registry access is blocked.

## Start the Backend

```powershell
npm run server
```

The default address is:

```text
http://localhost:3001
```

Health check:

```powershell
Invoke-RestMethod http://localhost:3001/api/health
```

Example API checks:

```powershell
Invoke-RestMethod http://localhost:3001/api/control-center/overview
Invoke-RestMethod http://localhost:3001/api/control-center/live-camera
Invoke-RestMethod http://localhost:3001/api/analytics/kpi-overview
Invoke-RestMethod http://localhost:3001/api/management/zones-routes
Invoke-RestMethod http://localhost:3001/api/data-science-lab/overview
```

## Open the Standalone Dashboard

Open `cp-space-ai-control-room.html`. Its `app.js` configuration is:

```js
const API_BASE_URL = "http://localhost:3001";
const USE_BACKEND_API = true;
```

Change `API_BASE_URL` only when the API is hosted elsewhere. Keep the URL pointed at the backend, not at Supabase. Set `USE_BACKEND_API` to `false` to force mock-only mode.

The helper `fetchDashboardData(endpoint, fallbackData)`:

1. requests the local API;
2. applies successful API data to existing dashboard arrays;
3. logs a warning and returns existing mock data when the request fails;
4. rerenders without changing the visual layout.

## API Endpoints

### Control Center

- `GET /api/control-center/overview`
- `GET /api/control-center/3d-store-map`
- `GET /api/control-center/live-camera`
- `GET /api/control-center/event-log`
- `GET /api/control-center/alerts`

### Analytics

- `GET /api/analytics/kpi-overview`
- `GET /api/analytics/engagement-funnel`
- `GET /api/analytics/trend-report`
- `GET /api/analytics/zone-analytics`
- `GET /api/analytics/customer-insight`

### Management

- `GET /api/management/campaigns`
- `GET /api/management/scripts`
- `GET /api/management/zones-routes`

### Data Science Lab

- `GET /api/data-science-lab/overview`
- `GET /api/data-science-lab/model-metrics`
- `GET /api/data-science-lab/sensor-logs`
- `GET /api/data-science-lab/experiments`

## Deployment Notes

- Terminate HTTPS at a trusted internal reverse proxy.
- Restrict CORS to the approved dashboard origin.
- Store secrets in the deployment platform's secret manager.
- Add authentication and role checks before enabling any write endpoint.
- Keep telemetry ingestion and HLS signing behind server-side authenticated endpoints.
- Do not use the current public demo-read RLS policies for confidential or personally identifiable data.

## Integration Test Results - June 18, 2026

### Exact Commands

Static schema and secret scan:

```powershell
node --check app.js
node --check scripts\seed-supabase.js
node --check server\index.js
rg -n "SUPABASE_|eyJhbGci|sb_publishable_" -g "!node_modules/**" -g "!.git/**" -g "!.env" .
```

Current six-table SQL setup and seed:

```text
Step 1: Run platform/database/current-schema.sql in Supabase SQL Editor.
Step 2: Run platform/database/seed-current-schema.sql in Supabase SQL Editor.
Step 3: Verify the row-count summary.
Step 4: Run the backend API test.
```

Backend and dashboard:

```powershell
npm run server
npm run serve:dashboard
```

Health and endpoint examples:

```powershell
Invoke-RestMethod http://localhost:3001/api/health
Invoke-RestMethod http://localhost:3001/api/control-center/overview
Invoke-RestMethod http://localhost:3001/api/control-center/live-camera
Invoke-RestMethod http://localhost:3001/api/analytics/kpi-overview
```

Dashboard URL:

```text
http://localhost:8080
```

### Passed

- `current-schema.sql` defines the current six demo tables, including `event_logs`.
- `seed-current-schema.sql` truncates and reseeds the six current tables in dependency order.
- The seed includes row-count verification for zones, campaigns, scripts, robots, event logs, and customer interactions.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are loaded only by the seed and server-side modules.
- No secret key was found in HTML, `app.js`, or frontend assets.
- `/api/health` returns HTTP 200 JSON.
- All 17 data endpoints return HTTP 200 and their documented top-level JSON shapes when tested against the canonical `platform/frontend/next/src/data` integration source.
- With `USE_BACKEND_API = true`, the dashboard fetched API data, rendered successfully, and displayed `Connected / Supabase API`.
- After stopping the backend, the dashboard remained rendered, restored inline mock records, and displayed `Fallback active / Mock data`.

### Remote Supabase Setup Note

If `platform/database/seed-current-schema.sql` fails with a missing relation such as `public.event_logs`, the six-table schema has not been created yet.

Do not rename `event_logs` unless the backend mapping is updated at the same time.

Required order:

1. Run `platform/database/current-schema.sql` in the Supabase SQL Editor.
2. Run `platform/database/seed-current-schema.sql`.
3. Confirm the summary returns 10 zones, 6 campaigns, 18 scripts, 5 robots, 36 event logs, and 120 customer interactions.
4. Restart `npm run server` and rerun the API checks.

### Missing Frontend Mappings

The backend exposes all 17 endpoints, but the current standalone dashboard directly consumes these six during startup:

- Control Center overview
- KPI overview
- Event log
- Alerts
- Zone analytics
- Zones and routes

Live Camera, campaigns, scripts, customer insights, and Data Science Lab endpoints are frontend-ready but their detailed cards still use existing inline presentation data. This preserves the current visual demo and is the remaining data-mapping work after the remote schema is migrated.

### Security Result

The real service-role key is not stored in the workspace. It was used only as a temporary process environment value during the remote connectivity test. Since that key was previously shared in plain text, rotate it before production or further shared-environment use.

## Current Six-Table Integration Test - June 19, 2026

The current Supabase schema was applied with:

```text
platform/database/current-schema.sql
platform/database/seed-current-schema.sql
```

Row counts verified against Supabase:

| Table | Rows |
| --- | ---: |
| `zones` | 10 |
| `campaigns` | 6 |
| `robot_scripts` | 18 |
| `robots` | 5 |
| `event_logs` | 36 |
| `customer_interactions` | 120 |

Backend endpoint test results:

| Endpoint | Status | Source |
| --- | ---: | --- |
| `/api/health` | 200 | server health |
| `/api/control-center/overview` | 200 | current six-table schema |
| `/api/control-center/3d-store-map` | 200 | current six-table schema |
| `/api/control-center/event-log` | 200 | current six-table schema |
| `/api/control-center/alerts` | 200 | current six-table schema |
| `/api/analytics/kpi-overview` | 200 | computed from `customer_interactions` |
| `/api/analytics/engagement-funnel` | 200 | computed from `customer_interactions` |
| `/api/analytics/zone-analytics` | 200 | `zones` + `customer_interactions` |
| `/api/analytics/customer-insight` | 200 | computed insights |
| `/api/management/campaigns` | 200 | `campaigns` |
| `/api/management/scripts` | 200 | `robot_scripts` + `campaigns` |
| `/api/management/zones-routes` | 200 | `zones` + `robots` |

Advanced tables are no longer required for the current demo endpoints. Missing advanced-table data is computed from the six available tables instead of returning 503.

Frontend verification:

- `USE_BACKEND_API = true` remains enabled in `app.js`.
- With backend running, the standalone dashboard loaded Supabase-backed data and Settings displayed `Connected / Supabase API`.
- Event Log rendered messages from `event_logs`, including CP-BOT route and alert messages.
- After stopping the backend, the dashboard still rendered with inline mock data and Settings displayed `Fallback active / Mock data`.
- No frontend visual design changes were made for this test pass.
