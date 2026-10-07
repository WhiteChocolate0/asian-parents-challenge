# Repository Guidelines

## Project Structure & Module Organization

This repository contains a mobile-first React/Vite quiz and same-origin Vercel Functions. Browser code lives in `src/`: reusable screens and components are under `src/components/`, quiz content under `src/data/`, and client helpers/tests under `src/lib/`. Serverless endpoints are in `api/`; shared server-only API helpers are in `api/_lib/`. Supabase migrations are in `supabase/migrations/` and use the `campaign_NNN_*.sql` naming pattern. Static images and fonts belong in `src/assets/`. The small Python service and its tests are under `backend/`.

## Build, Test, and Development Commands

- `npm run dev:vercel` starts Vite and Vercel Functions together at `http://localhost:3000`; use this for API work. `npm run dev` starts only Vite.
- `npm run build` runs TypeScript checks and creates the production frontend bundle.
- `npm test` runs the Vitest unit tests.
- `python3 -m unittest discover -s backend/tests -v` runs Python tests.
- `npm run test:db-options` checks database option constraints against the explicitly configured development environment.
- `npm run test:db:hackathon` runs integration E2E and requires explicit safety environment variables; never point tests at Production.

## Coding Style & Naming Conventions

Follow the existing TypeScript/React style: two-space indentation, semicolons omitted, single quotes, PascalCase React components, and camelCase functions/variables. Keep components focused and reusable; use descriptive CSS classes following the existing block-element style (for example, `quiz-page__title`). Keep browser API calls same-origin (`/api/...`). Never import `api/_lib/supabase-admin.ts` from `src/`, expose service-role credentials, or add `VITE_` prefixes to server secrets. No formatter or lint script is currently configured; keep changes consistent with nearby files.

## Testing Guidelines

Add Vitest tests beside domain logic as `*.test.ts` (for example, `src/lib/scoring.test.ts`). Run `npm test` and `npm run build` after a coherent change. Database integration tests mutate data and require the documented environment guards and test markers; do not run them against Production or perform broad cleanup.

## Commit & Pull Request Guidelines

No Git history is available in this checkout, so no established commit convention could be verified. Use a short imperative summary, such as `Fix quiz answer navigation`. PRs should explain user-visible behavior, list tests run, call out migration or environment-variable changes, and include mobile screenshots for UI changes. Keep unrelated refactors out of focused changes.

## Security & Configuration

Keep local environment files and `.vercel/` out of commits. `SUPABASE_SERVICE_ROLE_KEY` is server-only; browser requests must go through Vercel Functions. Review migrations for data-safety and environment scope before applying them.
