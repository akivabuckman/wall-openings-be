# Wall Openings — Backend

Real-time collaborative backend for the Wall Openings editor. Manages walls and openings via Socket.IO events, persists data in PostgreSQL through Prisma, and exposes a small REST API for server-side operations.

> **Frontend repo:** [_link to frontend repo here_](https://github.com/akivabuckman/wall-openings)

---

## Architecture Overview

```
Browser (React + Konva)
        │
        │  WebSocket (Socket.IO)  /  HTTP
        ▼
    Nginx (reverse proxy)
        │
        ├──▶  Frontend container  (served by `serve` on :5175)
        │
        └──▶  Backend container   (Express + Socket.IO, this repo, on :5000)
                    │
                    ▼
             PostgreSQL on AWS RDS  (walls & openings)

AWS Lambda  ──▶  DELETE /old-walls  (scheduled cleanup — removes walls not updated in 7+ days)
```

Everything runs on a single **AWS EC2** instance (ap-southeast-1). **Nginx** handles TLS termination and proxies traffic to the containers on a shared Docker network. The Socket.IO server is served at `/wall-openings/socket` and the HTTP REST API at `/wall-openings/api`. A scheduled **AWS Lambda function** calls `DELETE /old-walls` to purge stale walls automatically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Server framework | [Express](https://expressjs.com) + [TypeScript](https://www.typescriptlang.org) |
| Real-time comms | [Socket.IO](https://socket.io) |
| ORM | [Prisma](https://www.prisma.io) |
| Database | [PostgreSQL](https://www.postgresql.org) (AWS RDS) |
| Logging | [Pino](https://getpino.io) |
| Container | [Docker](https://www.docker.com) (multi-stage build) |
| CI/CD | GitHub Actions → AWS ECR → AWS EC2 |
| Testing | [Jest](https://jestjs.io) + [ts-jest](https://kulshekhar.github.io/ts-jest) + [Supertest](https://github.com/ladjs/supertest) |

---

## Socket Events

### Emitted by the client

| Event | Payload | Description |
|---|---|---|
| `wallJoin` | `{ wallId: string \| null }` | Join an existing wall or create a new one. Pass `null` or empty string to create. |
| `openingChange` | `{ opening: Opening }` | Create or update an opening. |
| `deleteOpening` | `{ wallId: string, openingId: string }` | Delete an opening. |
| `requestNewOpening` | `{ wallId: string }` | Ask the server to create a new default opening on the wall. |

### Emitted by the server

| Event | Description |
|---|---|
| `joinedWall` | Confirms wall join; payload includes `wallId`. |
| `initialOpenings` | Sent on join; payload includes `wallId` and all current openings. |
| `openingUpdated` | Broadcast to room when an opening is changed. |
| `openingDeleted` | Broadcast to room when an opening is deleted. |
| `newOpening` | Broadcast to room when a new default opening is created. |
| `error` | Server-side error (e.g. wall not found, rate limit exceeded). |

---

## REST Endpoints

| Method | Path | Description |
|---|---|---|
| `DELETE` | `/old-walls` | Delete walls not updated in the last N days. Accepts optional `?daysBack=` query param (min/default: 7). |

---

## Rate Limiting

New wall creation is rate-limited to **10 walls per IP per hour**. Joining an existing wall (by providing a valid `wallId`) does not count toward the limit.

---

## Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org)
- [Docker](https://www.docker.com)

### Installation

```bash
git clone https://github.com/akivabuckman/wall-openings-be.git
cd wall-openings-be
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5400/wallopenings
```

### Run locally

Start the database:

```bash
docker compose up -d wallopenings-db
```

Start the server:

```bash
npm run dev
```

Server will be available at [http://localhost:5000](http://localhost:5000).

### Run with Docker

```bash
docker compose up --build
```

---

## Testing

Tests are written with **Jest** and **Supertest**. They test the Express HTTP layer in isolation — no real database or server is started.

```bash
npm test
```

---

## Deployment

Deployments are triggered automatically when a PR is **merged into `main`**.

The pipeline ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)):

1. Installs dependencies and runs **Jest tests** (fails pipeline on test failure)
2. Runs **`npm audit`** (fails on high/critical vulnerabilities)
3. Builds a Docker image tagged with the short Git SHA
4. Pushes the image to **AWS ECR**
5. SSHs into the **EC2** instance:
   - Prunes unused Docker images and volumes
   - Pulls the new image
   - Runs **Prisma migrations** (`prisma migrate deploy`) in a one-off container
   - Starts the new API container

### Required GitHub Secrets / Variables

| Name | Type | Description |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | Secret | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | Secret | AWS credentials |
| `EC2_HOST` | Secret | EC2 public IP or hostname |
| `EC2_SSH_KEY` | Secret | Private SSH key for EC2 |
| `DATABASE_URL` | Secret | Production PostgreSQL connection string |
| `ECR_REGISTRY` | Variable | ECR registry URL |

---

## Lambda Function

A scheduled **AWS Lambda function** calls `DELETE /old-walls` on a regular schedule to purge walls that have not been updated in 7 or more days. This keeps the database lean and prevents unbounded growth from abandoned sessions.

---

## Project Structure

```
src/
├── controllers/        # Express and Socket.IO request handlers
├── middleware/         # Rate limiter (wall creation)
├── models/             # Prisma database access functions
├── services/           # Business logic (default wall/opening creation)
├── socket/             # Socket.IO emit helpers
├── libs/               # Prisma client, Pino logger
├── utils/              # tryCatch wrapper
├── types.ts            # Shared TypeScript types
├── constants.ts        # App-wide constants
├── express.ts          # Express app setup and routes
└── server.ts           # HTTP server + Socket.IO initialisation
prisma/
├── schema.prisma       # Prisma schema (Wall, Opening)
└── migrations/         # SQL migration history
tests/
└── deleteOldWalls.test.ts  # Jest + Supertest tests for DELETE /old-walls
```
