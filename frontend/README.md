# Vintage Bank — Frontend

An elegant, classic **dark + neon-green** banking dashboard built with **Next.js 14 (App Router)** that consumes the Vintage Bank Django REST API in `../backend`.

## Design language

- Deep near-black background with a **stylish neon-green grid** (fading radial mask) and soft glows
- Classic serif headings (Georgia/Playfair) paired with a clean sans body
- Glassmorphic cards with subtle gradient borders, neon focus states, and tactile hover motion
- Fully responsive with a collapsible mobile drawer

## Features (mapped to the API)

| Area | Endpoints used |
|------|----------------|
| Auth | `auth/login/`, `auth/register/`, `auth/token/refresh/` |
| Overview | `wallet/`, `credits/`, `debits/`, `virtual-cards/` |
| Transactions | `credits/`, `debits/`, `my/domestic-transfers/`, `my/wire-transfers/` |
| Transfers | `transfers/initiate-otp/`, `domestic-transfers/`, `wire/transfers/` (OTP-gated) |
| Virtual cards | `virtual-cards/` (create / reveal) |
| Loans | `loans/` |
| Crypto cash-out | `withdrawals/`, `payment-methods/` |
| Profile & security | `users/<id>/`, `verify-pin/` |

JWT access/refresh tokens are stored client-side and access tokens are **transparently refreshed** on 401.

## Getting started

```bash
cd frontend
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_BASE_URL at your Django server
npm install
npm run dev                        # http://localhost:3000
```

The backend is expected at `http://127.0.0.1:8000` by default. Run it with:

```bash
cd backend/backend
python manage.py migrate
python manage.py runserver
```

CORS is already open on the backend (`CORS_ALLOW_ALL_ORIGINS = True`).

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://127.0.0.1:8000` | Base URL of the API (the app appends `/api/v1`). |

## Project structure

```
src/
  app/
    layout.tsx           # grid background + AuthProvider
    page.tsx             # landing
    login/ register/     # auth
    (app)/               # protected shell (sidebar + topbar)
      dashboard/ transactions/ transfers/
      cards/ loans/ withdrawals/ profile/
  components/            # Sidebar, Brand, Icons, ui primitives, AuthShell
  lib/                   # api client, auth context, types, hooks, formatters
```
