# ThreadHive Backend

Reddit-clone REST API · Express 5 · MongoDB (Mongoose 8) · JWT auth

## Architecture

**3-layer pattern — strictly enforced:**

```
Route → Controller (HTTP: parse req, send res)
      → Service    (business logic, DB queries via Mongoose)
      → Model      (schema + validation)
```

- Controllers must NOT import models — always call services
- Services throw errors via `createAppError(message, statusCode)` from `src/utils/createAppError.js`
- Global error handler (`src/middleware/errorHandler.js`) catches all thrown errors

## Code Style

- **ES Modules** (`import`/`export`) — never `require`
- **async/await** — no callbacks or `.then()` chains
- **Naming:** camelCase functions, PascalCase models, plural route nouns (`/threads`, `/comments`)
- **Formatting:** `npm run format` (Prettier)

## Response Format

```json
{ "success": true|false, "message": "...", "data": {} }
```

`201` for creation · `200` for success · `4xx` for client errors · `500` default

## Auth

- JWT Bearer tokens via `Authorization` header
- Generated in `authService.login()` — 1h expiry, payload: `{ userId }`
- `src/middleware/authHandler.js` verifies token, attaches `req.user`
- Public routes (no token): `POST /api/auth/login`, `POST /api/auth/register`
- Passwords hashed with bcryptjs (10 salt rounds)

## Database

- Mongoose 8 + MongoDB via `MONGODB_URI` env var
- Relationships: ObjectId refs + `.populate()` — no embedded subdocuments
- Votes: `upvotedBy[]`/`downvotedBy[]` arrays + `upvotes`/`downvotes`/`voteCount` counters on Thread and Comment

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `development` / `production` |

## Build & Test

```bash
npm install          # Install deps
npm run dev          # Nodemon hot reload
npm start            # Production (node main.js)
npm test             # Vitest
npm run populate     # Seed sample data
npm run format       # Prettier
```

## Testing

- **Vitest** + **Supertest** + **mongodb-memory-server** (in-memory DB)
- See `resources/backend-testing-agent.agent.md` for test conventions

## Gotchas

- Vote counts are stored alongside voter arrays — **keep them in sync** when modifying vote logic
- Auth middleware matches public routes by path string — update `authHandler.js` when adding new public routes
- Seed data (`src/scripts/seed-data.js`) has plain-text passwords — populate script does NOT hash them
- No pagination on list endpoints — use `limit`/`skip` params when scaling
- No input validation library — validate manually in controllers/services
