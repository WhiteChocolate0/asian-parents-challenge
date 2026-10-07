# Supabase PRE_RELEASE / HACKATHON INTEGRATION Environment

## Environment boundary

- Current project ref `extkwpghjfttamontqkl` is designated `PRE_RELEASE / HACKATHON INTEGRATION` for controlled MVP verification. It is not being treated as an operational production database during this phase.
- No new Supabase project is required for this hackathon validation round.
- E2E against the known ref is allowed only when `ALLOW_HACKATHON_E2E=true` and `SUPABASE_ENV=hackathon_integration` are explicitly set. All test records must be tracked by `test_run_id` or exact IDs returned for records created in that run.
- This environment contains no copied user data. Cleanup is limited to exact session, answer, result, share-token, and handoff-token rows created by the current run; bulk deletion and schema reset remain prohibited.
- The Asian Parents Vercel API uses only its `campaign` schema. It does not require Toyota shared `public` reference tables or Toyota `linebot` tables for the current quiz, result, share, or handoff-token flows.
- Toyota's `supabase/001`–`028`, `supabase/linebot_001_shared_boundary.sql`, and Toyota's `migrations/20261004_dev_001_*` / `20261004_dev_002_*` belong to the Toyota EV Line Bot project and are not part of this project's bootstrap sequence.
- Reassess separate Supabase DEV and Vercel Preview → DEV / Production → PROD separation before public launch.

## Migration order

| Order | File | Class | Scope |
| --- | --- | --- | --- |
| 1 | `campaign_001_quiz_sessions.sql` | SCHEMA migration | `campaign` schema, anonymous quiz sessions, timestamp trigger, RLS and grants |
| 2 | `campaign_002_quiz_answers.sql` | SCHEMA migration | Answers, one row per session/question, RLS and grants |
| 3 | `campaign_003_quiz_results.sql` | SCHEMA migration | Persisted quiz results, RLS and grants |
| 4 | `campaign_004_share_results.sql` | SCHEMA migration | Share token records, RLS and grants |
| 5 | `campaign_005_line_handoff_tokens.sql` | SCHEMA migration | Short-lived campaign handoff token records; this is not the Toyota `linebot` schema |
| 6 | `campaign_006_quiz_content.sql` | SCHEMA migration | Quiz question and option tables with scoring columns |
| 7 | `campaign_007_allow_three_quiz_options.sql` | SCHEMA correction | Allows A/B/C answer keys |
| 8 | `campaign_008_seed_asian_parents_quiz_v1.sql` | QUIZ seed | The canonical 15 questions, 45 A/B/C options, and four-dimension scoring weights |
| 9 | `campaign_009_social_challenge.sql` | SCHEMA migration | Participants, fixed referral links, referral events, attempt attribution, and latest-result leaderboard view |

No separate TEST fixture migration exists. Runtime integration tests create their own uniquely marked test data and may delete only the exact session IDs they created. No `linebot` schema or shared `public` tables are created by this project's migration set.

## Environment files

- `.env.hackathon.local` contains the current pre-release integration credentials and is ignored by Git.
- Run the integration harness only with explicit opt-in, for example: `ALLOW_HACKATHON_E2E=true SUPABASE_ENV=hackathon_integration SUPABASE_PROJECT_REF=extkwpghjfttamontqkl npm run test:db:hackathon`.
- `.env.development.local` is reserved for the dedicated DEV project and is ignored by Git. Start from `.env.development.example`; fill it locally after the DEV project is created. Never copy Production credentials into it.
- `SUPABASE_ENV=hackathon_integration`, `SUPABASE_PROJECT_REF=extkwpghjfttamontqkl`, and `ALLOW_HACKATHON_E2E=true` are required as explicit process variables to run the pre-release E2E harness. The runner verifies the URL/ref pair and has no destructive migration, truncation, or bulk cleanup path.
- Vercel currently serves the hackathon build against the pre-release integration project. Before public launch, map Preview → a dedicated Supabase DEV project and Production → Supabase Production. This round does not configure Vercel or deploy.

## Current setup state

- Pre-release project: available at the known project ref above.
- Current project schema and quiz seed through `campaign_008`: previously applied. Apply `campaign_009` to the intended project before deploying code that calls participant or social APIs; this document does not assert that `campaign_009` has been applied.
- A separate DEV project remains a pre-launch follow-up, not a blocker for this hackathon validation.
