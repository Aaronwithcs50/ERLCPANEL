# ERLCPANEL

A TypeScript monorepo for the ERLC panel ecosystem, including API, bot, web, shared packages, and database tooling.

## What is in this repo

- `apps/api` – Express API service.
- `apps/bot` – Discord bot service.
- `apps/web` – Next.js web frontend.
- `packages/db` – Prisma schema, migrations, and seed scripts.
- `packages/shared` – Shared constants, validators, and types.
- `clients/node` and `clients/python` – SDK/client packages.
- `docs` – Architecture docs, onboarding, API spec, and process docs.

## Prerequisites

Install these before running anything:

- **Node.js 20+** (required by the repo engines).
- **Corepack enabled** (to use the pinned `pnpm` version from `packageManager`).
- **Git**.
- **PostgreSQL** (for database-backed features).
- **Redis** (for caching/rate-limit/session-related features).

## Full setup (step-by-step)

From the repository root:

1. **Clone and enter the repository**

   ```bash
   git clone <your-repo-url>
   cd ERLCPANEL
   ```

2. **Enable Corepack and pnpm**

   ```bash
   corepack enable
   corepack prepare pnpm@9.0.0 --activate
   pnpm --version
   ```

3. **Install dependencies**

   ```bash
   pnpm install
   ```

4. **Create local environment file**

   ```bash
   cp .env.example .env
   ```

5. **Fill in required values in `.env`**
   - `BOT_TOKEN`, `BOT_CLIENT_ID`, `BOT_GUILD_ID`
   - `API_JWT_SECRET`
   - `DATABASE_URL`, `SHADOW_DATABASE_URL`
   - `REDIS_URL`

6. **Start PostgreSQL and Redis**
   - Ensure both services are running and reachable from values in `.env`.

7. **Run database migrations and seed**

   ```bash
   pnpm --filter @packages/db run migrate:dev
   pnpm --filter @packages/db run seed
   ```

8. **Install Git hooks**

   ```bash
   pnpm run prepare
   ```

9. **Run validation checks**

   ```bash
   pnpm run lint
   pnpm run format
   pnpm run typecheck
   pnpm test
   ```

10. **Start services for development**

- Start everything in parallel:

  ```bash
  pnpm run dev:all
  ```

- Or start individually:

  ```bash
  pnpm --filter @erlcpanel/api run dev
  pnpm --filter @apps/bot run dev
  pnpm --filter @apps/web run dev
  ```

## Run in VS Code (everything you need)

This section is meant to be a complete VS Code workflow.

### 1) Open the project correctly

- Open the **repo root** (`ERLCPANEL`) in VS Code, not a nested folder.
- Use one integrated terminal per service if running API/Bot/Web separately.

### 2) Install recommended VS Code extensions

- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier - Code formatter** (`esbenp.prettier-vscode`)
- **EditorConfig** (`editorconfig.editorconfig`) (optional)
- **Prisma** (`Prisma.prisma`) (recommended for `packages/db`)

### 3) Select the correct Node runtime

- Make sure VS Code terminal is using Node 20+:

  ```bash
  node -v
  ```

- If not, switch Node versions (for example via `nvm`) and reopen VS Code.

### 4) Configure environment variables

- Copy env file in terminal:

  ```bash
  cp .env.example .env
  ```

- Edit `.env` in VS Code and set real secrets/connection strings.

### 5) Install dependencies in VS Code terminal

```bash
corepack enable
corepack prepare pnpm@9.0.0 --activate
pnpm install
pnpm run prepare
```

### 6) Prepare the database

```bash
pnpm --filter @packages/db run migrate:dev
pnpm --filter @packages/db run seed
```

### 7) Start development servers

- One command for all packages:

  ```bash
  pnpm run dev:all
  ```

- Or run services in separate terminals:

  ```bash
  pnpm --filter @apps/web run dev
  pnpm --filter @erlcpanel/api run dev
  pnpm --filter @apps/bot run dev
  ```

### 8) Use VS Code checks before committing

```bash
pnpm run lint
pnpm run format
pnpm run typecheck
pnpm test
```

### 9) Troubleshooting in VS Code

- If imports/types are stale: `TypeScript: Restart TS Server` from Command Palette.
- If ESLint is not running: confirm extension is enabled and workspace root is open.
- If format changes are unexpected: run `pnpm run format:fix` and re-check.
- If env values are ignored: stop/start running terminals after editing `.env`.

## Common commands

```bash
pnpm run dev            # root TypeScript service (src/server.ts)
pnpm run build
pnpm run start
pnpm run lint
pnpm run lint:fix
pnpm run format
pnpm run format:fix
pnpm run typecheck
pnpm test
pnpm run test:coverage
pnpm run docs:build
```

## Documentation

- Architecture: `docs/architecture/README.md`
- Onboarding: `docs/onboarding.md`
- Contributor guide: `CONTRIBUTING.md`
- OpenAPI spec: `docs/api/openapi.yaml`
- API app notes: `apps/api/README.md`
- Node client docs: `clients/node/README.md`
- Python client docs: `clients/python/README.md`

## Contributing

1. Create a feature branch.
2. Make focused changes.
3. Run lint, format, typecheck, and tests.
4. Follow conventional commits.
5. Open a pull request with context and testing notes.
