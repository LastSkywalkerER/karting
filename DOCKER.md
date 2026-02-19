# Docker Deployment

## Services

- **scrapper** (port 3001 internal) — SpeedHive scraper with Puppeteer/Chromium
- **backend** (port 3000 internal) — API server, depends on scrapper
- **frontend** (port 8080 → 80) — Nginx serving React app, proxies /api to backend

## Run

```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down
```

## Access

- **Frontend**: http://localhost:8080

The frontend proxies `/api` and `/health` to the backend. The backend proxies lap-times and pitlane-events to the scrapper.

## Volumes

- `backend_data` — SQLite DB for races, teams, karts, pitlane
- `scrapper_data` — SQLite DB for race results and pitlane entry events
