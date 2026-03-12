# Architecture Overview

## System boundaries

- **HTTP API layer**: Express application defined in `src/app.ts`.
- **Gateway layer**: Discord gateway abstractions in `src/discord/gateway.ts`.
- **Quality gates**: lint, format, type-check, and tests enforced locally and in CI.

## Test strategy

- **Unit tests** for isolated behavior (`tests/unit`).
- **Integration tests** for API routes (`tests/integration`).
- **Mock Discord gateway tests** for protocol-level behavior without external dependencies (`tests/mock-gateway`).
- **API contract tests** validating implementation against `docs/api/openapi.yaml` (`tests/contract`).

## Delivery pipeline

- Local hooks: lint/format at commit time, typecheck + tests at push time.
- CI: build/lint/test with coverage publication.
- Release: semantic-release automates versioning + changelog.
