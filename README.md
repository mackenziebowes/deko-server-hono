# Deko/Server-Hono

A starter pack for rapid scaffolding.

[See Deko Overview](https://github.com/mackenziebowes/deko/blob/main/README.md) for more details on why this repo exists.

## Getting Started

To install dependencies:

```sh
bun install
```

To run:

```sh
bun run dev
```

Open http://localhost:3000

## Architecture Overview

- Server uses Hono framework with two route namespaces:
  - `/sona/*` - Public routes for authentication flows
  - `/vona/*` - Protected routes requiring authentication

## Key Components

- **Middleware**: Authentication and logging
- **Helpers**: Crypto, email, and time utilities
- **Routes**: Endpoint handlers organized by domain
- **Database**: Prisma ORM client

## Adding New Features

1. Create route handlers in appropriate namespace
2. Use existing middleware patterns for auth/logging
3. Add types in `types/` directory
4. Leverage helper utilities from `library/helpers/`

## Authentication

- JWT-based with email verification, magic links, and password flows
- Protected routes use auth middleware that validates JWT tokens

## Database

- Uses Prisma ORM - see `utils/db.ts` for connection pattern
