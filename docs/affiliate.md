# Portal Affiliate / Referral

Customer portal (`new-clients-final`) referral program bound to **API keys** (not dashboard `User.AffCode`).

## Economics

| Party | On each referred paid shop/top-up |
|-------|-----------------------------------|
| Buyer | RemainQuota += paid + **10%** bonus (e.g. pay $50 → credit $55) |
| Affiliate | AffBalance += **10%** of paid (withdrawable, not auto RemainQuota) |

Without a valid referral: buyer gets exact paid credit (unchanged).

Eligible: guest shop (`GKP-`) + portal top-up (`TKP-`). Subscription BCA is out of scope.

## Attribution

1. Affiliate enables program → unique `affCode`
2. Share `/beli?ref=CODE` (portal stores first-touch in `localStorage` for `AFFILIATE_COOKIE_DAYS`, default 30)
3. Checkout/top-up sends `refCode`; order stores `referrer_token_id`
4. On SumoPod webhook complete: settle bonus + commission in the same DB transaction
5. Buyer sticky `referred_by_token_id` set on first paid attribution (later purchases keep the same affiliate)

Self-referral is rejected.

## Withdrawals

1. Affiliate requests cash-out (min `AFFILIATE_MIN_WITHDRAW_USD`, default $10) with bank details
2. Balance moves to held; status `requested`
3. Admin at `/admin/withdrawals` (auth: `PORTAL_ADMIN_KEY` via `/admin/login`) sets `approved` → `paid`, or `rejected` (releases hold)
4. Bank transfer happens outside the system

## Env

```bash
AFFILIATE_ENABLED=true
AFFILIATE_COMMISSION_RATE=0.10
AFFILIATE_BUYER_BONUS_RATE=0.10
AFFILIATE_COOKIE_DAYS=30
AFFILIATE_MIN_WITHDRAW_USD=10
PORTAL_ADMIN_KEY=replace-with-long-random-admin-secret
```

## API

| Method | Path | Auth |
|--------|------|------|
| GET/POST | `/api/v1/me/affiliate`, `/enable`, `/ledger`, `/withdrawals` | Bearer API key |
| GET/PATCH | `/api/v1/admin/affiliate/withdrawals`, `/stats` | `X-Portal-Admin-Key` |
| POST | `/api/v1/shop/checkout` + `refCode` | public |
| POST | `/api/v1/me/payments` + `refCode` | Bearer |

See [postman.md](./postman.md) folders **5. Affiliate** and **6. Admin**.
