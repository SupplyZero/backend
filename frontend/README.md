# SupplyZero dashboard

React, TypeScript, and Vite frontend for the sibling FastAPI backend.

## Run locally

Start the backend first (see `../backend/README.md`), then open another PowerShell window:

```powershell
cd "$env:USERPROFILE\OneDrive\Documents\backend\frontend"
npm install
npm run dev
```

Open http://127.0.0.1:5173. `.env` configures the backend API at `http://127.0.0.1:8000` and WebSocket at `ws://127.0.0.1:8000/ws/stream`. Override these through `VITE_API_BASE_URL` and `VITE_WS_URL` if the backend runs elsewhere.
