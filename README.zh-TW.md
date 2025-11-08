# VerifyTrade Monorepo

此專案包含 VerifyTrade 後端（Express + TypeORM）與前端（React + Vite）。後端提供 JWT 驗證、使用者 / 交易表單 / 交易紀錄 API，以及 Verifier/Qrcode 與 OpenAPI 規格；前端直接串接這些 API，完成登入、建立交易、提交 VC、查看交易紀錄等流程。

## 環境需求
- Node.js 20.19 以上（或 22.12 以上）與 pnpm 10.20+
- Docker（選用）可透過 `docker-compose.db.yml` 啟動 Postgres

## 快速開始
```bash
pnpm install

# 啟動開發用 Postgres（選用）
pnpm run dev:compose:up --filter @verifytrade/backend

# 啟動後端（會讀取 app/backend/.env）
pnpm --filter @verifytrade/backend dev

# 啟動前端（使用 VITE_API_BASE_URL）
pnpm --filter frontend dev
```
後端啟動後，可在 `http://localhost:3000/docs` 使用 Swagger UI。

## 環境變數說明
- 複製 `app/backend/.env.example` 為 `.env`，設定 `DATABASE_URL`、`JWT_SECRET`、`JWT_REFRESH_SECRET` 與 `CORS_ORIGINS`（多個來源以逗號分隔）。
- 前端會讀取已提交的 `app/frontend/.env.development.local`，其中 `VITE_API_BASE_URL` 預設指向 `http://localhost:3000/api/v1`。
- 後端登入後會回傳 `token`（需放在 `Authorization: Bearer <JWT>`）並設定 HttpOnly `refresh_token` cookie；401 會由 API client 自動呼叫 `/auth/refresh`。

## API 一覽
| Method | Path | 說明 |
| ------ | ---- | ---- |
| POST | `/api/v1/auth/login-by-verifier` | 由 Verifier 交易換取 `{ token, user }` 與 refresh cookie |
| GET | `/api/v1/auth/me` | 取得目前登入者資料 |
| GET | `/api/v1/users` / `/api/v1/users/{id}` | 使用者列表 / 單筆資料 |
| GET / POST | `/api/v1/tradeforms` | 查詢或建立交易表單 |
| GET | `/api/v1/tradeforms/{id}` / `/api/v1/tradeforms/uid/{uid}` | 以數字 id 或公開 UID 取得交易 |
| POST | `/api/v1/tradeforms/{uid}/verify-vc` | 提交 VC，403 會在 `details.missing_claims` 回傳缺少的 Claims |
| POST | `/api/v1/tradeforms/{uid}/confirm` | 建立方／確認方提交交易確認 |
| GET / POST | `/api/v1/transactions` | 以目前登入者為篩選的交易紀錄，並提供別名建立 API |
| GET | `/api/v1/transactions/{uid}` | 查看單筆交易（含角色資訊） |
| POST | `/api/v1/verifier/result` | QR Code 驗證結果輪詢 |
| GET | `/health` | 回傳 `{ ok: true, ... }` 供監控使用 |

所有保護路由皆需 `Authorization: Bearer <JWT>` header。

## 前端整合
共用 API client 位於 `src/lib/apiClient.ts`，使用 `fetch` 自動帶入 JWT、在 401 時重試 `/auth/refresh`，並提供 `authApi / tradeformsApi / transactionsApi / vcApi` 等封裝。

```ts
import { transactionsApi } from "@/lib/apiClient";

const { data } = await transactionsApi.list();
await transactionsApi.create({
  itemName: "出租套房",
  itemDescription: "台北市雙人房，含家具",
  itemCondition: "LIKE_NEW",
  amount: "18000",
  tradeChannel: "IN_PERSON",
  paymentMethod: "BANK_TRANSFER",
  matchmakingChannel: "OFFLINE_AGREEMENT",
  identityRequirements: ["EMPLOYEE_ID"],
  userRating: 5,
});
```

## 開發備忘
- CORS 依 `CORS_ORIGINS` 驗證來源並開啟 `credentials`，請設定為前端網址（例：`http://localhost:5173`）。
- `/health` 固定回傳 `{ ok: true, uptimeSec, version }`；`/ready` 仍保留依賴檢查。
- 新增 `UsersController` 與 `TransactionController` 以補齊 users/transactions API。
- 重新產生 Swagger 與 TSOA route：`pnpm --filter @verifytrade/backend openapi`。
- 已執行 `pnpm --filter @verifytrade/backend test -- routes/health.spec.ts`。
- 目前 `pnpm --filter frontend build` 在 Node 22.11.0 會因 Rolldown/Vite 綁定缺失失敗，請使用 Node 20 LTS 或 22.12+ 進行建置。

更多整合細節請參考 `INTEGRATION_NOTES.md`。
