# SupplyZero

The project is split into `backend` (FastAPI) and `frontend` (React/Vite). The frontend is configured to call the backend at `http://127.0.0.1:8000` and its WebSocket at `ws://127.0.0.1:8000/ws/stream`.

## Start the backend

Open PowerShell and run:

```powershell
cd "$env:USERPROFILE\OneDrive\Documents\backend\backend"
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
python -m app.seed
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API docs are at http://127.0.0.1:8000/docs. Leave this PowerShell window running.

## Start the frontend

Open a second PowerShell window and run:

```powershell
cd "$env:USERPROFILE\OneDrive\Documents\backend\frontend"
npm install
npm run dev
```

Open http://127.0.0.1:5173. The frontend `.env` already sets the API and WebSocket URLs to the local backend. CORS is enabled for this Vite origin.

To enable the backend AI copilot, add your Gemini API key to `backend/.env` as `GEMINI_API_KEY=...`, then restart the backend.
