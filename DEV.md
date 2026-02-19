# Development Setup

## Environment Variables

Copy `.env.example` to `.env` in each service directory:

```bash
cp backend/.env.example backend/.env
cp scrapper/.env.example scrapper/.env
```

### Backend (`backend/.env`)
- `PORT` — Server port (default: 3000)
- `DB_PATH` — SQLite database path
- `NODE_ENV` — `development` or `production`
- `SCRAPPER_URL` — Scrapper base URL for proxy and cron (e.g. `http://localhost:3001`)

### Scrapper (`scrapper/.env`)
- `PORT` — Server port (default: 3001 in example, to avoid conflict with backend)
- `DB_PATH` — SQLite database path
- `NODE_ENV` — `development` or `production`
- `PUPPETEER_EXECUTABLE_PATH` — Optional path to Chrome/Chromium
- `BACKEND_URL` — Backend URL for session-completed callback (e.g. `http://localhost:3000`)

### Frontend
Uses Vite proxy to `http://localhost:3000` for `/api` — no env vars required.

## Run in dev mode

```bash
# Terminal 1: Backend
cd backend && yarn dev

# Terminal 2: Scrapper
cd scrapper && yarn dev

# Terminal 3: Frontend
cd frontend && yarn dev
```

Open http://localhost:5173 for the frontend.
