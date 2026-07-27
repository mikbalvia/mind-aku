# SumoPod Payment Gateway

Quick-start reference for integrating SumoPod into OmniRoute + the client portal.

> **Security:** Never commit live API keys or webhook secrets. Store them in environment variables. If a key was shared in chat or docs, rotate it in the SumoPod dashboard.

## Environment variables (OmniRoute)

| Variable | Example | Purpose |
|----------|---------|---------|
| `SUMOPOD_API_KEY` | `(from SumoPod dashboard)` | Create payments (`X-Api-Key`) |
| `SUMOPOD_WEBHOOK_TOKEN` | `whtok_…` | Verify inbound webhooks (`X-Webhook-Token`) |
| `SUMOPOD_WEBHOOK_SECRET` | `whsec_…` | Optional Svix signature verification |
| `SUMOPOD_API_BASE` | `https://api-pay.sumopod.com` | API base (optional) |
| `PAYMENT_IDR_PER_USD` | `2000` | Fallback FX if settings unset |
| `PAYMENT_MOCK` | `true` (local only) | Skip SumoPod; allow simulate complete |
| `PAYMENT_SUCCESS_RETURN_URL` | `http://localhost:5173/payments/success` | Default redirect after pay |
| `PAYMENT_CANCEL_RETURN_URL` | `http://localhost:5173/payments/cancel` | Default cancel redirect |

## Local mock (no SumoPod)

For local testing without the payment gateway:

```bash
PAYMENT_MOCK=true
# SUMOPOD_API_KEY may be empty
```

`PAYMENT_MOCK` is ignored when `NODE_ENV=production`.

Flow:

1. `POST /api/v1/me/payments` → creates a **pending** mock order (`mock: true`)
2. `POST /api/v1/me/payments/:id/simulate` → credits Lifetime quota USD (same path as webhook)

The client portal Top up page shows **Simulate top-up** when `mockEnabled` is true.

## Dynamic FX rate (IDR → USD)

Lifetime quota on OmniRoute is denominated in **USD**. Customers pay in **IDR**.

Default: **1 USD = 2000 IDR** (`paymentIdrPerUsd = 2000`).

Operators can change this anytime via OmniRoute settings:

```http
PATCH /api/settings
{ "paymentIdrPerUsd": 2000 }
```

Clients read the live rate from:

```http
GET /api/v1/me/payments/config
Authorization: Bearer <customer-api-key>
```

## Create Payment

```bash
curl -X POST https://api-pay.sumopod.com/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -d '{
    "order_id": "INV-2026-001",
    "amount": 50000,
    "currency": "IDR",
    "expires_in_hours": 24,
    "success_return_url": "https://yourapp.com/success",
    "cancel_return_url": "https://yourapp.com/cancel",
    "payment_method_type_code": "QRIS"
  }'
```

`expires_in_hours` is optional (default 24). Return URLs override project defaults for that payment. `payment_method_type_code` is optional (e.g. `QRIS`).

### Response

```json
{
  "payment_id": "uuid",
  "order_id": "INV-2026-001",
  "amount": 50000,
  "fee": 750,
  "net_amount": 49250,
  "payment_link_url": "https://...",
  "status": "pending",
  "expires_at": "2026-01-01T12:00:00Z"
}
```

## OmniRoute customer APIs

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/v1/me/payments/config` | Bearer + `self:usage` | FX rate, packages, current lifetime quota |
| `POST` | `/api/v1/me/payments` | Bearer + `self:usage` | Create SumoPod payment for top-up |
| `GET` | `/api/v1/me/payments` | Bearer + `self:usage` | List this key’s payment history |

### Create top-up body

```json
{
  "usdAmount": 10,
  "successReturnUrl": "http://localhost:5173/payments/success",
  "cancelReturnUrl": "http://localhost:5173/payments/cancel",
  "paymentMethodTypeCode": "QRIS"
}
```

OmniRoute converts `usdAmount → amount_idr` using `paymentIdrPerUsd`, creates the SumoPod payment, and stores a pending order linked to the API key.

## Webhooks

Configure the webhook URL in the SumoPod **Settings** tab to:

```text
https://<your-omniroute-host>/api/payments/webhook
```

OmniRoute must list this path as a public route; auth is via `X-Webhook-Token` (and optional Svix signatures).

### Supported events

| Event | Description |
|-------|-------------|
| `payment.completed` | Payment succeeded → credit lifetime quota USD |
| `payment.failed` | Payment failed |
| `payment.expired` | Link expired unpaid |
| `payment.test` | Test ping from Settings |

### Payload

```json
{
  "event_type": "payment.completed",
  "data": {
    "payment_id": "uuid",
    "order_id": "INV-2026-001",
    "amount": 50000,
    "fee": 750,
    "net_amount": 49250,
    "status": "completed",
    "payment_method": "qris",
    "completed_at": "2026-06-18T12:00:00Z"
  }
}
```

Respond with **2xx within 10 seconds**.

### Verify with webhook token (recommended for OmniRoute)

```js
const expected = process.env.SUMOPOD_WEBHOOK_TOKEN; // whtok_...
const received = req.headers["x-webhook-token"];
if (expected !== received) {
  return res.status(401).send("Invalid webhook token");
}
```

### Verify Svix signatures (optional)

Headers: `svix-id`, `svix-timestamp`, `svix-signature`. Use the raw body and `SUMOPOD_WEBHOOK_SECRET` (`whsec_…`).

```js
const crypto = require("crypto");

function verifyWebhookSignature(secret, svixId, svixTimestamp, svixSignature, rawBody) {
  const secretBytes = Buffer.from(secret.replace("whsec_", ""), "base64");
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");
  const signatures = svixSignature.split(" ").map((s) => s.split(",")[1]);
  return signatures.includes(expectedSignature);
}
```

## Credit flow

```text
Customer portal → POST /api/v1/me/payments
       → SumoPod payment link
       → User pays (QRIS / …)
       → SumoPod POST /api/payments/webhook (payment.completed)
       → OmniRoute adds usd_credit to api_keys.lifetime_usage_limit_usd
```

Credits are **idempotent** per `order_id` (only applied once).

## Redirect URLs

Set defaults with `PAYMENT_SUCCESS_RETURN_URL` / `PAYMENT_CANCEL_RETURN_URL`, or pass per-payment overrides from the portal when creating a payment. Configure the same URLs in SumoPod project settings if desired.
