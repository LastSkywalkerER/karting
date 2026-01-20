# Архитектура проекта Race Stats

## Общая архитектура

Проект использует **Clean Architecture** с разделением на слои:
- **Presentation Layer** (Frontend + Backend API)
- **Domain Layer** (Бизнес-логика и сущности)
- **Infrastructure Layer** (База данных, Scraper)

### Компоненты системы

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Compose                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐           │
│  │   Frontend       │         │   Backend        │           │
│  │   (React + Vite) │◄───────►│   (Express)      │           │
│  │   Port: 80       │  HTTP   │   Port: 3000     │           │
│  │   (Nginx)        │         │                  │           │
│  └──────────────────┘         └────────┬─────────┘           │
│                                         │                      │
│                                         ▼                      │
│                              ┌──────────────────┐             │
│                              │   SQLite DB      │             │
│                              │   (race_data.db) │             │
│                              └──────────────────┘             │
│                                         ▲                      │
│                                         │                      │
│                              ┌──────────┴─────────┐           │
│                              │   Puppeteer Scraper │           │
│                              │   (Background)      │           │
│                              └─────────────────────┘           │
│                                         │                      │
│                                         ▼                      │
│                              ┌─────────────────────┐          │
│                              │  SpeedHive Website  │          │
│                              │  (External)         │          │
│                              └─────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## Связи Frontend и Backend

### Сетевая архитектура

**Docker Network**: `race-stats-network` (bridge)

**Nginx** (Frontend контейнер):
- Порт: `3001:80` (маппинг на хост)
- Проксирует `/api/*` → `scrapper:3000`
- Проксирует `/health` → `scrapper:3000`
- Отдает статические файлы React из `/usr/share/nginx/html`

**Backend** (Scrapper контейнер):
- Порт: `3000` (внутренний, не экспортирован)
- Express сервер
- Health check endpoint: `/health`

### API Endpoints

| Метод | Путь | Описание | Параметры |
|-------|------|----------|-----------|
| GET | `/api/results/latest` | Получить последние результаты | `sessionId` (query) |
| GET | `/api/results/lap-times` | Получить таблицу времен кругов | `sessionId` (query) |
| GET | `/api/results` | Получить все результаты | `limit`, `offset`, `sessionId` (query) |
| GET | `/api/timestamps` | Получить все временные метки | `sessionId` (query) |
| GET | `/api/teams/kart-status` | Получить статусы картов команд | - |
| PUT | `/api/teams/kart-status` | Обновить статусы картов команд | Body: `{ updates: [...] }` |
| GET | `/api/pitlanes/kart-status` | Получить статусы картов пит-лейнов | - |
| PUT | `/api/pitlanes/kart-status` | Обновить статусы картов пит-лейнов | Body: `{ updates: [...] }` |
| GET | `/health` | Health check | - |

### Frontend API клиент

**Файл**: `frontend/src/shared/api/raceResultsApi.ts`

Функции:
- `fetchLatestResults(sessionId)` → `RaceResultsResponse`
- `fetchLapTimesTable(sessionId)` → `LapTimesTableResponse`
- `fetchTeamKartStatuses()` → `TeamKartStatusResponse`
- `updateTeamKartStatuses(request)` → `{ success, message, error }`
- `fetchPitlaneKartStatuses()` → `PitlaneKartStatusResponse`
- `updatePitlaneKartStatuses(request)` → `{ success, message, error }`

**Base URL**: `/api` (проксируется через Nginx)

---

## Модели данных

### 1. RaceResult (Результаты гонки)

**Domain Entity**: `scrapper/src/domain/entities/RaceResult.ts`  
**Frontend Type**: `frontend/src/shared/types/raceResult.ts`

```typescript
interface RaceResult {
  id?: number;                    // Primary key (auto-increment)
  timestamp: string;               // ISO timestamp
  sessionId: string;              // Session identifier
  position: number | null;         // Позиция в гонке
  competitorNumber: string | null; // Номер участника
  competitorName: string | null;   // Имя участника
  laps: number | null;            // Количество кругов
  lastLapTime: string | null;     // Время последнего круга
  bestLapTime: string | null;      // Лучшее время круга
  gap: string | null;             // Отставание от лидера
  diff: string | null;            // Разница с предыдущим
  rawData?: Record<string, unknown>; // Дополнительные данные
}
```

**Таблица БД**: `race_results`
- Индексы: `timestamp`, `session_id`
- JSON поле: `raw_data` (TEXT)

---

### 2. TeamKartStatus (Статус карта команды)

**Domain Entity**: `scrapper/src/domain/entities/TeamKartStatus.ts`  
**Frontend Type**: `frontend/src/shared/types/raceResult.ts`

```typescript
interface TeamKartStatus {
  id?: number;                    // Primary key
  teamNumber: string;             // Номер команды (UNIQUE)
  kartStatus: number;             // Статус карта: 1-5
  lastPitLap?: number;            // Последний круг с пит-стопом
}
```

**Валидация**:
- `kartStatus`: 1-5 (1=зеленый, 2=желтый, 3=оранжевый, 4=красный, 5=черный)

**Таблица БД**: `team_kart_status`
- Индекс: `team_number`
- Constraint: `kart_status >= 1 AND kart_status <= 5`

---

### 3. PitlaneKartStatus (Статус карта пит-лейна)

**Domain Entity**: `scrapper/src/domain/entities/PitlaneKartStatus.ts`  
**Frontend Type**: `frontend/src/shared/types/raceResult.ts`

```typescript
interface PitlaneKartStatus {
  id?: number;                    // Primary key
  pitlaneNumber: number;          // Номер пит-лейна: 1-4 (UNIQUE)
  kartStatus: number;             // Статус карта: 1-5
}
```

**Валидация**:
- `pitlaneNumber`: 1-4
- `kartStatus`: 1-5

**Таблица БД**: `pitlane_kart_status`
- Индекс: `pitlane_number`
- Constraints: `pitlane_number >= 1 AND pitlane_number <= 4`, `kart_status >= 1 AND kart_status <= 5`

---

### 4. LapTimesTable (Таблица времен кругов)

**Service Response**: `scrapper/src/domain/services/LapTimesService.ts`

```typescript
interface LapTimesTable {
  lapNumbers: number[];                    // Номера кругов (по убыванию)
  competitorNumbers: string[];            // Номера участников (сортировка по макс. кругам)
  data: (string | null)[][];             // Матрица: data[lapIndex][competitorIndex] = lastLapTime
}
```

**Логика построения**:
- Круги сортируются по убыванию (самый высокий номер первый)
- Участники сортируются по максимальному количеству кругов (убывание), затем по номеру
- Используется первое вхождение комбинации (lap, competitorNumber) по timestamp

---

## Сторонние подключения

### 1. SpeedHive (MyLaps) - Внешний источник данных

**URL**: `https://speedhive.mylaps.com/livetiming/0409BF1AD0B97F05-2147486933/sessions/0409BF1AD0B97F05-2147486933-1073748974`

**Session ID**: `0409BF1AD0B97F05-2147486933-1073748974`

**Реализация**: `scrapper/src/infrastructure/scraper/PuppeteerScraper.ts`

**Технология**: Puppeteer (headless Chrome)

**Процесс**:
1. Запуск браузера (Puppeteer)
2. Навигация на страницу SpeedHive
3. Ожидание загрузки таблицы результатов
4. Установка MutationObserver для отслеживания изменений DOM
5. Извлечение данных из таблицы при каждом изменении
6. Сохранение в БД через debounce (1 секунда)

**Селекторы DOM**:
- Таблица: `[class*="datatable"]`
- Строки: `[class*="datatable-row"]:not(.datatable-header-row)`
- Ячейки: по классам (`position`, `display-number`, `competitor`, `laps`, `last-lap-time`, `best-lap-time`, `gap`, `difference`)

**Особенности**:
- Использует WebSocket для обновления данных на странице
- MutationObserver отслеживает изменения в реальном времени
- Debounce предотвращает слишком частые сохранения

---

### 2. SQLite Database

**Путь**: `/app/data/race_data.db` (в Docker)  
**Библиотека**: `better-sqlite3`

**Схема**:
- `race_results` - результаты гонок
- `team_kart_status` - статусы картов команд
- `pitlane_kart_status` - статусы картов пит-лейнов

**Volume**: `scrapper_data` (Docker volume для персистентности)

---

### 3. Nginx (Reverse Proxy)

**Конфигурация**: `nginx.conf`

**Функции**:
- Проксирование API запросов к backend
- Отдача статических файлов фронтенда
- Кэширование статических ресурсов (1 год)

---

## Cron jobs и периодические задачи

### 1. Scraper (Background Process)

**Тип**: Непрерывный фоновый процесс (не cron)

**Запуск**: При старте приложения (`scrapper/src/index.ts`)

**Реализация**: `PuppeteerScraper.start()`

**Механизм**:
- Запускается один раз при старте сервера
- Работает в фоновом режиме (не блокирует Express сервер)
- Использует MutationObserver для отслеживания изменений в реальном времени
- Debounce: 1 секунда (сохранение при изменениях)

**Остановка**: Graceful shutdown при SIGINT/SIGTERM

---

### 2. Frontend Polling

**Тип**: Client-side polling (setInterval)

**Реализация**: В компонентах React

**Компоненты с polling**:

1. **MainPage** (`frontend/src/pages/MainPage.tsx`)
   - Опрос: `fetchPitlaneKartStatuses()`
   - Интервал: **1 секунда**

2. **RaceResultsTable** (`frontend/src/features/race-results/ui/RaceResultsTable.tsx`)
   - Опрос: `fetchLatestResults(sessionId)`
   - Интервал: **1 секунда**

3. **LapTimesPage** (`frontend/src/pages/LapTimesPage.tsx`)
   - Опрос: `fetchLapTimesTable(sessionId)`
   - Интервал: **1 секунда**

4. **TeamKartStatusPage** (`frontend/src/pages/TeamKartStatusPage.tsx`)
   - Опрос: `fetchTeamKartStatuses()`
   - Интервал: **1 секунда**

**Особенность**: Все компоненты обновляют данные каждую секунду для отображения актуальной информации в реальном времени.

---

## Слои архитектуры

### Presentation Layer

**Backend**:
- `ExpressServer` - HTTP сервер
- `RaceResultController` - обработка HTTP запросов
- `raceResultRoutes` - маршрутизация API

**Frontend**:
- React компоненты (Pages, Features)
- API клиент (`raceResultsApi.ts`)
- TypeScript типы

### Domain Layer

**Entities**:
- `RaceResultEntity`
- `TeamKartStatusEntity`
- `PitlaneKartStatusEntity`

**Services**:
- `LapTimesService` - построение таблицы времен кругов
- `IScraperService` - интерфейс скрапера

**Repositories (Interfaces)**:
- `IRaceResultRepository`
- `ITeamKartStatusRepository`
- `IPitlaneKartStatusRepository`

### Infrastructure Layer

**Database**:
- `DatabaseConnection` - подключение к SQLite
- `RaceResultRepository` - реализация репозитория результатов
- `TeamKartStatusRepository` - реализация репозитория статусов команд
- `PitlaneKartStatusRepository` - реализация репозитория статусов пит-лейнов

**Scraper**:
- `PuppeteerScraper` - скрапинг данных с SpeedHive

---

## Зависимости между компонентами

```
index.ts (Entry Point)
  ├── DatabaseConnection
  │     ├── RaceResultRepository
  │     ├── TeamKartStatusRepository
  │     └── PitlaneKartStatusRepository
  ├── PuppeteerScraper
  │     └── RaceResultRepository (для сохранения)
  ├── LapTimesService
  └── RaceResultController
        ├── RaceResultRepository
        ├── PuppeteerScraper
        ├── LapTimesService
        ├── TeamKartStatusRepository
        └── PitlaneKartStatusRepository
  └── ExpressServer
        └── RaceResultController
```

---

## Переменные окружения

**Backend** (`scrapper`):
- `PORT` - порт Express сервера (по умолчанию: 3000)
- `DB_PATH` - путь к SQLite БД (по умолчанию: `/app/data/race_data.db`)
- `NODE_ENV` - окружение (production/development)
- `PUPPETEER_EXECUTABLE_PATH` - путь к Chrome (опционально)

---

## Health Checks

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "ok",
  "scraper": {
    "isRunning": boolean,
    "hasBrowser": boolean,
    "hasPage": boolean
  }
}
```

**Docker Health Check**: Проверяется каждые 30 секунд с таймаутом 10 секунд
