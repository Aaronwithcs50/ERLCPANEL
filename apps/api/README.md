# ERLCPANEL API

## Highlights
- Bearer-token auth middleware backed by persisted `ApiToken` records in `packages/db`.
- Standard response envelope with `success`, `data`/`error`, `pagination`, and `traceId`.
- Fixed-window rate limiting with `Retry-After` support.
- OpenAPI published at `apps/api/openapi.yaml`.

## Local run
```bash
npm install
npm start
```

## Bootstrap/admin token provisioning
There is no hardcoded fallback token.

Provision a bootstrap admin token explicitly:

```bash
npm run tokens:provision-admin --workspace=@erlcpanel/api
```

This command prints the plaintext token once at creation time and stores only a hash in the database.

Optional one-time startup provisioning can be enabled with:

```bash
API_TOKEN_BOOTSTRAP_ON_STARTUP=true BOOTSTRAP_API_TOKEN='<secure-token>' npm start --workspace=@erlcpanel/api
```
