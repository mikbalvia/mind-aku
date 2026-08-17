# Portal Affiliate / Referral

Customer portal (`new-clients-final`) referral program bound to **API keys** (not dashboard `User.AffCode`).

## Economics

| Source | Buyer | Affiliate |
|--------|-------|-----------|
| Guest shop (`GKP-` / `guest_purchase`) | RemainQuota += paid + **5%** bonus (e.g. pay $100 → credit $105) | AffBalance += **5%** of paid |
| Portal top-up (`TKP-` / `token_payment`) | RemainQuota += **exact paid** only | AffBalance += **5%** of paid |

Without a valid referral: buyer gets exact paid credit (unchanged). Affiliate commission still requires a valid referrer.

Eligible: guest shop (`GKP-`) + portal top-up (`TKP-`). Subscription BCA is out of scope.

`AFFILIATE_BUYER_BONUS_RATE` applies to guest shop only. Commission rate applies to both.

## Attribution

1. Affiliate enables program → unique `affCode`
2. Share `/beli?ref=CODE` (portal stores first-touch in `localStorage` for `AFFILIATE_COOKIE_DAYS`, default 30)
3. Checkout/top-up sends `refCode`; order stores `referrer_token_id`
4. On SumoPod webhook complete: settle in the same DB transaction (GKP: buyer bonus + commission; TKP: commission only)
5. Buyer sticky `referred_by_token_id` set on first paid attribution (later top-ups keep the same affiliate commission)

Self-referral is rejected.

## Withdrawals

1. Affiliate requests cash-out (min `AFFILIATE_MIN_WITHDRAW_USD`, default $10) with bank details
2. Balance moves to held; status `requested`
3. Admin at `/admin/withdrawals` (auth: `PORTAL_ADMIN_KEY` via `/admin/login`) sets `approved` → `paid`, or `rejected` (releases hold)
4. Bank transfer happens outside the system

## Env

```bash
AFFILIATE_ENABLED=true
AFFILIATE_COMMISSION_RATE=0.05
AFFILIATE_BUYER_BONUS_RATE=0.05
AFFILIATE_COOKIE_DAYS=30
AFFILIATE_MIN_WITHDRAW_USD=10
PORTAL_ADMIN_KEY=replace-with-long-random-admin-secret
```

## Who joined

Affiliators and portal admins can list referred buyers by `Token.Name` (shop checkout stores buyer name here). API keys and quota are never returned.

| Role | Path | Fields |
|------|------|--------|
| Affiliator | `GET /api/v1/me/affiliate/referrals` | `name`, `createdAt` |
| Admin | `GET /api/v1/admin/affiliate/referrals?affCode=` | `name`, `createdAt`, `affCode`, `affiliatorName` |

Admin `affCode` is optional: omit it for all joins, or pass an affiliator code to filter. UI: `/affiliate` (customer) and `/admin/withdrawals` (admin).

## API

| Method | Path | Auth |
|--------|------|------|
| GET/POST | `/api/v1/me/affiliate`, `/enable`, `/ledger`, `/referrals`, `/withdrawals` | Bearer API key |
| GET/PATCH | `/api/v1/admin/affiliate/withdrawals`, `/stats`, `/referrals` | `X-Portal-Admin-Key` |
| POST | `/api/v1/shop/checkout` + `refCode` | public |
| POST | `/api/v1/me/payments` + `refCode` | Bearer |

See [postman.md](./postman.md) folders **5. Affiliate** and **6. Admin**.
