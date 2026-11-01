# SupplyZero backend

Async FastAPI backend for cold-chain telemetry, deterministic shelf-life estimates, decision records, MQTT ingestion, and real-time updates. It follows the supplied SupplyZero PRD while keeping kinetic and financial calculations in deterministic Python rules; no LLM is used for state or action selection.

## Run locally

Requires Python 3.11+. The default SQLite database is for development; PostgreSQL/TimescaleDB is configured in Compose.

```powershell
cd "$env:USERPROFILE\OneDrive\Documents\backend\backend"
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
python -m app.seed
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Interactive API docs: http://localhost:8000/docs. For the full local stack, use `docker compose up --build`; the compose broker is intentionally anonymous and suitable only for local demos. Set broker credentials and TLS for deployment.

To enable the AI copilot, set `GEMINI_API_KEY` in `backend/.env` and restart the API. Check `GET /api/copilot/status`; send `POST /api/copilot/chat` with `{"message":"Which shipments are most likely to spoil in the next 6 hours?"}`. The copilot uses read-only database tools and does not execute operational actions.

### Start backend and dashboard together (Windows)

For the current two-folder setup and one-terminal startup commands, see the repository-level `README.md`.

## Run the dashboard

Start the API as above, then open a second PowerShell window:

```powershell
cd "$env:USERPROFILE\OneDrive\Documents\backend\frontend"
npm install
npm run dev
```

Open http://127.0.0.1:5173. The frontend includes a local demo fallback if the API or WebSocket is unavailable.

## Demo workflow

Create a shipment using a seeded product UUID from `GET /api/products`, then run:

```powershell
python -m app.simulator --shipment SZ-DEMO-001 --scenario compressor_failure
```

Available scenarios: `normal`, `compressor_failure`, `door_open`, `heatwave`, `freeze`, and `sensor_dropout`. Scenario injection is also available at `POST /api/sim/scenario`.

## Engineering notes

- Telemetry uses a unique `(shipment_id, ts)` constraint and sorted-history replay, so duplicate messages are no-ops and late readings are replayed deterministically. A process-local shipment lock reduces races in a single worker. For multi-worker PostgreSQL deployments, use a per-shipment advisory lock or partition messages by shipment before scaling ingestion.
- State snapshots, excursions, recommendations, and audit records are append-oriented. Recommendation workflow status is updated in place, with each transition copied to the append-only audit log.
- Missing telemetry intervals receive a conservative configurable degradation uplift. MKT assumes a configurable chemistry activation energy default; tune using validated product data before operational use.
- Routing calls have a <=1.49 s OSRM timeout, a 15 s circuit breaker, Redis cache when available, and a Haversine fallback. Weather-aware rerouting requests OSRM alternatives, samples their paths against Open-Meteo hourly temperatures, and penalizes predicted degree-hours above the product's maximum temperature. This measures forecast ambient air exposure as a route-risk proxy; it does not model reefer performance or cargo-core temperature. The selected route records peak temperature, coordinates of sampled hot zones, and heatwave exposure in recommendation scoring details. If forecast data is unavailable, it uses the fastest OSRM route; route distance fallback remains approximate and marked in scoring details. Configure this with `WEATHER_ENABLED`, `WEATHER_API_BASE_URL`, `WEATHER_TIMEOUT_SECONDS`, and `WEATHER_HEATWAVE_THRESHOLD_C`.
- Pharma hard-stop recommendations are quarantine only. Approval records QA disposition; this service does not release pharma goods. All example profiles are illustrative and not validated quality limits.
- `AUTO_EXECUTE` is off by default. Enabling it records AUTO_EXECUTED for eligible non-pharma recommendations; carrier booking is outside this backend.
- The read-only AI copilot is available at `GET /api/copilot/status` and `POST /api/copilot/chat`. Set `GEMINI_API_KEY` in the backend `.env` to enable it; model and API base URL are configurable. It uses bounded Gemini function calls to query shipment state, spoilage forecasts, excursions, configured hub capacity, recorded impact, and recommendation history. It cannot mutate shipments or approve actions. If the key is missing, status reports the feature as unavailable and chat returns HTTP 503; provider failures return a bounded HTTP 502 instead of affecting API startup.
- REST: `/api/shipments`, detail, telemetry, forecast; `/api/products`, `/api/hubs`; recommendation list/approve/reject; quarantine; demo scenario; impact summary; audit; `/health`. WebSocket: `/ws/stream`.

## TimescaleDB

The compose database image includes TimescaleDB. `Telemetry` has a stable unique key for idempotency. A production migration should create a hypertable with `shipment_id` and `ts` in its composite unique key; current startup uses SQLAlchemy schema creation for portability and does not auto-convert tables. Add reviewed Alembic migrations before production schema evolution.

## Tests

```powershell
pytest
```

Tests pin Arrhenius, Q10, MKT, constant-temperature consumption, ordering, gap handling, and hard-stop behavior to analytical constants. Product parameters must be replaced with QA-validated stability data for real goods.
