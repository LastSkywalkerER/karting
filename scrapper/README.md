# Speedhive Live Timing Scraper

TypeScript-based scraper for Speedhive live timing data with DDD (Domain-Driven Design) architecture.

## Architecture

The project follows a simplified layered architecture:

- **Domain Layer** (`src/domain/`): Core entities and repository/service interfaces
- **Infrastructure Layer** (`src/infrastructure/`): Database and Puppeteer scraper implementations
- **Presentation Layer** (`src/presentation/`): Express API controllers, routes, and server setup

## Installation

```bash
npm install
```

## Development

```bash
# Run in development mode (with ts-node)
npm run dev

# Build TypeScript
npm run build

# Watch mode for development
npm run watch
```

## Production

```bash
# Build first
npm run build

# Then run
npm start
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/results` - Get all race results
  - Query parameters:
    - `limit` - Limit number of results
    - `offset` - Offset for pagination
    - `sessionId` - Filter by session ID
- `GET /api/results/latest` - Get latest results for a session
  - Query parameters:
    - `sessionId` - Session ID (required)
- `GET /api/timestamps` - Get available timestamps for a session
  - Query parameters:
    - `sessionId` - Session ID (required)

## Environment Variables

- `PORT` - Server port (default: 3000)

## How It Works

1. On startup, the scraper automatically launches Puppeteer and navigates to the Speedhive live timing page
2. It waits for the results table to load and WebSocket connections to establish
3. A MutationObserver monitors DOM changes in the results table
4. When changes are detected, data is extracted and saved to SQLite database
5. The Express API provides endpoints to query the saved data

## Database

SQLite database file: `race_data.db` (created automatically)

## Project Structure

```
src/
├── domain/              # Domain layer
│   ├── entities/        # Domain entities
│   ├── repositories/    # Repository interfaces
│   └── services/        # Service interfaces
├── infrastructure/      # Infrastructure layer
│   ├── database/        # Database and repository implementations
│   └── scraper/         # Puppeteer scraper implementation
├── presentation/        # Presentation layer (API)
│   ├── controllers/    # Express controllers
│   ├── routes/          # Route definitions
│   └── server/          # Express server setup
└── index.ts             # Application entry point
```

