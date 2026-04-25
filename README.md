# ThreadHive Backend

A Reddit-clone REST API built with Express 5, MongoDB, and JWT authentication. ThreadHive provides a complete backend for a community discussion platform featuring threaded conversations, subreddit-style communities, nested comments, and a voting system.

## Overview

ThreadHive Backend powers a Reddit-like discussion platform where users can:

- Register and authenticate with secure JWT-based auth
- Create and manage topic-based communities (subreddits)
- Post discussion threads within communities
- Comment on threads
- Upvote and downvote threads and comments

Built for developers learning full-stack development or anyone needing a robust community forum API.

## Features

- **User Authentication** — Register/login with hashed passwords (bcryptjs) and JWT Bearer tokens
- **Subreddit Management** — Create and browse topic-based communities
- **Thread CRUD** — Create, read, update, and delete discussion threads with author ownership enforcement
- **Commenting System** — Add comments to threads with user attribution
- **Voting System** — Upvote/downvote threads and comments with automatic vote count tracking
- **Security Hardened** — Helmet headers, rate limiting, CORS configuration
- **Standardized Responses** — Consistent JSON response format across all endpoints

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB (Mongoose 8) |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| Security | Helmet, express-rate-limit, CORS |
| Testing | Vitest, Supertest, mongodb-memory-server |
| Formatting | Prettier |

## Architecture

ThreadHive follows a strict **3-layer architecture**:

```
Route → Controller (HTTP layer: parse request, send response)
      → Service    (Business logic, DB queries via Mongoose)
      → Model      (Schema + validation)
```

- **Controllers** handle HTTP concerns only — they never import models directly
- **Services** contain all business logic and throw errors via `createAppError(message, statusCode)`
- **Models** define Mongoose schemas with validation rules
- A **global error handler** middleware catches all thrown errors and returns standardized responses

## Project Structure

```
├── main.js                    # Entry point — connects DB and starts server
├── server.js                  # Express server startup/shutdown
├── db.js                      # MongoDB connection management
├── src/
│   ├── app.js                 # Express app config (middleware, routes, error handler)
│   ├── controllers/           # HTTP request/response handlers
│   │   ├── authController.js
│   │   ├── commentController.js
│   │   ├── subredditController.js
│   │   ├── threadController.js
│   │   ├── userController.js
│   │   └── voteController.js
│   ├── services/              # Business logic layer
│   │   ├── authService.js
│   │   ├── commentService.js
│   │   ├── subredditService.js
│   │   ├── threadService.js
│   │   └── voteService.js
│   ├── models/                # Mongoose schemas
│   │   ├── Comment.js
│   │   ├── Subreddit.js
│   │   ├── Thread.js
│   │   └── User.js
│   ├── routes/                # Express route definitions
│   │   ├── auth.js
│   │   ├── comments.js
│   │   ├── subreddits.js
│   │   ├── threads.js
│   │   └── votes.js
│   ├── middleware/
│   │   ├── authHandler.js     # JWT verification + user attachment
│   │   └── errorHandler.js    # Global error handler
│   ├── scripts/
│   │   ├── populate_db.js     # Database seeding script
│   │   └── seed-data.js       # Sample seed data
│   └── utils/
│       └── createAppError.js  # Error factory utility
├── tests/
│   └── threads/
│       └── threads.test.js    # Thread endpoint integration tests
└── resources/                 # Agent and documentation configs
```

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local instance or cloud URI, e.g. MongoDB Atlas)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/threadhive-backend.git
cd threadhive-backend

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb://localhost:27017/threadhive
JWT_SECRET=your-secret-key
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | Secret key for signing JWT tokens |
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | — | `development` or `production` |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin |

### Running the App

```bash
# Development (with hot reload)
npm run dev

# Production
npm start

# Seed the database with sample data
npm run populate
```

## API Endpoints

All endpoints return responses in the following format:

```json
{
  "success": true,
  "message": "Description of result",
  "data": { }
}
```

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login and receive JWT token | No |

### Threads

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/threads` | Get all threads | Yes |
| GET | `/api/threads/:id` | Get a thread by ID | Yes |
| POST | `/api/threads` | Create a new thread | Yes |
| PUT | `/api/threads/:id` | Update a thread (author only) | Yes |
| DELETE | `/api/threads/:id` | Delete a thread (author only) | Yes |

### Subreddits

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/subreddits` | Get all subreddits | Yes |
| GET | `/api/subreddits/:id` | Get subreddit with its threads | Yes |
| POST | `/api/subreddits` | Create a new subreddit | Yes |

### Comments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/comments/thread/:threadId` | Get all comments for a thread | Yes |
| POST | `/api/comments` | Add a comment to a thread | Yes |

### Votes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/threads/:id/upvote` | Upvote a thread | Yes |
| POST | `/api/threads/:id/downvote` | Downvote a thread | Yes |
| POST | `/api/comments/:id/upvote` | Upvote a comment | Yes |
| POST | `/api/comments/:id/downvote` | Downvote a comment | Yes |

### Authentication Usage

Include the JWT token in the `Authorization` header for all protected routes:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are issued on login with a **1-hour expiry** and use the HS256 algorithm.

## Data Models

### User

| Field | Type | Constraints |
|-------|------|-------------|
| name | String | Required, max 100 chars |
| email | String | Required, unique, valid email format |
| password | String | Required, min 8 chars (stored hashed) |

### Thread

| Field | Type | Constraints |
|-------|------|-------------|
| title | String | Required, max 300 chars |
| content | String | Required, max 40,000 chars |
| author | ObjectId | Ref: User |
| subreddit | ObjectId | Ref: Subreddit |
| upvotes / downvotes / voteCount | Number | Auto-managed counters |
| upvotedBy / downvotedBy | [ObjectId] | Ref: User |

### Comment

| Field | Type | Constraints |
|-------|------|-------------|
| thread | ObjectId | Ref: Thread |
| user | ObjectId | Ref: User |
| content | String | Required, max 10,000 chars |
| voteCount | Number | Auto-managed counter |
| upvotedBy / downvotedBy | [ObjectId] | Ref: User |

### Subreddit

| Field | Type | Constraints |
|-------|------|-------------|
| name | String | Required, unique, 1–50 chars, alphanumeric + underscore |
| description | String | Max 500 chars |
| author | ObjectId | Ref: User |

## Testing

Tests use **Vitest** with **Supertest** for HTTP assertions and **mongodb-memory-server** for an isolated in-memory database.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run only thread tests
npm run test:threads
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the production server |
| `npm run dev` | Start with Nodemon hot reload |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:threads` | Run thread endpoint tests |
| `npm run populate` | Seed the database with sample data |
| `npm run format` | Format code with Prettier |

## License

This project is licensed under the [MIT License](LICENSE).
