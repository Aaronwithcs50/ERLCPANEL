# ERLCPANEL

Repository-wide developer tooling baseline for a TypeScript service.

## Tooling included

- ESLint + Prettier + TypeScript type-check pipeline.
- Unit, integration, mock Discord gateway, and API contract tests.
- Git hooks for pre-commit, pre-push, and conventional commit linting.
- GitHub Actions for CI, security scanning, coverage, and semantic release.
- Documentation set: architecture, onboarding, contributor guide, and generated API docs site.

## Quick start

```bash
npm install
npm run prepare
npm run lint
npm run format
npm run typecheck
npm test
```

## Docs

- Architecture: `docs/architecture/README.md`
- Onboarding: `docs/onboarding.md`
- Contributor guide: `CONTRIBUTING.md`
- OpenAPI spec: `docs/api/openapi.yaml`
- Generate docs site: `npm run docs:build`
