# Contributor Guide

## Commit standards

- Follow [Conventional Commits](https://www.conventionalcommits.org/).
- Commit messages are validated by commitlint via `.husky/commit-msg`.

## Definition of done

- `npm run lint`
- `npm run format`
- `npm run typecheck`
- `npm test`
- Update OpenAPI spec and docs when API behavior changes.

## Branch and PR expectations

- Keep changes small and focused.
- Include tests for behavioral changes.
- Document architecture-impacting decisions in `docs/architecture/README.md`.
