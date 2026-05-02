# CarePlus Clinic — Missed-call outbound callback system (Bolna + FastAPI + React)

Patients can request a callback (missed call). Staff see a live dashboard of pending callbacks, in-progress calls, and escalation flags. The backend can trigger outbound calls via Bolna and receive webhook updates (summary, transcript, status, escalation flag).

## What’s in this repo

- **Backend** (`backend/`): FastAPI app + SQLite persistence + Bolna webhook + REST API.
- **Frontend** (`frontend/`): React + Vite app with a patient landing page and staff dashboard.
- **Data** (`data/`): seed JSON (`appointments.json`, `doctors.json`) and the SQLite DB (`clinic.db`, created at runtime).

## Quickstart (local dev)

### 1) Backend (FastAPI)

From repo root:

```bash
python -m pip install -U pip
python -m pip install -r requirements.txt
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will:

- create `data/clinic.db` if missing
- seed appointments from `data/appointments.json` **only if** the DB is empty
- load doctors from `data/doctors.json`

### 2) Frontend (React + Vite)

From `frontend/`:

```bash
npm install
npm run dev
```

### 3) (Optional) expose the backend for webhooks

If Bolna needs to reach your webhook from the internet:

```bash
ngrok http 8000
```

Then configure Bolna to call your public URL:

- webhook endpoint: `<public-ngrok-url>/webhook/bolna`

## URLs

- **Frontend**: `http://localhost:5173`
- **Staff dashboard (frontend)**: `http://localhost:5173/dashboard`
- **Backend API**: `http://localhost:8000`
- **Backend HTML dashboard (simple staff view)**: `http://localhost:8000/dashboard`

## Configuration (environment variables)

### Backend env (`.env` in repo root)

Create `.env` (or copy from `.env.example`):

```bash
BOLNA_API_KEY=replace_me
BOLNA_AGENT_ID=replace_me
BOLNA_BASE_URL=https://api.bolna.dev
```

Notes:

- If `BOLNA_API_KEY` / `BOLNA_AGENT_ID` are missing, calling `/api/call` will error.
- `BOLNA_BASE_URL` defaults to `https://api.bolna.dev`.

### Frontend env (`frontend/.env`)

Create `frontend/.env` (or copy from `frontend/.env.example`):

```bash
VITE_API_URL=http://localhost:8000
VITE_DASHBOARD_PASSWORD=1234
```

Important:

- `VITE_DASHBOARD_PASSWORD` is a **client-side gate only** (stored in browser localStorage). It is not secure authentication.
- Restart the Vite dev server after changing any `VITE_...` variables.

## Product flows

### Patient flow (landing page)

On `http://localhost:5173/`:

- **Request callback** → `POST /api/callback-request?phone=...` (creates an appointment row with `status=pending`)
- **Lookup appointment** → `GET /api/appointment?phone=...` (shows latest status + summary)

### Staff flow (dashboard)

On `http://localhost:5173/dashboard`:

- **Missed call queue**: `status=pending`, can trigger a call
- **Active calls**: `status=in_call`
- **Escalations**: `manager_flag=true`
- Auto-refreshes the appointment list every 5 seconds via `GET /api/appointments`

## Backend API

### Key endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/doctors` | List doctors (optional `specialization=` filter) |
| GET, POST | `/api/availability` | Check slot availability + alternatives |
| GET, POST | `/api/book` | Book an appointment |
| GET | `/api/appointment` | Lookup by `appointment_id`, `phone`, or `name` |
| GET | `/api/appointments` | List all appointments (optional filters in code; frontend uses unfiltered) |
| GET, POST | `/api/appointment/update` | Update an appointment (Bolna-friendly: no path params) |
| POST | `/api/appointment/{id}/cancel` | Cancel an appointment |
| DELETE | `/api/appointment/{id}` | Delete an appointment |
| POST | `/api/callback-request` | Create a missed-call callback request (`status=pending`) |
| POST | `/api/call` | Trigger an outbound call via Bolna |
| POST | `/api/seed-missed` | Seed demo missed calls (dev-only) |
| POST | `/webhook/bolna` | Bolna webhook to store transcript/summary/status/escalation |

### Example calls

Request a callback:

```bash
curl -X POST "http://localhost:8000/api/callback-request?phone=9000000001&patient_name=Ananya%20Sharma"
```

Trigger an outbound call (requires Bolna env vars):

```bash
curl -X POST "http://localhost:8000/api/call?phone=9000000001&appointment_id=apt_1234abcd"
```

## Data & persistence

- SQLite DB location: `data/clinic.db`
- Seed doctors: `data/doctors.json`
- Seed appointments: `data/appointments.json`

To reset local state, delete `data/clinic.db` and restart the backend (it will re-seed).

## Development convenience

This repo includes VS Code tasks in `.vscode/tasks.json`:

- `Backend: Uvicorn`
- `Frontend: Vite`
- `Ngrok: Backend`
- `Dev: All` (runs the three above in parallel)

## Tests

From repo root:

```bash
pytest
```

## Troubleshooting

- **`/api/call` fails with “Bolna credentials not configured”**: set `BOLNA_API_KEY` and `BOLNA_AGENT_ID` in `.env`.
- **Frontend can’t reach backend**: set `VITE_API_URL` in `frontend/.env` to the backend URL (default `http://localhost:8000`).
- **Webhook isn’t updating rows**:
  - ensure Bolna points to `/webhook/bolna`
  - if developing locally, expose with ngrok and update the webhook URL
  - confirm the webhook payload includes `transcript` (top-level or under `call_details`) and extraction fields under `data.<something>`
