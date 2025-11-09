# Gemini Project Context: VerifyTrade

This document provides instructions and context for the Gemini AI agent to work on the VerifyTrade project.

## Project Overview

VerifyTrade is a monorepo project using `pnpm` workspaces. It consists of a frontend application and a backend API.

-   **Frontend:** Located in `app/frontend`, it is a React application built with Vite and TypeScript.
-   **Backend:** Located in `app/backend`, it is a Node.js application using Express, TypeScript, and TypeORM for database interactions. It exposes a RESTful API.

## Installation

To install all dependencies for both the frontend and backend, run the following command from the root directory:

```bash
pnpm install
```

## Development

### Running the Database

The backend requires a PostgreSQL database. You can start a development database using Docker Compose:

```bash
pnpm --filter @verifytrade/backend dev:compose:up
```

To stop the database:

```bash
pnpm --filter @verifytrade/backend dev:compose:down
```

### Running the Backend

To run the backend in development mode (with hot-reloading), use the following command:

```bash
pnpm --filter @verifytrade/backend dev
```

The backend server will typically start on `http://localhost:3000`.

### Running the Frontend

To run the frontend in development mode, use the following command:

```bash
pnpm --filter frontend dev
```

The frontend development server will typically start on `http://localhost:5173`.

## Building for Production

-   **Backend:** `pnpm --filter @verifytrade/backend build`
-   **Frontend:** `pnpm --filter frontend build`

## Testing

-   **Backend:** `pnpm --filter @verifytrade/backend test`
-   **Frontend:** (No test script specified in `package.json`)

## Linting

-   **Backend:** `pnpm --filter @verifytrade/backend lint`
-   **Frontend:** `pnpm --filter frontend lint`
