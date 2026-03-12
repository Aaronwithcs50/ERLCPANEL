# ERLCPANEL API

## Highlights
- Bearer-token auth middleware backed by persisted `ApiToken` records in `packages/db`.
- Standard response envelope with `success`, `data`/`error`, `pagination`, and `traceId`.
- Fixed-window rate limiting with `Retry-After` support.
- OpenAPI published at `apps/api/openapi.yaml`.

## Local run
```bash
npm install
npm run dev
```

For a non-watch startup, run:

```bash
npm start
```

Both commands use the unified API startup entrypoint at `src/server.js`.

Use bootstrap token `dev-bootstrap-token` (or override with `BOOTSTRAP_API_TOKEN`).
