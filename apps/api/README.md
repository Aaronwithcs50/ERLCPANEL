# ERLCPANEL API

## Highlights
- Bearer-token auth middleware backed by `ApiToken`.
- Standard response envelope with `success`, `data`/`error`, `pagination`, and `traceId`.
- Fixed-window rate limiting with `Retry-After` support.
- OpenAPI published at `apps/api/openapi.yaml`.

## Local run
```bash
npm install
npm start
```

Use bootstrap token `dev-bootstrap-token` (or override with `BOOTSTRAP_API_TOKEN`).
