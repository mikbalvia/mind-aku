import { ArrowLeft, ArrowSquareOut, Envelope, ChatCircleDots } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { Atmosphere } from "../components/Atmosphere";
import { BrandLockup } from "../components/BrandLogo";
import { Button } from "@/components/ui/button";
import { COMPANY } from "../lib/company";
import { AI_BASE_URL, OMNIROUTE_BASE_URL, PUBLIC_WEB_URL, WHATSAPP_GROUP_URL, WHATSAPP_NUMBER, buildAdminWhatsAppHref, buildWhatsAppGroupHref } from "../config";

type PublicPage = "faq" | "refund" | "terms" | "contact";

const pageCopy = {
  faq: {
    eyebrow: "Mikbalvia Digital",
    title: "Pertanyaan yang sering diajukan",
    lead: "Jawaban singkat seputar layanan API Mind Aku dari Mikbalvia Digital.",
  },
  refund: {
    eyebrow: "Policy / 01",
    title: "Kebijakan pengembalian dana",
    lead: "Ketentuan pengembalian dana untuk pembelian layanan Mind Aku.",
  },
  terms: {
    eyebrow: "Policy / 02",
    title: "Syarat dan ketentuan layanan",
    lead: "Ketentuan penggunaan layanan API Mind Aku.",
  },
  contact: {
    eyebrow: "Support channel",
    title: "Hubungi kami",
    lead: "Informasi kontak resmi Mikbalvia Digital untuk layanan Mind Aku.",
  },
} as const;

function ContactLinks() {
  const groupHref = buildWhatsAppGroupHref();
  const adminHref = buildAdminWhatsAppHref();
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <Button asChild size="sm"><a href={`mailto:${COMPANY.adminEmail}`}><Envelope /> Email support</a></Button>
      <Button asChild size="sm" variant="outline"><a href={adminHref} target="_blank" rel="noopener noreferrer"><ChatCircleDots /> Chat admin</a></Button>
      {groupHref ? (
        <Button asChild size="sm" variant="outline"><a href={groupHref} target="_blank" rel="noopener noreferrer"><ChatCircleDots /> Channel pengumuman</a></Button>
      ) : null}
    </div>
  );
}

function Content({ page }: { page: PublicPage }) {
  if (page === "faq") return <>
    <h2>Tentang layanan</h2>
    <h3>Apa itu Mind Aku?</h3><p>Mind Aku adalah layanan API yang memungkinkan Anda menghubungkan berbagai tool AI seperti Claude Code, Codex, OpenClaw, KiloCode, dan lainnya ke satu endpoint API dengan API Key pribadi.</p>
    <h3>Bagaimana cara mendapatkan API Key?</h3><p>API Key diberikan setelah Anda memesan atau mengaktifkan layanan melalui admin Mikbalvia Digital. Hubungi kami jika Anda belum memiliki API Key.</p>
    <h3>Di mana saya bisa mengecek sisa kuota?</h3><p>Masuk ke <Link to="/login">portal Mind Aku</Link>, masukkan API Key, lalu buka dashboard untuk melihat saldo, usage, dan request.</p>
    <h2>Penggunaan API</h2>
    <h3>Apa Base URL yang digunakan?</h3><p><code>{AI_BASE_URL}</code></p>
    <h3>Bagaimana auto-setup Claude Code / Codex / OpenClaw / Hermes / Claude Desktop?</h3>
    <p>Login ke portal, buka menu <Link to="/setup">Setup</Link>. Pilih <strong>salah satu</strong> tool. OpenClaw dan Hermes cukup satu perintah curl (script memasang CLI jika belum ada, lalu menulis katalog model tanpa mengubah nama agen). Claude Desktop: download app, aktifkan Developer Mode, isi gateway Mind Aku. CLI Claude/Codex: install → auto-config → (opsional) extension di VS Code / Cursor / Antigravity. Atau jalankan (script akan meminta API key):</p>
    <p><code>curl -fsSL &quot;{OMNIROUTE_BASE_URL}/setup&quot; | bash</code></p>
    <p>Windows PowerShell: <code>irm &quot;{OMNIROUTE_BASE_URL}/setup&quot; | iex</code></p>
    <p>Script mengarahkan Claude Code, Codex, OpenClaw, dan Hermes ke gateway Mind Aku. Daftar model diambil dari API gateway.</p>
    <h3>Apakah API Key boleh dibagikan?</h3><p>Tidak. API Key bersifat pribadi dan menjadi tanggung jawab pemilik. Jangan membagikannya ke pihak lain.</p>
    <h3>Bagaimana jika kuota habis?</h3><p>Anda dapat membeli tambahan limit melalui menu Top up pada console atau menghubungi admin untuk perpanjangan paket.</p>
    <h2>Pembayaran dan dukungan</h2>
    <h3>Metode pembayaran apa yang tersedia?</h3><p>Pembayaran dilakukan melalui QRIS atau metode digital lain yang tersedia di halaman pembelian pada saat transaksi.</p>
    <h3>Berapa lama limit ditambahkan setelah bayar?</h3><p>Umumnya dalam beberapa menit setelah pembayaran terkonfirmasi. Jika lebih dari 30 menit belum masuk, hubungi support dengan ID transaksi Anda.</p>
    <h3>Bagaimana cara menghubungi admin?</h3><p>Email: <a href={`mailto:${COMPANY.adminEmail}`}>{COMPANY.adminEmail}</a>, WhatsApp admin: <a href={`https://wa.me/${WHATSAPP_NUMBER}`}>+{WHATSAPP_NUMBER}</a>. Untuk tanya jawab, order, bukti transfer, atau klaim promo — gunakan chat admin (bukan grup).</p>
    <h3>Apa itu channel pengumuman WhatsApp?</h3><p>Channel resmi Mind Aku untuk update model, status layanan, dan promo. Hanya admin yang bisa mengirim pesan. Anggota tidak bisa balas di grup.</p>
    <h3>Kenapa saya tidak bisa chat di grup?</h3><p>Grup dikunci announcement-only agar tetap bersih dari spam. Untuk bantuan atau klaim promo, hubungi admin via WhatsApp pribadi.</p>
    {WHATSAPP_GROUP_URL ? <p>Join channel: <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer">{WHATSAPP_GROUP_URL}</a></p> : null}
  </>;

  if (page === "refund") return <>
    <p>Terakhir diperbarui: 23 Juni 2026</p><h2>1. Ruang lingkup</h2><p>Kebijakan ini berlaku untuk pembelian tambahan limit request, perpanjangan paket, dan transaksi berbayar lain yang dilakukan melalui layanan Mind Aku yang dioperasikan oleh Mikbalvia Digital.</p>
    <h2>2. Produk digital</h2><p>Layanan Mind Aku berupa akses API dan kuota request digital. Setelah kuota ditambahkan ke API Key Anda, layanan dianggap telah dikirimkan.</p>
    <h2>3. Kondisi refund</h2><p>Pengembalian dana dapat diajukan apabila:</p><ul><li>Pembayaran berhasil tetapi kuota tidak ditambahkan dalam 24 jam setelah konfirmasi, dan masalah belum terselesaikan oleh tim support.</li><li>Terjadi kesalahan penagihan ganda untuk transaksi yang sama.</li><li>Layanan tidak dapat digunakan karena gangguan sistem di pihak kami yang berlangsung lebih dari 48 jam berturut-turut.</li></ul>
    <h2>4. Kondisi yang tidak dapat direfund</h2><ul><li>Kuota sudah ditambahkan dan/atau sudah digunakan sebagian atau seluruhnya.</li><li>Kesalahan penggunaan API Key, konfigurasi tool, atau kelalaian pengguna.</li><li>Permintaan refund setelah 7 hari sejak tanggal transaksi tanpa bukti masalah teknis.</li></ul>
    <h2>5. Cara mengajukan refund</h2><p>Kirim ID transaksi atau bukti pembayaran, API Key yang boleh disamarkan sebagian, dan alasan pengajuan refund melalui saluran support. Tim kami akan meninjau dalam 1–3 hari kerja.</p><ContactLinks />
    <h2>6. Metode pengembalian</h2><p>Refund dilakukan ke rekening atau metode pembayaran yang sama sesuai kebijakan penyedia pembayaran, atau melalui transfer bank jika diperlukan.</p>
  </>;

  if (page === "terms") return <>
    <p>Dengan menggunakan layanan Mind Aku, Anda menyetujui syarat dan ketentuan berikut.</p><h2>1. Definisi</h2><ul><li><strong>Layanan</strong> — API Mind Aku beserta portal, dokumentasi, dan fitur terkait.</li><li><strong>Pengguna</strong> — individu atau badan usaha yang memiliki API Key aktif.</li><li><strong>API Key</strong> — kredensial akses pribadi yang dikeluarkan oleh Mikbalvia Digital.</li></ul>
    <h2>2. Penggunaan layanan</h2><ul><li>API Key hanya untuk penggunaan pribadi atau internal tim yang berwenang.</li><li>Dilarang menyalahgunakan layanan untuk aktivitas ilegal, spam, atau konten berbahaya.</li><li>Dilarang mencoba mengakses, mengubah, atau mengganggu infrastruktur server tanpa izin.</li><li>Kuota request mengikuti paket yang dibeli; penggunaan melebihi kuota dapat diblokir sementara.</li></ul>
    <h2>3. Akun dan keamanan</h2><p>Pengguna bertanggung jawab menjaga kerahasiaan API Key. Mikbalvia Digital tidak bertanggung jawab atas penyalahgunaan akibat kelalaian pengguna.</p><h2>4. Pembayaran</h2><p>Harga, paket, dan metode pembayaran ditampilkan pada halaman pembelian. Pembayaran dianggap sah setelah terkonfirmasi oleh sistem pembayaran.</p><h2>5. Ketersediaan layanan</h2><p>Kami berupaya menjaga layanan tetap tersedia, namun tidak menjamin uptime 100%. Pemeliharaan terjadwal dapat dilakukan dengan pemberitahuan seperlunya.</p><h2>6. Pembatasan tanggung jawab</h2><p>Layanan diberikan “apa adanya”. Mikbalvia Digital tidak bertanggung jawab atas kerugian tidak langsung akibat gangguan layanan, kehilangan data, atau hasil output AI dari tool pihak ketiga.</p><h2>7. Perubahan ketentuan</h2><p>Syarat ini dapat diperbarui sewaktu-waktu. Versi terbaru selalu tersedia di halaman ini.</p><h2>8. Hukum yang berlaku</h2><p>Syarat ini tunduk pada hukum Republik Indonesia.</p><h2>9. Kontak</h2><p>Pertanyaan terkait syarat ini dapat dikirim ke <a href={`mailto:${COMPANY.adminEmail}`}>{COMPANY.adminEmail}</a>.</p>
  </>;

  return <>
    <p>Untuk pertanyaan, bantuan teknis, pemesanan API Key, perpanjangan paket, atau pengajuan refund, hubungi kami melalui saluran berikut.</p>
    <div className="my-6 rounded-xl border border-border bg-muted/50 p-5 sm:p-6"><h2 className="!mt-0">Mikbalvia Digital</h2><dl className="space-y-4"><div><dt>Email</dt><dd><a href={`mailto:${COMPANY.adminEmail}`}>{COMPANY.adminEmail}</a></dd></div><div><dt>Chat admin (WhatsApp)</dt><dd><a href={`https://wa.me/${WHATSAPP_NUMBER}`}>+{WHATSAPP_NUMBER}</a> — tanya jawab, order, bukti transfer, klaim promo</dd></div>{WHATSAPP_GROUP_URL ? <div><dt>Channel pengumuman</dt><dd><a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer">Join grup WhatsApp</a> — hanya admin yang kirim pesan (update &amp; promo)</dd></div> : null}<div><dt>Alamat usaha</dt><dd>Jl. Haji Kocen No. 19, RT/RW 001/006, Kel. Kalimulya, Kec. Cilodong, Depok, Jawa Barat, Indonesia</dd></div><div><dt>Website layanan</dt><dd><a href={PUBLIC_WEB_URL}>{PUBLIC_WEB_URL}</a></dd></div></dl></div>
    <h2>Jam respons</h2><p>Pesan melalui WhatsApp dan email biasanya dibalas dalam 1–24 jam pada hari kerja.</p><h2>Sebelum menghubungi</h2><p>Siapkan API Key (boleh disamarkan), ID transaksi jika terkait pembayaran, dan screenshot error agar kami dapat membantu lebih cepat.</p>
    <div className="mt-3 flex flex-wrap gap-3">
      <Button asChild><a href={buildAdminWhatsAppHref()} target="_blank" rel="noopener noreferrer"><ChatCircleDots /> Chat via WhatsApp</a></Button>
      {WHATSAPP_GROUP_URL ? <Button asChild variant="outline"><a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer"><ChatCircleDots /> Join channel pengumuman</a></Button> : null}
    </div>
  </>;
}

export function PublicInfoPage({ page }: { page: PublicPage }) {
  const copy = pageCopy[page];
  return <div className="relative min-h-screen overflow-hidden text-foreground"><Atmosphere /><header className="relative z-10 border-b border-border bg-muted/40 backdrop-blur-md"><div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5 sm:px-6"><Link to="/"><BrandLockup showTagline={false} markClassName="size-8" /></Link><Button asChild variant="outline" size="sm"><Link to="/"><ArrowLeft weight="bold" /> Back home</Link></Button></div></header><main className="relative z-10 mx-auto max-w-3xl px-5 pb-16 sm:px-6"><header className="py-12 sm:py-16"><p className="text-[10px] font-bold uppercase tracking-[.24em] text-primary">{copy.eyebrow}</p><h1 className="mt-4 max-w-2xl font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{copy.title}</h1><p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{copy.lead}</p></header><article className="public-content rounded-xl border border-border bg-card p-5 shadow-md backdrop-blur-sm sm:p-8"><Content page={page} /></article><footer className="flex flex-wrap items-center justify-between gap-3 py-8 text-xs text-muted-foreground"><span>© 2026 Mikbalvia Digital.</span><a href={`mailto:${COMPANY.adminEmail}`} className="inline-flex items-center gap-1">Need help? <ArrowSquareOut className="size-3" /></a></footer></main></div>;
}
