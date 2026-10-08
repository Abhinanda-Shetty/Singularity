# Frontend — MedSupply Web Application

React 19 + Vite web application for the MedSupply Medical Supply Intelligence platform.

---

## Requirements

- **Node.js**: `v18.x` or higher (LTS recommended)
- **npm**: `v9.x` or higher
- **Backend Service**: Requires the MedSupply Node.js API backend server running (by default at `http://localhost:3000`).

---

## Installation

```bash
cd Frontend
npm install
```

---

## Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure `.env`:

```env
# Backend API base URL (must point to running Backend server, no trailing slash)
VITE_API_BASE_URL=http://localhost:3000/api
```

### Environment Variable Explanation
- **`VITE_API_BASE_URL`**: Specifies the HTTP endpoint where the React application sends API requests (authentication, inventory queries, stock adjustment transactions, supply requests, health checks).

> 🔒 **Security Notice:** Never place private API keys or secrets in frontend `.env` files, as Vite client variables are exposed in production bundles.

---

## Start Development Server

```bash
npm run dev
```

- Application URL: `http://localhost:5173`
- Hot Module Replacement (HMR) is enabled.

---

## Production Build

To test and compile the production bundle:

```bash
npm run build
```

Production output will be generated in `dist/`.

---

## Lint

To run code syntax and quality checks:

```bash
npm run lint
```

---

## Backend Dependency

The Frontend relies on the Node.js/Express Backend to function properly.

1. Ensure the Backend server is running on `http://localhost:3000`.
2. Ensure the PostgreSQL database is migrated and seeded.
3. If the Backend is offline or unreachable:
   - A warning banner will appear on the **Dashboard** and **Settings** pages.
   - Live network requests will show connection error notices.
