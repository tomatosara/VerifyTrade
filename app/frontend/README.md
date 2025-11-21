# VerifyTrade Frontend

React + Vite client for the VerifyTrade platform. Handles login, trade form creation, verification flows, and account views while talking to the backend API.

## Responsibilities

- UI for trade creation, confirmation, and verification flows
- Routing, auth context, and token handling for API calls
- Animations and motion-driven presentation for marketing and product surfaces

## Tech Stack

- React 19, TypeScript, Vite (Rolldown build)
- Tailwind CSS v4, motion/animation utilities, Radix primitives, lucide-react icons
- Routing via `react-router-dom`

## Folder Structure

```text
src/
  api/         # API client wrapper (in-memory access token + refresh helper)
  components/  # UI components (navbar, carousel, UI primitives)
  context/     # Auth provider
  pages/       # Home, login, trade form, verification, account, FAQ
  styles/      # Global design tokens and utilities
  utils/, hooks, lib, assets  # helpers and shared logic
```

## Prerequisites

- Node.js 20+ with Corepack
- pnpm 10.x (installed at repo root)
- Backend API running locally or reachable at a configured URL

## Setup

Dependencies are installed from the repo root:
```bash
pnpm install
```

## Environment Variables

- `VITE_API_BASE_URL` — Backend base URL (defaults to `http://localhost:3000/api/v1`)

Set this in a local `.env` if you need to point to a different backend instance.

## Run Locally

```bash
pnpm --filter frontend dev    # http://localhost:5173
```

The API client stores the access token in memory and will attempt a single refresh (`POST /auth/refresh`) when receiving `401` responses. Cookies must be allowed for refresh to work.

## Build & Preview

```bash
pnpm --filter frontend build
pnpm --filter frontend preview
```

## Quality

- Lint: `pnpm --filter frontend lint`
- Tests: not defined yet for this app.

## Related Docs

- Backend setup and API details: `../backend/README.md`
- Root workspace instructions: `../../README.md`
