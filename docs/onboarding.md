# Onboarding Guide

## Prerequisites

- Node.js 20+
- npm 10+

## First-time setup

1. Install dependencies: `npm install`
2. Install git hooks: `npm run prepare`
3. Build docs: `npm run docs:build`

## Daily workflow

1. Run quality pipeline: `npm run lint && npm run format && npm run typecheck && npm test`
2. Start local service: `npm run dev`
3. Validate specific suites as needed:
   - `npm run test:unit`
   - `npm run test:integration`
   - `npm run test:gateway`
   - `npm run test:contract`
