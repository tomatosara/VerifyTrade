# VerifyTrade 後端

[![Node.js >=20](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-339933)](https://nodejs.org/)
[![pnpm workspace](https://img.shields.io/badge/pnpm-10.x-F69220)](https://pnpm.io/)

> 以 TypeScript、Express、TypeORM 與 TSOA 打造的數位身分交易平臺 API。

閱讀英文版 [README](./README.md)。

## 簡介

VerifyTrade 後端服務支援平臺上的交易與驗證流程。它提供管理交易單的 RESTful API、驗證可驗證憑證（VC）聲明、強制速率限制與冪等性，並向整合方提供 OpenAPI 3.1 規格。服務以 TypeScript 撰寫，搭配 Express、TypeORM（PostgreSQL）與 TSOA，以綱要驅動的方式自動產生路由。

## 技術堆疊

- Node.js 20+、pnpm 工作區、TSX 即時重新載入
- Express 4 與 TSOA 產生的控制器及 OpenAPI 3.1 規格
- TypeORM 0.3 + PostgreSQL 16，提供遷移與種子資料工具
- class-validator、class-transformer 與 zod 組成的驗證與設定解析
- JSON Web Token（jsonwebtoken）驗證，支援平台專用金鑰
- 具 request ID 的 Pino 結構化日誌、速率限制與冪等中介層
- Jest、Supertest、Testcontainers 建立可重現的資料庫測試
- 工具鏈：ESLint、dotenv/dotenv-expand、與 ts-node 相容的 CLI 腳本

## 專案結構

```text
src/
  app.ts                    # Express 應用初始化、中介層註冊與 Swagger 設定
  server.ts                 # 進程入口，含資料庫重試與啟動訊息
  config/                   # 以環境變數驅動的設定模組
  database/
    data-source.ts          # TypeORM DataSource 工廠
    migrations/             # 版本化的資料庫遷移檔
    seed/                   # 種子資料執行器與輔助工具
  docs/                     # OpenAPI 自訂與 Swagger UI 輔助函式
  http/                     # TSOA 認證適配器與自動產生路由
  middleware/               # 錯誤處理、日誌、速率限制、冪等、request ID 中介層
  modules/
    auth/                   # JWT 工具、開發用 token 控制器、使用者實體
    tradeform/              # 交易單實體、DTO、服務、控制器與資料存取層
    vc/                     # VC 政策驗證輔助函式
  routes/health.ts          # 系統與資料庫健康檢查端點
  utils/                    # 錯誤型別、記錄器、公開網址工具
openapi.json                # 由 pnpm openapi 產生的 OpenAPI 文件
tsoa.json                   # TSOA 設定（控制器、基底路徑、路由資料夾）
jest.config.ts              # 測試設定
```

## 環境變數

服務透過 `src/config/env.bootstrap.ts` 載入 `.env`（或在 `NODE_ENV=test` 時使用 `.env.test`）。請將 `app/backend/.env` 複製成自己的環境設定檔（例如 `.env.local`），並在部署前更新所有敏感值。

### 核心應用與安全

| 變數 | 是否必填 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `NODE_ENV` | 否 | `development` | 控制 Express 模式與功能開關（正式環境會停用開發用 token 端點）。 |
| `PORT` | 否 | `3000` | API 伺服器監聽的 HTTP 連接埠。 |
| `HOST` | 否 | `0.0.0.0` | 綁定位址；設為 `127.0.0.1` 可僅允許本機連線。 |
| `BASE_PATH` | 否 | `/` | 當服務部署在反向代理後，可為 `/api/v1` 加上額外前綴。 |
| `DEV_HTTPS` | 否 | `false` | 設為 `true` 時，啟動訊息中的公開 URL 改用 `https://`。 |
| `TRUST_PROXY` | 條件式 | `0` | 設定 Express `trust proxy`，可使用布林值、數字或 IP 字串。 |
| `JWT_SECRET` | 是（正式環境） | `dev-only-insecure-secret-change-me` | 使用者 JWT 簽章金鑰；正式環境未設定時伺服器會直接終止。 |
| `PLATFORM_JWT_SECRET` | 否 | 預設繼承 `JWT_SECRET` | 平台服務專用的第二組簽章金鑰。 |
| `JWT_ISSUER` | 否 | — | 驗證 JWT 時要求的 `iss` 值。 |
| `JWT_AUDIENCE` | 否 | — | 驗證 JWT 時要求的 `aud` 值。 |
| `RATE_LIMIT_WINDOW_MS` | 否 | `60000` | 對敏感端點套用的速率限制時間窗（毫秒）。 |
| `RATE_LIMIT_MAX` | 否 | `20` | 每個時間窗允許的最大請求數（依使用者/來源 IP 區分）。 |
| `ALLOWED_META_KEYS` | 否 | `chain_tx_hash,vc_user2` | 允許存放於交易單 `meta` 欄位的白名單鍵值。 |
| `SHARE_URL_BASE` | 否 | `https://app.example.com/join` | 組合對外分享連結時使用的基底 URL。 |

### 文件設定

| 變數 | 是否必填 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `SWAGGER_PATH` | 否 | `/docs` | Swagger UI 掛載路徑（也會影響開發模式的 CSP 調整）。 |
| `API_BASE_URL` | 否 | `http://localhost:3000` | OpenAPI `servers` 清單中的絕對網址。 |
| `SWAGGER_TITLE` | 否 | `Trading Platform API` | Swagger UI 顯示的標題。 |
| `SWAGGER_VERSION` | 否 | `1.0.0` | Swagger UI 顯示的版本號。 |

### 資料庫連線

| 變數 | 是否必填 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `DATABASE_URL` | 否 | 依個別欄位自動組合 | PostgreSQL 連線字串（設定後會覆寫個別欄位）。 |
| `DB_HOST` | 否 | `localhost` | 資料庫主機位址。 |
| `DB_PORT` | 否 | `5432` | 資料庫連接埠。 |
| `DB_USER` | 否 | `app` | 資料庫使用者。 |
| `DB_PASSWORD` | 否 | `app` | 資料庫密碼。 |
| `DB_NAME` | 否 | `app_db` | 資料庫名稱。 |
| `COMPOSE_DB_HOST` | 否 | `db` | 使用隨附 docker-compose 時自動採用的主機名稱。 |
| `COMPOSE_DB_PORT` | 否 | `5432` | 使用 docker-compose 時的連接埠。 |
| `DB_SCHEMA` | 否 | `public` | TypeORM 產生與執行遷移的預設 schema。 |
| `DB_SEARCH_PATH` | 否 | 同 `DB_SCHEMA` | 可選的 PostgreSQL search path 覆寫。 |

### 功能旗標與 VC 政策

| 變數 | 是否必填 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `PERSIST_STRATEGY` | 否 | `db` | 在完成交易時記錄於稽核事件的持久化策略（`db`、`chain` 或 `db+chain`）。 |
| `UID_TTL_MINUTES` | 否 | `60` | 交易 UID 的有效分鐘數，逾時後禁止 VC 驗證。 |
| `VC_MIN_CRITERIA` | 否 | `{}` | 描述 VC 必備欄位的 JSON 字串，詳見 `src/modules/vc/validateVC.ts`。 |
| `CHAIN_RPC_URL` | 否 | — | 預留的鏈上 RPC 端點。 |
| `CHAIN_WALLET_KEY` | 機敏 | — | 鏈上策略使用的簽章金鑰（請安全保存）。 |
| `LOG_LEVEL` | 否 | `info` | Pino 日誌層級（`info`、`debug`、`error`）。 |
| `REQUIRE_VC_FOR_CREATOR` | 否 | `false` | 預留旗標，用來強制交易建立者也需通過 VC 驗證。 |

### 運維調校

| 變數 | 是否必填 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `DB_INIT_MAX_ATTEMPTS` | 否 | `10` | 服務啟動時等待資料庫的最大重試次數。 |
| `DB_INIT_RETRY_DELAY_MS` | 否 | `3000` | 每次等待間隔（毫秒），會乘上當前重試次數形成漸進延遲。 |
| `DOTENV_CONFIG_PATH` | 否 | `.env` | 自訂 dotenv 載入路徑。 |
| `SEED_PROFILE` | 否 | `dev` | 種子資料腳本的選用設定（目前僅作為資訊用途）。 |

> **安全提醒：** 請勿在正式環境使用範例密鑰，務必為 `JWT_SECRET`、`PLATFORM_JWT_SECRET` 與資料庫帳密產生足夠強度的隨機值。

## 快速開始

### 先決條件

- Node.js >= 20.0.0，並執行 `corepack enable`
- pnpm 10.x（Corepack 會自動管理）
- Docker（用於本機 PostgreSQL 或執行 Jest Testcontainers）

### 安裝套件

在專案根目錄執行：

```bash
pnpm install
```

### 設定環境

1. 複製 `app/backend/.env`（可命名為 `.env.local`）並調整祕密值。
2. 確認 `JWT_SECRET`、資料庫設定與自訂 URL 均已設定。
3. 驗證服務是否讀取到設定：

```bash
pnpm env:check
# → 轉呼叫 pnpm --filter @verifytrade/backend env:check
```

### 本機開發（不透過 Docker Compose）

```bash
pnpm --filter @verifytrade/backend dev:compose:up   # 選用：以 docker-compose.db.yml 啟動 Postgres
pnpm --filter @verifytrade/backend typeorm:migrate:run
pnpm --filter @verifytrade/backend db:seed          # 匯入示例使用者與交易單
pnpm --filter @verifytrade/backend dev              # 透過 tsx 的監看模式自動重載
```

伺服器預設監聽 `http://localhost:3000`，啟動時會顯示計算後的 Swagger URL。

停止輔助資料庫容器：

```bash
pnpm --filter @verifytrade/backend dev:compose:down
```

### Docker Compose

專案根目錄的 `docker-compose.yml` 可同時啟動 Postgres 與後端服務：

```bash
docker compose up db          # 選用：先啟動資料庫
docker compose up backend
```

後端容器會掛載程式碼、以 pnpm 安裝依賴並執行 `pnpm --filter @verifytrade/backend dev:api`。若需額外環境變數，可自行調整 `docker-compose.yml`。

### 資料庫遷移與種子資料

- 執行待處理遷移：`pnpm --filter @verifytrade/backend typeorm:migrate:run`
- 還原上一版遷移：`pnpm --filter @verifytrade/backend typeorm:migrate:revert`
- 全部還原後重新執行與匯入示例資料：`pnpm --filter @verifytrade/backend db:reset`
- 產生新遷移檔：`pnpm --filter @verifytrade/backend migration:generate --name=AddSomeFeature`
- 匯入預設種子資料：`pnpm --filter @verifytrade/backend db:seed`
- 使用自訂 profile 匯入（透過 `SEED_PROFILE`）：`SEED_PROFILE=test pnpm --filter @verifytrade/backend db:seed`

`src/server.ts` 入口會在啟動時自動執行遷移，方便冷啟動；仍可在 CI/CD 中以 CLI 明確控制。

## API 文件

- OpenAPI 規格檔：`openapi.json`（由 TSOA 產生）
- 重新產生路由與規格：`pnpm --filter @verifytrade/backend openapi`
- 從執行中的服務擷取規格：`pnpm --filter @verifytrade/backend openapi:print`
- Swagger UI：`${API_BASE_URL}${SWAGGER_PATH}`，預設為 `http://localhost:3000/docs`
- 原始 JSON 規格端點：`GET /openapi.json`（會依請求重新計算 servers）

Swagger UI 在正式環境會套用嚴格 CSP，在開發環境則放寬以避免 Safari 將資源自動升級為 HTTPS。

## 健康檢查

後端服務提供免驗證的探針，協助調度系統與值班工程師監控執行狀態。健康情況下請求能在數毫秒內完成，並套用 400 毫秒的逾時限制，確保不會阻塞 Node.js 事件迴圈或造成多餘的資源配置。

### `GET /healthz`（別名：`/health`）

- 確認程序仍在執行且事件迴圈可即時回應。
- 回傳 `{ "status": "ok", "uptimeSec": <數值>, "version": "<套件版本>" }`，不會觸碰資料庫或其他外部依賴。
- 會略過驗證、CORS 與速率限制。

```bash
curl -i http://localhost:${PORT:-3000}/healthz
```

典型 `200 OK` 回應：

```json
{
  "status": "ok",
  "uptimeSec": 12.34,
  "version": "0.1.0"
}
```

### `GET /ready`

- 透過 TypeORM 執行 `SELECT 1` 並設定 400 毫秒的 PostgreSQL statement timeout，確認節點可以接手流量（未來新增的依賴會顯示在 `checks` 欄位）。
- 所有檢查通過時回傳 `200 OK`；任何檢查失敗時回傳 `503 Service Unavailable`，並附上詳細的失敗原因。
- 當服務開始關閉並釋放 TypeORM 連線池時，端點會自動改為 `503`，協助上游在停機前排空流量。

```bash
curl -i http://localhost:${PORT:-3000}/ready
http --timeout=2 GET :${PORT:-3000}/ready
```

健康回應：

```json
{
  "status": "ok",
  "checks": {
    "db": { "ok": true }
  }
}
```

降級回應（示例）：

```json
{
  "status": "degraded",
  "checks": {
    "db": { "ok": false, "reason": "timeout" }
  }
}
```

### 部署探針設定

Docker Compose（`docker-compose.yml`）：

```yaml
healthcheck:
  test: ["CMD", "curl", "-fsS", "http://localhost:3000/healthz"]
  interval: 10s
  timeout: 2s
  retries: 3
```

Kubernetes：

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

### `/ready` 回傳 503 的疑難排解

- 確認 PostgreSQL 可連線、帳密正確且已套用最新的資料庫遷移。
- 查看包含 `requestId` 的 `readiness check failed` 日誌，以判斷哪個檢查逾時或失敗。
- 確認服務具備必要的網路權限（VPN、VPC、防火牆）且未超出連線數限制。
- 在本機使用 `curl -v` 或 `http --timeout=2` 呼叫 `/ready`，排除問題是否來自負載平衡器或代理層。

## 認證

所有業務 API 都需要 `Authorization: Bearer <JWT>` 標頭。

在本機開發時，可透過開發用端點取得短效期 JWT（`NODE_ENV=production` 時會停用）：

```bash
curl -X POST http://localhost:3000/api/v1/auth/dev-token \
  -H 'Content-Type: application/json' \
  -d '{
        "userId": "8c0cf2f6-4050-4c6d-9a53-1b38eb8f2e28",
        "role": "user",
        "email": "amy.chen@example.com",
        "name": "Amy Chen"
      }'
```

```bash
http POST :3000/api/v1/auth/dev-token \
  userId=8c0cf2f6-4050-4c6d-9a53-1b38eb8f2e28 \
  role=user \
  email=amy.chen@example.com \
  name='Amy Chen'
```

將回傳的 `token` 儲存後即可呼叫其他端點：

```bash
export VERIFYTRADE_TOKEN="<JWT from dev-token>"
curl http://localhost:3000/api/v1/tradeforms/uid/demo-trade-uid \
  -H "Authorization: Bearer ${VERIFYTRADE_TOKEN}"
```

若 `PLATFORM_JWT_SECRET` 與 `JWT_SECRET` 不同，平台服務可使用平台簽章的 JWT 驗證。

## API 參考

### TradeForm 相關端點

| 方法 | 路徑 | 摘要 | 權限 | 備註 |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/tradeforms` | 建立交易單 | Bearer | 請求需符合 `CreateTradeFormDto`，成功回傳 201 與完整資料。 |
| `GET` | `/api/v1/tradeforms/{uid}` | 以分享 UID 取得交易單 | Bearer | 參與者會收到完整資訊，其餘人僅看到簡化內容。亦可使用 `/api/v1/tradeforms/uid/{uid}`。 |
| `PUT` | `/api/v1/tradeforms/{uid}` | 設定交易對手 | Bearer | 使用公開 UID 作為路徑，body 需帶已存在使用者的 `counterpartyId`，並會把狀態設為 `confirmed`。 |
| `DELETE` | `/api/v1/tradeforms/{id}` | 刪除交易單 | Bearer | 成功回傳 `204 No Content`。 |
| `POST` | `/api/v1/tradeforms/{uid}/confirm` | 確認交易參與 | Bearer | 僅限交易參與者；雙方都確認後會觸發自動完成（finalize）流程。 |

建立交易單範例：

```bash
curl -X POST http://localhost:3000/api/v1/tradeforms \
  -H "Authorization: Bearer ${VERIFYTRADE_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{
        "creatorVerifiedIdentities": ["StudentID", "CompanyEmail"],
        "itemName": "iPad Pro 11\"",
        "itemDescription": "盒裝完整，含原廠鍵盤",
        "itemCondition": "LIKE_NEW",
        "amount": "22000",
        "tradeChannel": "IN_PERSON",
        "paymentMethod": "BANK_TRANSFER",
        "matchmakingChannel": "SOCIAL_PLATFORM",
        "identityRequirements": ["STUDENT_ID", "PROOF_OF_ORIGIN"],
        "userRating": 5
      }'
```

```bash
http POST :3000/api/v1/tradeforms \
  Authorization:"Bearer ${VERIFYTRADE_TOKEN}" \
  creatorVerifiedIdentities:='["StudentID","CompanyEmail"]' \
  itemName='"iPad Pro 11\""' \
  itemDescription='盒裝完整，含原廠鍵盤' \
  itemCondition=LIKE_NEW \
  amount=22000 \
  tradeChannel=IN_PERSON \
  paymentMethod=BANK_TRANSFER \
  matchmakingChannel=SOCIAL_PLATFORM \
  identityRequirements:='["STUDENT_ID","PROOF_OF_ORIGIN"]' \
  userRating:=5
```

### 認證端點

| 方法 | 路徑 | 摘要 | 權限 | 備註 |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/auth/dev-token` | 發行本機開發用 JWT | 公開（正式環境停用） | `userId` 必須是 UUID，`role`、`email`、`name` 為選填。回傳 `{ token, expiresIn, role }`。 |

### 健康檢查端點

| 方法 | 路徑 | 摘要 | 權限 | 備註 |
| --- | --- | --- | --- | --- |
| `GET` | `/health` | 基本存活檢查 | 無 | 回傳 `{ "status": "ok" }`。 |
| `GET` | `/health/db` | 資料庫就緒檢查 | 無 | 透過 TypeORM 測試連線，失敗時以 503 回傳錯誤資訊。 |

完整 DTO 定義、列舉值與範例 payload 請參考 Swagger UI。

## 錯誤處理

所有錯誤皆由 `src/middleware/errorHandler.ts` 處理，回傳 JSON 結構如下：

```json
{
  "error": "Validation failed",
  "details": {
    "...": "..."
  },
  "requestId": "3f685b60-..."
}
```

主要狀態碼：

- `401 Unauthorized`：缺少或無效的 Bearer Token。
- `403 Forbidden`：在正式環境呼叫開發用端點或觸發角色權限限制。
- `404 Not Found`：找不到指定的交易單。
- `409 Conflict`：冪等性衝突或交易確認狀態衝突。
- `410 Gone`：交易 UID 已逾期。
- `422 Unprocessable Entity`：DTO、class-validator 或 zod 驗證失敗。
- `429 Too Many Requests`：觸發速率限制。
- `500 Internal Server Error`：未預期錯誤（包含 `requestId` 以供追蹤）。

## 測試

```bash
pnpm --filter @verifytrade/backend test
```

- 採用 Jest（ts-jest）與 Supertest。
- 部分測試透過 `@testcontainers/postgresql` 建立臨時資料庫，請確保 Docker 已啟動且具存取權限。
- 覆蓋率報告輸出於 `app/backend/coverage/`。

## 程式品質

- Lint：`pnpm --filter @verifytrade/backend lint`
- 格式：由 ESLint + Prettier 設定保障一致性
- 型別檢查與建置：`pnpm --filter @verifytrade/backend build`（輸出至 `dist/`）
- 執行編譯後程式：`pnpm --filter @verifytrade/backend start`（等同 `node dist/server.js`）

## 部署注意事項

1. 先建置專案：`pnpm --filter @verifytrade/backend build`
2. 確保遷移已完成（可依賴啟動自動執行，或在部署流程中執行 `pnpm --filter @verifytrade/backend typeorm:migrate:run`）。
3. 設定正式環境變數：
   - `NODE_ENV=production`
   - 提供高強度的 `JWT_SECRET` 與（必要時）`PLATFORM_JWT_SECRET`
   - 設定 `DATABASE_URL` 或個別資料庫欄位指向正式資料庫
   - 依部署網址設定 `API_BASE_URL` 與 `SWAGGER_PATH`
4. 若位於反向代理後，請設定 `TRUST_PROXY` 以保留正確用戶 IP。
5. 若資料庫啟動時間較長，可調整 `DB_INIT_*` 重試參數。

## 疑難排解

- **無法連線至 Postgres：** 確認容器健康狀態（`pnpm --filter @verifytrade/backend dev:compose:up`）、檢查 `DB_HOST`/`DATABASE_URL`，並留意 SSL 或認證錯誤。 
- **啟動時提示缺少 `JWT_SECRET`：** 正式環境必須設定安全金鑰後才能啟動。 
- **頻繁收到 429：** 視需求提高 `RATE_LIMIT_MAX` 或放寬 `RATE_LIMIT_WINDOW_MS`。 
- **冪等衝突（409）：** 確保 `Idempotency-Key` 對同一行為唯一，且請求保持同一使用者。 
- **Swagger 靜態資源被阻擋：** 若透過 HTTPS 代理存取，可在本機設定 `DEV_HTTPS=true`，並在代理上轉送 `X-Forwarded-*` 標頭且妥善配置 `TRUST_PROXY`。 
- **開發用 token 端點回傳 403：** 確認 `NODE_ENV` 不是 `production`，並在調整環境變數後重新啟動服務。

## 授權與感謝

- **授權條款：** 尚未公開。請洽 VerifyTrade 維運團隊取得使用資訊。
- **感謝：** VerifyTrade 工程團隊與所有貢獻者。
