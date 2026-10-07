# Vercel Function Inventory

Vercel treats source files below `api/` as function entry points, except files in underscore-prefixed private directories such as `api/_lib/`. Tests are kept outside the public function tree.

## Before consolidation

The dashboard confirmed the deployment exceeded the Hobby limit of 12. The source tree contained 13 intended handlers plus `api/line-handoff.test.ts` at the API root (a test file that could also be treated as an entry point).

| Current Function | Route | HTTP Methods | Purpose | Frontend Caller | Can Consolidate | Target Function |
|---|---|---|---|---|---|---|
| `api/health.ts` | `/api/health` | GET | Runtime health check | Operational check | No | `api/health.ts` |
| `api/line-handoff.ts` | `/api/line-handoff` | POST | Ownership-checked, one-time LINE handoff | `createLineHandoff()` | No; security boundary | `api/line-handoff.ts` |
| `api/participants.ts` | `/api/participants` | POST | Create anonymous participant | `registerParticipant()` | Yes | `api/participants.ts` |
| `api/participants/me.ts` | `/api/participants/me` | GET, PATCH | Read identity / update public leaderboard opt-in | `getParticipantMe()`, `setLeaderboardOptIn()` | Yes | `/api/participants?action=me` |
| `api/quiz/start.ts` | `/api/quiz/start` | POST | Start quiz session | `startQuiz()` | Yes | `api/quiz/[action].ts` |
| `api/quiz/answer.ts` | `/api/quiz/answer` | POST | Save/upsert answer | `saveAnswer()` | Yes | `api/quiz/[action].ts` |
| `api/quiz/session.ts` | `/api/quiz/session` | GET | Resume session | `getQuizSession()` | Yes | `api/quiz/[action].ts` |
| `api/quiz/result.ts` | `/api/quiz/result` | POST | Calculate/persist result | `getQuizResult()` | Yes | `api/quiz/[action].ts` |
| `api/referrals/open.ts` | `/api/referrals/open` | POST | Record referral open | `openReferral()` | Yes | `api/referrals.ts?action=open` |
| `api/referrals/link.ts` | `/api/referrals/link` | GET | Get participant referral link | `getReferralLink()` | Yes | `api/referrals.ts?action=link` |
| `api/share.ts` | `/api/share` | POST | Create public share token | `createShare()` | Yes | `api/share.ts` |
| `api/share/[token].ts` | `/api/share/:token` | GET | Read public share result | `getSharedResult()` | Yes | `api/share.ts?token=...` |
| `api/social.ts` | `/api/social` | GET | Social overview and leaderboards | `getSocialOverview()` | No | `api/social.ts` |
| `api/line-handoff.test.ts` | Not an API route | Test file | Handoff route tests | None | Move out of `api/` | `tests/api/line-handoff.test.ts` |

## After consolidation

| Function | Routes / Actions | Methods | Count |
|---|---|---|---:|
| `api/health.ts` | `/api/health` | GET | 1 |
| `api/line-handoff.ts` | `/api/line-handoff` | POST | 1 |
| `api/participants.ts` | `/api/participants`, `/api/participants?action=me` | POST, GET, PATCH | 1 |
| `api/quiz/[action].ts` | `/api/quiz/start`, `/answer`, `/session`, `/result`, `/complete` | POST, GET | 1 |
| `api/referrals.ts` | `/api/referrals?action=open|link` | POST, GET | 1 |
| `api/share.ts` | `/api/share`, `/api/share?token=...` | POST, GET | 1 |
| `api/social.ts` | `/api/social` | GET | 1 |
| **Total** |  |  | **7** |

The quiz dynamic route preserves the existing `/api/quiz/<action>` paths. Participant and referral paths now use action query parameters; public share lookup uses `GET /api/share?token=...`. Business/data operations continue to use existing `api/_lib` services. The LINE handoff remains a separate function.
