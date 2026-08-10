# Production deploy — Mind Aku portal

Dokumentasi deploy frontend portal ke Ubuntu (nginx, static build). Terakhir diperbarui setelah deploy awal ke **mind-aku.my.id**.

## Ringkasan

| Item | Nilai |
|------|--------|
| Publik | https://mind-aku.my.id |
| Repo GitHub | https://github.com/mikbalvia/mind-aku.git |
| Server | Ubuntu VPS (SSH key auth; host details in private runbook) |
| Path aplikasi | `/var/www/mind-aku` |
| Artefak production | `/var/www/mind-aku/dist` (hasil `npm run build`) |
| Nginx vhost | `/etc/nginx/sites-available/mind-aku.my.id` → `sites-enabled/` |
| TLS origin | Let's Encrypt (`certbot`), cert: `/etc/letsencrypt/live/mind-aku.my.id/` |
| API OmniRoute | https://vip-api.mind-aku.my.id (proxy nginx → backend lokal, bukan bagian deploy portal) |
| DNS | Cloudflare → origin |

Portal **hanya static files**; tidak ada proses Node yang berjalan di production. Variabel `VITE_*` di-inject saat **build**, bukan saat runtime.

## Arsitektur

```mermaid
flowchart LR
  User[Pengguna] --> CF[Cloudflare]
  CF --> Nginx[Nginx 80/443]
  Nginx --> Dist["/var/www/mind-aku/dist"]
  Browser[Browser portal] --> API["vip-api.mind-aku.my.id"]
```

Nginx di server yang sama juga melayani vhost lain (mis. `gateway-ai.mind-aku.my.id`, `vip-api.mind-aku.my.id`, `api-gateway.mind-aku.my.id`, dll.). Deploy portal **hanya menambah** site `mind-aku.my.id`; tidak mengubah port atau config site lain.

## Environment production (build-time)

File `/var/www/mind-aku/.env` (tidak di-commit; `chmod 600`):

```env
VITE_OMNIROUTE_BASE_URL=https://vip-api.mind-aku.my.id
VITE_AI_BASE_URL=https://vip-api.mind-aku.my.id/v1
VITE_PUBLIC_WEB_URL=https://mind-aku.my.id
VITE_WHATSAPP_NUMBER=6281990609939
VITE_WHATSAPP_MESSAGE=Hai admin Mikbalvia Digital, saya ingin bertanya tentang layanan Mind Aku.
# Announcement-only group invite (hide join UI if empty)
# VITE_WHATSAPP_GROUP_URL=https://chat.whatsapp.com/XXXX
# Optional promo teaser — change CAMPAIGN_ID to re-prompt join modal
# VITE_COMMUNITY_CAMPAIGN_ID=aug2026-free-starter
# VITE_COMMUNITY_CAMPAIGN_TEASER=Free starter API key — klaim via chat admin
# VITE_COMMUNITY_CAMPAIGN_ENDS_AT=2026-08-31T23:59:59+07:00
```

Setelah mengubah `.env`, wajib **`npm run build`** ulang agar perubahan terbawa ke `dist/`.

## CORS (OmniRoute)

Browser memanggil API dari origin `https://mind-aku.my.id`. Di OmniRoute (env atau dashboard):

```bash
CORS_ALLOWED_ORIGINS="https://mind-aku.my.id"
```

Pada deploy awal, API sudah mengembalikan header `access-control-allow-origin: https://mind-aku.my.id` untuk preflight/request dari portal.

## Prasyarat di server

- **Nginx** (sudah ada, shared dengan service lain)
- **Git**
- **Node 20** untuk user deploy via **nvm** (`~/.nvm`), hanya dipakai saat build — tidak membuka port dev 5173

Memuat nvm di shell non-interaktif:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20
```

## Deploy awal (referensi)

Langkah yang sudah dilakukan; berguna jika rebuild di server baru.

```bash
sudo mkdir -p /var/www/mind-aku
sudo chown ubuntu:ubuntu /var/www/mind-aku
cd /var/www/mind-aku
git clone https://github.com/mikbalvia/mind-aku.git .
# buat .env (lihat di atas)
chmod 600 .env
npm install   # atau npm ci jika lock file sinkron
npm run build
test -f dist/index.html
```

Nginx (ringkas — Certbot kemudian menambahkan blok `listen 443 ssl`):

- `server_name mind-aku.my.id` (dan opsional `www` jika DNS ada)
- `root /var/www/mind-aku/dist`
- `location / { try_files $uri $uri/ /index.html; }`
- `/.well-known/acme-challenge/` → `root /var/www/html` (untuk Let's Encrypt)

```bash
sudo ln -sf /etc/nginx/sites-available/mind-aku.my.id /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d mind-aku.my.id --non-interactive --agree-tos --register-unsafely-without-email --redirect
```

**Catatan `www`:** `www.mind-aku.my.id` belum punya record DNS saat certbot pertama; sertifikat hanya untuk `mind-aku.my.id`. Jika nanti menambah DNS `www`, jalankan certbot lagi dengan `-d www.mind-aku.my.id` atau perbarui `server_name` sesuai kebutuhan.

## Deploy ulang (update kode)

```bash
cd /var/www/mind-aku
git pull
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
npm install
npm run build
```

Reload nginx **tidak** diperlukan selama `root` tetap menunjuk ke `dist/` yang sama.

## Auto-setup Claude Code / Codex

After login, the dashboard shows copy-paste commands. Public endpoint on the API host (script prompts for the API key — do **not** put the key in the URL):

```bash
curl -fsSL "https://vip-api.mind-aku.my.id/setup" | bash
```

```powershell
irm "https://vip-api.mind-aku.my.id/setup" | iex
```

OmniRoute env (optional): `SETUP_PUBLIC_BASE_URL=https://vip-api.mind-aku.my.id` so scripts embed the correct origin behind nginx.

## Security headers (portal nginx)

Add inside the `server { ... }` block for `mind-aku.my.id` (HTTPS), then `sudo nginx -t && sudo systemctl reload nginx`.

**Important:** hashed JS/CSS may use long `immutable` cache. `index.html` (SPA shell) must use **`no-store`** — otherwise browsers/CDN keep an old HTML that points at an old JS hash after deploy.

```nginx
# server-level defaults (also repeated inside locations that set add_header)
add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://vip-api.mind-aku.my.id https:; worker-src 'self' blob:; manifest-src 'self'" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

location / {
    try_files $uri $uri/ /index.html;
    etag off;
    add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;
    # nginx: add_header in a location does not inherit server-level add_header — repeat:
    add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://vip-api.mind-aku.my.id https:; worker-src 'self' blob:; manifest-src 'self'" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
}

location ~* \.(js|mjs|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
    expires 7d;
    add_header Cache-Control "public, immutable" always;
    # repeat security headers here too
}
```

The portal also auto-reloads when it detects a newer `index-*.js` hash after deploy (`src/lib/forceFreshBuild.ts`).

Verify: `curl -sI https://mind-aku.my.id | grep -iE 'cache-control|pragma|etag|content-security|strict-transport'`.

## Verifikasi

Di server:

```bash
curl -sI http://127.0.0.1 -H 'Host: mind-aku.my.id' | head -5
ls -la /var/www/mind-aku/dist/index.html
sudo nginx -t
```

Dari luar:

```bash
curl -sI https://mind-aku.my.id
curl -sI -H 'Origin: https://mind-aku.my.id' https://vip-api.mind-aku.my.id/api/v1/me/status
```

Harapan: portal HTTP 200; API boleh 401 tanpa API key, tetapi response CORS harus menyertakan `access-control-allow-origin: https://mind-aku.my.id`.

Di browser: buka https://mind-aku.my.id → login dengan API key → Models / Usage / Logs.

## Keamanan & operasi

- Akses server: gunakan **SSH key**, bukan password di chat atau repo.
- Jangan commit `.env` production (sudah di `.gitignore`).
- `package-lock.json`: jika `npm ci` gagal karena lock tidak sinkron, perbaiki lock di repo lokal lalu `git push`, atau sementara pakai `npm install` di server (seperti deploy awal).
- Perpanjangan TLS: Certbot timer systemd (standar Ubuntu).

## Yang tidak termasuk deploy portal

- Menjalankan atau mengonfigurasi proses OmniRoute (port backend, env payment, webhook SumoPod, dll.)
- Mengubah vhost nginx selain `mind-aku.my.id`
- Pembukaan firewall port baru (hanya 80/443 nginx yang dipakai)

Payment & webhook: lihat [sumopod-payment-gateway.md](./sumopod-payment-gateway.md).
