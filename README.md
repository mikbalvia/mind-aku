# Client Portal (`new-clients`)

Lightweight customer-facing frontend for your OmniRoute gateway. Customers sign in with their **API key**, then view allowed models, usage summary, and request logs.

This app is **frontend-only**. All data comes from OmniRoute.

## Features

| Page | OmniRoute API |
|------|----------------|
| Login | `GET /api/v1/me/status` (validates key + `self:usage`) |
| Chat | `POST /v1/chat/completions` (streaming; debits lifetime quota) |
| Models | `GET /v1/models` |
| Usage | `GET /api/v1/me/status` |
| Logs | `GET /api/v1/me/logs`, `GET /api/v1/me/logs/:id` |
| Top up | `GET/POST /api/v1/me/payments`, `GET /api/v1/me/payments/config` |

API keys are stored in `sessionStorage` and sent as `Authorization: Bearer <key>`.

Payment docs: [docs/sumopod-payment-gateway.md](docs/sumopod-payment-gateway.md).

Production (nginx, [mindaku.com](https://mindaku.com); legacy `mind-aku.my.id` dual-serve): [docs/production-deploy.md](docs/production-deploy.md).

## Prerequisites

1. OmniRoute running (default `http://localhost:3000`)
2. OmniRoute build that includes self-service logs (`/api/v1/me/logs`)
3. A customer API key with the `self:usage` scope (added by default when creating keys in OmniRoute)
4. CORS allowing this portal origin

### CORS

In OmniRoute env (or **Dashboard → Security → CORS Allowed Origins**):

```bash
CORS_ALLOWED_ORIGINS="http://localhost:5173"
```

See [OmniRoute CORS docs](../OmniRoute/docs/security/CORS.md).

## Setup

```bash
cd new-clients
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_OMNIROUTE_BASE_URL` | `http://localhost:3000` | OmniRoute origin (no trailing slash) |
| `VITE_AI_BASE_URL` | `<VITE_OMNIROUTE_BASE_URL>/v1` | Public AI endpoint shown in FAQ |
| `VITE_PUBLIC_WEB_URL` | Current browser origin | Public website shown on Contact |

## End-to-end test

1. Start OmniRoute on port `3000`.
2. In OmniRoute admin, create an API key (ensure `self:usage` is present).
3. Optionally allow specific models on that key.
4. Set `CORS_ALLOWED_ORIGINS` to include `http://localhost:5173`.
5. Run `npm run dev` in this folder.
6. Paste the API key on the login page.
7. Confirm:
   - **Models** lists only models allowed for the key
   - **Usage** shows cost/token summary
   - **Logs** lists only that key’s requests (make a chat completion with the key first if empty)

## Scripts

```bash
npm run dev      # Vite dev server (port 5173)
npm run build    # production build
npm run preview  # preview production build
```

## Out of scope

- API key management (admin-only in OmniRoute)
- Pipeline / payload debug views
- Log purge / export admin tools
