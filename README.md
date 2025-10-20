# zkp-platform

## 專案簡介
`zkp-platform` 是一個基於零知識證明技術的應用程式平台，旨在提供安全和隱私保護的解決方案。該專案包含前端和後端應用程式，並使用 TypeScript 進行開發。

## 專案結構
- **apps/web/**: 前端應用程式，使用 React、Vite 和 TypeScript。
- **apps/api/**: 後端應用程式，使用 Fastify 和 TypeScript。
- **packages/shared/**: 前後端共用的 schema 和 types，使用 Zod 進行驗證。
- **packages/tsconfig/**: 共用的 TypeScript 設定檔。
- **packages/eslint-config/**: 共用的 ESLint 設定。
- **infra/docker/**: 包含 Dockerfile、Docker Compose 檔案和 Nginx 配置。
- **infra/k8s/**: 包含 Kubernetes manifests（可選）。
- **.github/workflows/**: CI/CD pipelines 的設定。

## 安裝與使用
1. 確保已安裝 [Node.js](https://nodejs.org/) 和 [pnpm](https://pnpm.js.org/)。
2. 克隆專案：
   ```
   git clone <repository-url>
   cd zkp-platform
   ```
3. 安裝依賴：
   ```
   pnpm install
   ```
4. 啟動應用程式：
   ```
   pnpm run dev
   ```

## 測試
專案包含單元測試和整合測試，使用 Jest 進行測試。可以使用以下命令運行測試：
```
pnpm test
```

## 貢獻
歡迎任何形式的貢獻！請參考 [貢獻指南](CONTRIBUTING.md) 以獲取更多資訊。

## 授權
本專案採用 MIT 授權，詳情請參見 [LICENSE](LICENSE)。