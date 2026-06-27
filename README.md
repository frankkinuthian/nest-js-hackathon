# Hackathon Backend API

A production-style [NestJS 11](https://nestjs.com/) API (Express adapter) with
authentication, edge security, and a managed Postgres database wired in.

## Stack

| Concern        | Choice                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| Framework      | NestJS 11 (Express), ESM, TypeScript (NodeNext)                           |
| Auth           | [Better Auth](https://better-auth.com) via `@thallesp/nestjs-better-auth` |
| Security       | [Arcjet](https://arcjet.com) — Shield (WAF) + rate limiting               |
| ORM / Database | Prisma 7 (`prisma-client` generator) + Prisma Postgres                    |
| DB driver      | `@prisma/adapter-pg` over the direct connection string                    |
| Validation     | `class-validator` + `class-transformer` (global ValidationPipe)           |

## Project structure

```
src/
├── app.module.ts            # Root module: Config, Arcjet, Prisma, Auth
├── main.ts                  # Bootstrap (ValidationPipe, body parser disabled)
├── common/
│   ├── decorators/          # @ResponseMessage
│   ├── guards/              # ArcjetGuard (global, via APP_GUARD)
│   └── interceptors/        # Response envelope interceptor
├── generated/prisma/        # Generated Prisma client (gitignored)
├── lib/                     # Infrastructure integrations (one folder each)
│   ├── arcjet/              # Arcjet logger bridge
│   ├── auth/auth.ts         # Better Auth instance
│   └── database/            # @Global() PrismaModule + PrismaService
└── module/
    ├── hackathon/           # Hackathon CRUD + join
    │   ├── dto/             # CreateHackathonDto, UpdateHackathonDto
    │   ├── hackathon.controller.ts
    │   ├── hackathon.module.ts
    │   └── hackathon.service.ts
    └── user/                # User module
prisma/
├── schema.prisma            # Better Auth + Hackathon models
└── migrations/
```

## Setup

```bash
pnpm install
```

Two env files are used (both gitignored). Earlier files take precedence:

`.env` — runtime + Prisma CLI:

```dotenv
DATABASE_URL="postgres://...@db.prisma.io:5432/postgres?sslmode=require"
```

`.env.development.local` — app secrets:

```dotenv
ARCJET_KEY=ajkey_...
ARCJET_MODE=LIVE            # LIVE enforces; DRY_RUN logs only
BETTER_AUTH_SECRET=...      # 32+ chars: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
```

## Database

```bash
pnpm run db:migrate         # prisma migrate dev
pnpm run db:generate        # regenerate the client
pnpm run db:studio          # browse data
```

## Run

```bash
pnpm run start:dev          # watch mode
pnpm run start:prod         # node dist/src/main.js
```

## Authentication

Better Auth follows the official [NestJS integration](https://better-auth.com/docs/integrations/nestjs):

- Auth routes are mounted under **`/api/auth`** (e.g. `POST /api/auth/sign-up/email`,
  `POST /api/auth/sign-in/email`, `GET /api/auth/ok`).
- Email + password sign-up/sign-in is enabled. No social providers or email
  verification yet.
- A **global `AuthGuard` protects every route by default.** Opt out per
  route/controller with `@AllowAnonymous()` or `@OptionalAuth()`, and read the
  session with the `@Session()` decorator.

### Roles

Users have a `role` enum — `PARTICIPANT` (default) or `ADMIN`. The role is
**server-side only**: declared as a Better Auth additional field with
`input: false`, so it is rejected from the sign-up payload and cannot be
self-assigned. Protect routes with `@Roles(["ADMIN"])` or `@Roles(["PARTICIPANT"])`.

## Validation

A global `ValidationPipe` (configured in `main.ts`) validates all incoming DTOs
using `class-validator` decorators. Invalid requests return a `400` with a clean
array of errors:

```json
{
  "statusCode": 400,
  "message": [
    {
      "property": "name",
      "message": "name must be longer than or equal to 3 characters"
    },
    {
      "property": "startsAt",
      "message": "minimal allowed date for startsAt is ..."
    }
  ],
  "error": "Bad Request"
}
```

The pipe also strips unknown properties (`whitelist: true`) and transforms
payloads into DTO class instances (`transform: true`).

## API — Hackathons

All write operations require an authenticated admin. Read operations are public.

| Method | Endpoint               | Access      | Description            |
| ------ | ---------------------- | ----------- | ---------------------- |
| POST   | `/hackathons`          | ADMIN       | Create a hackathon     |
| GET    | `/hackathons`          | Public      | List all hackathons    |
| GET    | `/hackathons/:id`      | Public      | Get a single hackathon |
| PATCH  | `/hackathons/:id`      | ADMIN       | Update a hackathon     |
| DELETE | `/hackathons/:id`      | ADMIN       | Delete a hackathon     |
| POST   | `/hackathons/:id/join` | PARTICIPANT | Join a hackathon       |

### Join rules

- Hackathon must exist, be active (`isActive: true`), and not ended (`endDate` in the future).
- Duplicate joins throw `400 Bad Request`.

## Security

Every request passes through a global `ArcjetGuard` running Shield (WAF) and a
fixed-window rate limit (10 requests / 60s per IP). Set `ARCJET_MODE=DRY_RUN`
to log decisions without blocking. Note the rate limit also applies to
`/api/auth/*`, so heavy auth testing from one IP may return `429`.

## Tests

```bash
pnpm run test               # unit
pnpm run test:e2e           # e2e
pnpm run test:cov           # coverage
```

## Conventions

See [`AGENTS.md`](./AGENTS.md). In short: NestJS-first patterns, constructor
injection only (no direct `new Service()`), each infrastructure integration in
its own `src/lib/<name>/` module, feature modules in `src/module/<name>/`,
shared guards/interceptors/decorators in `src/common/`.
