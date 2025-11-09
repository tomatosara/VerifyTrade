# Frontend Application Overview

This document provides an overview of the frontend application, its structure, and key components.

## Core Technologies

-   **Framework:** React
-   **Build Tool:** Vite
-   **Routing:** React Router
-   **Styling:** Tailwind CSS with shadcn/ui and Magic UI
-   **State Management:** React Context API

## Project Structure

The `src` directory is organized as follows:

-   `main.tsx`: The main entry point of the application.
-   `App.tsx`: The root component that sets up routing and global providers.
-   `pages/`: Contains top-level components for each route/page.
-   `components/`: Contains reusable components used across different pages.
    -   `components/ui/`: UI primitives, many from shadcn/ui and Magic UI.
    -   `components/templates/`: Pre-built layouts for specific trade types (e.g., P2P, Rent).
    -   `components/trade/`: Components specifically related to displaying trade information.
-   `api/`: Functions for communicating with the backend API.
-   `context/`: Global state management using React's Context API.
-   `hooks/`: Custom React hooks for reusable logic.
-   `styles/`: Global CSS and theme files.

## Routing

Routing is managed by `react-router-dom` in `App.tsx`.

-   `/`: **Home Page** (`pages/home.tsx`) - The main landing page.
-   `/login`: **Login Page** (`pages/login.tsx`) - Handles user authentication.
-   `/newform`: **New Form Page** (`pages/newform.tsx`) - A form to create a new trade.
-   `/openform`: **Open Form Page** (`pages/openform.tsx`) - A page to view or interact with an existing trade form.
-   `/myaccount`: **My Account Page** (`pages/myaccount.tsx`) - Displays the user's profile and trade history.

## State Management

Global authentication state is managed via `AuthContext` (`context/AuthContext.tsx`).

-   **`AuthProvider`**: A wrapper component that provides authentication status (`isAuthenticated`), user data, and login/logout functions to its children.
-   **`useAuth`**: A custom hook (`hooks/useAuth.ts`) that provides an easy way for components to access the `AuthContext`.

## API Communication

The `src/api` directory handles all communication with the backend.

-   `client.ts`: Contains the configured `axios` instance, including interceptors to automatically attach the authentication token to requests.
-   `trades.ts`: Contains functions for trade-related API calls (e.g., fetching user trades, getting trade details).
-   `qr.ts`: Contains functions for QR code generation and interaction with the verifier service.

## Key Components

-   `Navbar` (`components/navbar.tsx`): The top-level navigation bar, present on all pages.
-   `TradeDetailDrawer` (`components/trade/TradeDetailDrawer.tsx`): A drawer component to show the detailed information of a trade.
-   `MyAccountTradeList` (`components/trade/MyAccountTradeList.tsx`): A component used on the "My Account" page to list a user's trades.
-   `RatingStars` (`components/trade/RatingStars.tsx`): A component for displaying and selecting a star rating.
-   **UI Components** (`components/ui/`): A collection of styled components like `pin-input`, `border-beam`, and `qr-code`, which provide the core look and feel of the application, powered by shadcn/ui and Magic UI.
-   **Template Components** (`components/templates/`): Components like `p2p.template.tsx` and `rent.template.tsx` provide pre-defined structures for creating different types of trade forms.
