# Postman — Mind Aku Portal API

Collection untuk API yang dipakai `new-clients-final` (shop create key + portal top-up/logs).

## Import

1. Buka Postman → **Import**
2. Pilih:
   - [`Mind-Aku-Portal.postman_collection.json`](./Mind-Aku-Portal.postman_collection.json)
   - [`Mind-Aku-Portal.postman_environment.json`](./Mind-Aku-Portal.postman_environment.json)
3. Aktifkan environment **Mind Aku Portal — Local**
4. Set `baseUrl` (local: `http://localhost:3000`, prod reseller: `https://api.copilotku.com`)

> Variable `orderId` / `claimSecret` / `apiKey` / `paymentId` juga tersimpan di **Collection variables** lewat Test scripts. Cukup pakai collection saja juga boleh.

## Alur uji lokal (PAYMENT_MOCK=true)

| # | Request | Hasil |
|---|---------|--------|
| 1 | `GET Shop Config` | Cek `configured` / `mockEnabled` |
| 2 | `POST Shop Checkout` | Auto-simpan `orderId` + `claimSecret` |
| 3 | `POST Shop Simulate` | Provision API key di bawah **Root User** |
| 4 | `POST Shop Claim` | Auto-simpan `apiKey` (sekali saja) |
| 5 | `GET Status` | Login check |
| 6 | `GET Logs` | Log per key |
| 7 | `POST Create Top-up` → `Simulate Top-up` | Kredit USD ke key |

## Auth

| Folder | Auth |
|--------|------|
| Shop | Tidak perlu (public) |
| Portal / Top up / Affiliate / AI | `Authorization: Bearer {{apiKey}}` |
| Admin withdrawals | `X-Portal-Admin-Key: {{portalAdminKey}}` |

## Affiliate / referral

| # | Request | Hasil |
|---|---------|--------|
| 1 | `POST Enable Affiliate` (sebagai affiliate) | Dapat `affCode`, simpan ke `refCode` |
| 2 | `POST Shop Checkout` dengan `refCode` | Order menyimpan referrer |
| 3 | Simulate + Claim (shop GKP) | Pembeli +5% credit; affiliate +5% AffBalance |
| 3b | Top-up TKP + referral | Pembeli exact paid credit; affiliate +5% AffBalance |
| 4 | `GET Affiliate Referrals` | Daftar `name` + `createdAt` orang yang join |
| 5 | `POST Request Withdrawal` | Hold saldo → status `requested` |
| 6 | Admin `PATCH` → `approved` / `paid` / `rejected` | Pencairan manual |
| 7 | Admin `GET Affiliate Referrals` (`?affCode=` opsional) | Nama join per affiliator |

Env backend: `AFFILIATE_*`, `PORTAL_ADMIN_KEY` (lihat `.env.example`).

UI portal: `/affiliate` (customer), `/admin/login` + `/admin/withdrawals` (admin).

## Catatan

- **Create key** lewat shop → owner = Root User (bukan user baru).
- **Top-up USD** kredit ke RemainQuota API key yang dipakai Bearer.
- Simulate endpoints hanya hidup jika backend `PAYMENT_MOCK=true`.
- Claim API key hanya sekali (`409` jika sudah claimed).
- Self-referral ditolak; attribution sticky setelah pembayaran pertama ber-referral.

## Reseller API (bukan untuk customer portal)

Provisioning tanpa SumoPod untuk backend reseller ada di repo utama:

- Docs: [`docs/reseller/README.md`](../../docs/reseller/README.md)
- Postman: [`docs/reseller/Mind-Aku-Reseller.postman_collection.json`](../../docs/reseller/Mind-Aku-Reseller.postman_collection.json)

Collection portal di folder ini **tidak** menyertakan endpoint reseller.
