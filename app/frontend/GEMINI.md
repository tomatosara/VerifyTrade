# Gemini Project Context: Frontend

This document provides specific instructions and context for the frontend of the VerifyTrade project.

## Technology Stack

-   **Framework:** React
-   **Language:** TypeScript
-   **Build Tool:** Vite
-   **Styling:** Tailwind CSS
-   **Component Library:** [shadcn/ui](https://ui.shadcn.com/) and [Magic UI](https://magicui.design/)

## Project Structure

-   `src/components`: Contains React components.
    -   `src/components/ui`: Contains UI components from shadcn/ui.
    -   `src/components/templates`: Contains page templates.
-   `src/pages`: Contains top-level page components.
-   `src/api`: Contains functions for making API calls to the backend.
-   `src/lib`: Contains utility functions.
-   `src/hooks`: Contains custom React hooks.
-   `src/styles`: Contains global CSS files.
-   `vite.config.ts`: Configuration file for Vite.
-   `tailwind.config.js`: (Implicitly used) Configuration for Tailwind CSS.
-   `components.json`: Configuration file for shadcn/ui.

## Component Libraries

This project uses [shadcn/ui](https://ui.shadcn.com/) for its base component library. You can add new components using the shadcn/ui CLI.

The project also uses [Magic UI](https://magicui.design/) for more complex animations and components.

## Styling

-   Styling is primarily done using Tailwind CSS.
-   Global styles are defined in `src/index.css`.
-   The `tailwind.config.js` file (if present) would define the Tailwind CSS configuration. The `postcss.config.js` confirms that Tailwind CSS is in use.

## Path Aliases

The project uses path aliases to simplify imports. The main alias is `@`, which points to the `src` directory. This is configured in `vite.config.ts` and `components.json`.

-   `@/components` -> `src/components`
-   `@/lib/utils` -> `src/lib/utils`
-   etc.

## Running the Frontend

To run the frontend in development mode:

```bash
pnpm dev
```

This will start the Vite development server, usually on `http://localhost:5173`.
