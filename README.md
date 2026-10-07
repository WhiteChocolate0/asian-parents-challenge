# 亞洲父母挑戰

「亞洲父母挑戰」是 mobile-first 的匿名趣味測驗：輸入暱稱、完成 15 題與三階段挑戰，查看家長魔王結果，再分享給朋友並解鎖挑戰圈排行。它不是心理診斷，也不是需要登入的社群平台。

## 快速開始

```bash
npm install
npm run dev:vercel
```

`npm run dev:vercel` 透過 Vercel CLI 同時提供 Vite 前端與 `/api/*` Functions，預設本機網址為 `http://localhost:3000`。只執行 `npm run dev` 無法測試 API。前端一律呼叫同源相對路徑，不設定 `VITE_API_BASE_URL`。

建立本地 server 環境變數檔（勿提交）：

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
LINE_OA_BASIC_ID=
```

目前 server 端必要 Supabase 設定為 URL 與 service-role key；`LINE_OA_BASIC_ID` 僅供 LINE handoff 使用。`SUPABASE_SERVICE_ROLE_KEY` 僅能存在 server environment，禁止加 `VITE_` 前綴或匯入前端。此專案沒有 browser Supabase client。

## 專案結構

- `src/`：React 頁面、元件、題庫、前端 API client 與樣式。
- `api/`：Vercel Functions；`api/_lib/` 是 server-only 共用服務與資料存取層。
- `shared/`：前後端共用的驗證、排名等 domain logic。
- `supabase/migrations/`：`campaign_001` 至 `campaign_009` 的活動 schema 與題庫 seed migrations。
- `tests/api/`、`api/_lib/*.test.ts`、`src/lib/*.test.ts`：API routing 與 unit tests。
- `docs/`：部署、Function inventory、資料庫與 LINE Bot integration 文件。

## 架構與 API

```text
Browser → same-origin /api/* → Vercel Functions → Supabase campaign schema
```

目前 7 個 Function entry points（Hobby 上限 12；建議維持 8 以下）：

| Route | Methods / 用途 |
|---|---|
| `/api/health` | `GET`；唯讀檢查 server env 與 Supabase 連線 |
| `/api/line-handoff` | `POST`；驗證 participant 對結果的擁有權後建立短效 LINE token |
| `/api/participants` | `POST` 建立匿名 participant；`GET/PATCH ?action=me` 讀取身分／更新公開榜同意 |
| `/api/quiz/:action` | `POST start/answer/result/complete`；`GET session`。`complete` 是 result 的別名 |
| `/api/referrals?action=...` | `POST ?action=open` 記錄開啟；`GET ?action=link` 取得固定邀請連結 |
| `/api/share` | `POST` 建立分享 token；`GET ?token=...` 讀取公開分享結果 |
| `/api/social` | `GET` 取得挑戰圈、全站榜、活動與洞察 |

分享結果的前端頁面路徑是 `/result/share/:token`；它向 `/api/share?token=...` 讀取必要公開資料。`src/lib/api.ts` 集中管理 browser API calls。Function 數量檢查與變更清單見 [`docs/vercel_function_inventory.md`](docs/vercel_function_inventory.md)。

## 測驗與社交資料

暱稱 2～12 字，不要求帳號、Email、電話或 LINE Login。瀏覽器以 localStorage 記住匿名 participant identity、quiz session 與未同步作答；Supabase 才是 session、答案與結果的資料來源。答案由 server 驗證並 upsert，結果由 server 根據資料庫題目與 scoring weights 計算。重新測驗會建立新 session；排行榜取每個 participant 最新完成的結果。全站排行榜預設不公開，需本人 opt-in。

分享 referral link 使用固定隨機 token；OPENED、STARTED、COMPLETED 事件形成直接挑戰圈，不建立好友關係。分享及 LINE handoff 的 raw token 僅在建立時回傳，資料庫存 SHA-256 hash；LINE handoff 有效 15 分鐘，且要求本人擁有已完成的測驗結果。完整跨 repository contract 見 [`docs/campaign_linebot_integration_contract.md`](docs/campaign_linebot_integration_contract.md)。

## 開發與驗證

```bash
npm test
npm run build
npm run check:functions
npm run predeploy
python3 -m unittest discover -s backend/tests -v
```

`npm run predeploy` 依序執行 unit tests、production build 與 Vercel Function count gate；超過 12 支會失敗，9–12 支會警告。新增 endpoint 前先確認能否合併進既有 domain router。

`npm run test:db-options` 會建立並清理少量 constraint 測試資料，只能用於經確認的 DEV environment；需要 `.env.development.local` 且 guard 要求 `SUPABASE_ENV=development`、project ref 與 URL 一致。不要用此指令測未知或 Production 資料庫。

目前 Supabase `extkwpghjfttamontqkl` 是 `PRE_RELEASE / HACKATHON INTEGRATION` 共用環境，不是隔離的 DEV project，也不可任意清除。`scripts/hackathon-e2e.mjs` 尚有合併路由前的 share / handoff API contract，完成 runner 更新前請勿執行 `npm run test:db:hackathon`。環境背景與 migration 順序見 [`docs/supabase-dev-bootstrap-plan.md`](docs/supabase-dev-bootstrap-plan.md)。

## Deployment

Vercel project 為 `asian-parents-challenge`，目前 Production 網域：<https://asian-parents-challenge.vercel.app>。Production deployment 於 2026-10-06 成功更新。重新部署前執行：

```bash
npm run predeploy
vercel --prod
```

Vercel Project 的 Production／Preview 環境變數應設定 server-side `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`，以及 handoff 所需的 `LINE_OA_BASIC_ID`。不得把秘密放進 `src/`、`public/` 或任何 `VITE_` 變數。部署後可用 `GET /api/health` 做唯讀連線檢查；不要以建立真實 token 的 endpoint 當 health check。

## Database 與環境責任

網站 migration 僅管理 `campaign` schema，不修改 LINE Bot 的 `linebot` state，也不擁有 shared reference tables。Migration 必須新增檔案，不覆寫已套用 migration；套用 Production 前須明確核對目標環境與資料影響。正式公開營運前，應另行建立獨立 Supabase DEV，並規劃 Vercel Preview → DEV、Production → Production。資料表與 handoff 權責以 migrations 及 integration contract 為準。

## 安全注意事項

- `api/_lib/supabase-admin.ts` 僅供 server-side API 使用；不可由 `src/` 匯入。
- Browser 不可提交可信任的 score、persona、ranking 或 participant ownership；server 必須重新驗證及計算。
- 不記錄 raw referral/share/handoff token、service-role key 或個人測驗答案。
- 測試資料只可精確清理本次建立的紀錄；禁止 `TRUNCATE`、整表刪除或 schema reset。
