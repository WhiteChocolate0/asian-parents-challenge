# Vercel Deployment Failure Report

Checked: 2026-10-06 (Asia/Taipei)  
Project: `asian-parents-challenge`  
Deployment: `dpl_D7XNB6FPZaob8GWzdmNPtmrCGovJ` (`https://asian-parents-challenge-ptdkpc8e6-white-chocolates-projects.vercel.app`)  
Status: **ERROR**; target `production`. No redeployment was attempted during this diagnosis.

## Deployment status and failing stage

Vercel build logs show dependency installation completed, `npm run build` completed successfully (`tsc --noEmit && vite build`), Vite transformed 74 modules, and Vercel reported `Build Completed in /vercel/output [32s]`. The next logged stage is `Deploying outputs...`; the final event is `status ● Error`.

**Failing stage:** Vercel output deployment/activation, after successful project build.  
**Category:** `OTHER` — platform deployment-output stage; the specific underlying error was not exposed by the available deployment log.

## First root error

No underlying root error is present in the retrieved build log. The first explicit failure signal is the terminal `status ● Error` after `Deploying outputs...`, which identifies the failed stage but not its cause. The build log contains no TypeScript, Vite, dependency-install, function-bundle, or environment-validation error before that point.

Vercel CLI's deployment detail response also reports the deployment as `ERROR` while its build record is `READY`, with no error code/message in the returned fields. A read-only direct deployment-detail API query failed with `getaddrinfo ENOTFOUND api.vercel.com`; it was not retried.

## Secondary observations

- Vercel dependency installation completed (`up to date`). It emitted an `install-scripts` warning for `esbuild@0.27.0` and `esbuild@0.21.5`; the Vercel build nevertheless completed. This is a warning, not an identified deployment root cause.
- `vercel inspect --logs` contains repeated TypeScript version notices for API builds, but no function build error.
- Local `npm install`: PASS (`added 1 package`).
- Local `npm test`: PASS (21 tests).
- Local `npm run build`: PASS (TypeScript and Vite).
- Local `vercel build --prod`: BLOCKED before packaging because this workspace has no pulled Vercel project settings (`project_settings_required`). This local setup issue does not explain the remote deployment, whose project settings were available to Vercel.
- `LINE_OA_BASIC_ID` is listed in the linked Vercel project's Production and Preview environments. No build log indicates environment validation failure. The variable is read by the handoff API at request time; it is not identified as the deployment error's root cause.

## Affected files, likely cause, and minimal fix

**Affected source files:** none identified. No application or configuration files were changed during this diagnosis.  
**Likely cause:** unresolved Vercel output deployment/activation failure; the available log is insufficient to distinguish a platform/output issue from an undisclosed deployment configuration issue.  
**Minimal fix:** unknown until Vercel exposes the deployment error detail/event after `Deploying outputs...`. Do not change application code, environment variables, or dependencies based only on the install warning.

**Risk:** changing code or dependencies without the missing error detail may introduce unrelated regressions. The remote app build itself is verified successful; deployment readiness is not.

## Reproduction and scope

The application build and unit suite pass locally. The remote log independently confirms the same application build passed. Vercel project linking exists and identifies `asian-parents-challenge`; project and organization IDs were not printed. `vercel pull --yes --environment=production` was attempted, but the CLI's team/project requests failed with `getaddrinfo ENOTFOUND api.vercel.com`; no project-settings or environment files were created. A subsequent `vercel build --prod` stopped before packaging with `project_settings_required`, so `.vercel/output` was not produced. No database, RPC, LINE handoff endpoint, or token was accessed or modified.

## Environment variable assessment

`LINE_OA_BASIC_ID` is **not evidenced as the root cause**. It is configured for the Production environment, and the deployment log fails only after the successful build at output deployment. There is no environment-validation error in the retrieved log.

## Local project-link and function audit (2026-10-06 follow-up)

- `.vercel/project.json`: present; linked project name is `asian-parents-challenge`; project and org IDs are present (not reproduced here).
- `vercel pull`: not completed; debug output identifies `ENOTFOUND api.vercel.com` while requesting team/project settings. No secret values were printed.
- `vercel.json`: absent. Therefore no checked-in rewrites, redirects, headers, legacy `builds`/`routes`, or custom runtime declarations could be conflicting.
- `.vercel/output/config.json`, `.vercel/output/static`, `.vercel/output/functions`: absent because local Vercel packaging never started.
- API functions use same-repository relative imports and `@vercel/node` type imports. Runtime Node built-ins are `node:crypto`/`node:crypto.randomUUID`; server external dependency is `@supabase/supabase-js`. `npm run build` TypeScript checking resolves these imports, but a Vercel function bundle was not produced, so bundle size/runtime output cannot be certified.
- `npm test` and `npm run build` were previously verified PASS (21 tests at that check). No application source/config changes were made during this follow-up.

**Conclusion:** local Vercel output audit is **BLOCKED by project-settings retrieval**, not successful/ready. The remote deploy-stage root cause remains unknown. Manual evidence needed: Vercel Dashboard → Project → Deployments → failed deployment → Deployment Details / Build Logs. Capture the first error/event immediately after `Deploying outputs...`, including error code/message and any Functions build/validation panel; do not include environment values.

## Confirmed root cause and resolution (2026-10-06)

The Vercel Dashboard subsequently exposed the deployment error: **“No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan.”** This supersedes the earlier “unknown platform error” assessment above. It is not caused by `LINE_OA_BASIC_ID`, Supabase, RPC, TypeScript, or Vite.

- Confirmed pre-change source inventory: 13 intended API handler files, plus a root-level API test file that was moved out of `api/` to avoid it being treated as a function candidate.
- Resolution: consolidate quiz routes into `api/quiz/[action].ts`, participant identity operations into `api/participants.ts`, referral operations into `api/referrals.ts`, and public share lookup/create into `api/share.ts`.
- `api/line-handoff.ts` remains isolated because it is a security-sensitive ownership/token boundary.
- After-consolidation count: 7 functions, verified by `npm run check:functions`.
- Local tests and build are checked with `npm run predeploy`; no deployment is performed as part of this change.
