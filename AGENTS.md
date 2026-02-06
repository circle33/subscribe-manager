# Repository Guidelines

## Project Structure & Module Organization
This repository is currently a planning-only workspace. The execution plan lives in `./PLANS.md` and must be kept up to date as work proceeds. No source, tests, or assets have been generated yet. When implementation starts, expect a structure similar to:

- `src/` for Worker code and frontend assets (e.g., `src/worker.js`, `src/index.html`, `src/app.js`, `src/styles.css`)
- `wrangler.toml` for Cloudflare Worker configuration
- `tests/` (or `src/tests.js`) if unit tests are added

## Build, Test, and Development Commands
Commands are not yet defined because the project has not been scaffolded. Once Cloudflare Workers tooling is added, expected commands include:

- `wrangler dev`: run the Worker locally
- `wrangler deploy`: deploy to Cloudflare
- `npm test`: run unit tests (if Jest or another framework is configured)

## Coding Style & Naming Conventions
No style rules are established yet. When code is added:

- Use consistent 2-space indentation for JS/TS and JSON.
- Prefer descriptive, action-oriented function names (e.g., `handleLogin`, `listSubscriptions`).
- Keep filenames lowercase with hyphens only if needed (e.g., `app.js`, `worker.js`).

## Testing Guidelines
Testing is not set up yet. If tests are added, document:

- The test runner (e.g., Jest, Vitest)
- Naming patterns (e.g., `*.test.js`)
- Minimum coverage goals (if any)
- How to run the suite (e.g., `npm test`)

## Commit & Pull Request Guidelines
No commit history exists yet, so no convention is established. Until one emerges:

- Use clear, imperative commit messages (e.g., "Add login endpoint").
- In PRs, include a short description, list of changes, and any relevant screenshots for UI changes.

## Configuration & Planning Notes
The execution plan in `./PLANS.md` is authoritative and must be maintained. If you change scope, dependencies, or decisions, update the relevant sections there (Progress, Decision Log, Surprises & Discoveries).
