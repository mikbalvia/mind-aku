import type { PaymentHistoryItem } from "../api/types";
import { COMPANY } from "./company";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatUsdPlain(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatIdrPlain(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatInvoiceDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function paymentStatusLabel(payment: PaymentHistoryItem): string {
  if (payment.credited) return "PAID — Credited";
  return payment.status.toUpperCase();
}

export function canDownloadInvoice(payment: PaymentHistoryItem): boolean {
  return payment.credited || payment.status === "completed";
}

export function buildInvoiceHtml(
  payment: PaymentHistoryItem,
  buyerName: string
): string {
  const issueDate = formatInvoiceDate(payment.completedAt || payment.createdAt);
  const method = payment.paymentMethod?.trim() || "QRIS / Online payment";
  const buyer = buyerName.trim() || "API Key Member";
  const rateLabel = `1 USD = ${payment.idrPerUsd.toLocaleString("id-ID")} IDR`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${escapeHtml(payment.orderId)} — ${escapeHtml(COMPANY.name)}</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #1a1a1a;
      background: #fff;
      font-family: "Georgia", "Times New Roman", Times, serif;
      font-size: 12pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      max-width: 210mm;
      margin: 0 auto;
      padding: 12mm 10mm;
    }
    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5pt solid #1a1a1a;
      padding-bottom: 14px;
      margin-bottom: 22px;
    }
    .brand-name {
      font-size: 26pt;
      font-weight: 700;
      letter-spacing: 0.02em;
      margin: 0;
    }
    .brand-tag {
      margin: 4px 0 0;
      font-size: 9pt;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #555;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
    .doc-meta {
      text-align: right;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 10pt;
    }
    .doc-meta .doc-title {
      font-size: 16pt;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      margin: 0 0 8px;
    }
    .doc-meta p { margin: 2px 0; color: #333; }
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 28px;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 10pt;
    }
    .party-label {
      font-size: 8pt;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #666;
      margin: 0 0 8px;
      font-weight: 600;
    }
    .party-name {
      font-size: 12pt;
      font-weight: 700;
      margin: 0 0 4px;
      font-family: Georgia, serif;
    }
    .party p { margin: 2px 0; color: #333; }
    table.lines {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 20px;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 10pt;
    }
    table.lines th {
      text-align: left;
      border-top: 1.5pt solid #1a1a1a;
      border-bottom: 1.5pt solid #1a1a1a;
      padding: 10px 8px;
      font-size: 8pt;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #444;
    }
    table.lines th.num, table.lines td.num { text-align: right; }
    table.lines td {
      padding: 14px 8px;
      border-bottom: 0.75pt solid #ccc;
      vertical-align: top;
    }
    .totals {
      width: 52%;
      margin-left: auto;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 10pt;
    }
    .totals .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 0.5pt solid #ddd;
    }
    .totals .grand {
      margin-top: 4px;
      padding-top: 10px;
      border-top: 2pt solid #1a1a1a;
      border-bottom: none;
      font-size: 12pt;
      font-weight: 700;
    }
    .notes {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 0.75pt solid #ccc;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 9pt;
      color: #444;
    }
    .notes p { margin: 4px 0; }
    .footer {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 9pt;
      color: #555;
    }
    .stamp {
      border: 1.5pt solid #1a1a1a;
      padding: 10px 18px;
      text-align: center;
      min-width: 140px;
    }
    .stamp strong {
      display: block;
      font-size: 10pt;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .stamp span { display: block; margin-top: 4px; font-size: 8pt; color: #666; }
    .no-print {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      padding: 12px 16px;
      background: #f4f4f4;
      border-bottom: 1px solid #ddd;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
    .no-print button {
      appearance: none;
      border: 1px solid #1a1a1a;
      background: #1a1a1a;
      color: #fff;
      padding: 8px 16px;
      font-size: 12px;
      cursor: pointer;
      border-radius: 4px;
    }
    .no-print button.secondary {
      background: #fff;
      color: #1a1a1a;
    }
    @media print {
      .no-print { display: none !important; }
      .sheet { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button type="button" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="sheet">
    <header class="letterhead">
      <div>
        <p class="brand-name">${escapeHtml(COMPANY.name)}</p>
        <p class="brand-tag">${escapeHtml(COMPANY.tagline)}</p>
      </div>
      <div class="doc-meta">
        <p class="doc-title">${escapeHtml(COMPANY.documentTitle)}</p>
        <p><strong>Invoice No.</strong> ${escapeHtml(payment.orderId)}</p>
        <p><strong>Issue Date</strong> ${escapeHtml(issueDate)}</p>
        <p><strong>Status</strong> ${escapeHtml(paymentStatusLabel(payment))}</p>
      </div>
    </header>

    <section class="parties">
      <div class="party">
        <p class="party-label">From</p>
        <p class="party-name">${escapeHtml(COMPANY.name)}</p>
        <p>Billing administration</p>
        <p>${escapeHtml(COMPANY.adminEmail)}</p>
      </div>
      <div class="party">
        <p class="party-label">Bill To</p>
        <p class="party-name">${escapeHtml(buyer)}</p>
        <p>API membership account</p>
        <p>Reference: ${escapeHtml(payment.id)}</p>
      </div>
    </section>

    <table class="lines">
      <thead>
        <tr>
          <th style="width: 8%">No.</th>
          <th>Description</th>
          <th class="num" style="width: 18%">Qty</th>
          <th class="num" style="width: 24%">Amount (IDR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>
            <strong>API Lifetime Quota Credit</strong><br />
            Credit value: ${escapeHtml(formatUsdPlain(payment.usdCredit))}<br />
            Exchange rate: ${escapeHtml(rateLabel)}<br />
            Payment method: ${escapeHtml(method)}
          </td>
          <td class="num">1</td>
          <td class="num">${escapeHtml(formatIdrPlain(payment.amountIdr))}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="row">
        <span>Subtotal</span>
        <span>${escapeHtml(formatIdrPlain(payment.amountIdr))}</span>
      </div>
      <div class="row">
        <span>Tax / PPN</span>
        <span>Included / Not applicable</span>
      </div>
      <div class="row grand">
        <span>Total Paid</span>
        <span>${escapeHtml(formatIdrPlain(payment.amountIdr))}</span>
      </div>
    </div>

    <section class="notes">
      <p><strong>Notes</strong></p>
      <p>
        This invoice confirms payment for lifetime API usage quota credited to the member account
        above. Amounts are denominated in Indonesian Rupiah (IDR). USD credit is applied at the
        exchange rate stated on the payment date.
      </p>
      <p>
        Thank you for your payment. For billing inquiries, contact
        <strong>${escapeHtml(COMPANY.adminEmail)}</strong>.
      </p>
    </section>

    <footer class="footer">
      <div>
        <p>Document generated by ${escapeHtml(COMPANY.name)}</p>
        <p>This is a computer-generated invoice and is valid without a wet signature.</p>
      </div>
      <div class="stamp">
        <strong>Paid</strong>
        <span>${escapeHtml(COMPANY.name)}</span>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

function saveInvoiceHtmlFile(payment: PaymentHistoryItem, html: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Mind-Aku-Invoice-${payment.orderId}.html`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function printInvoiceViaIframe(html: string): void {
  const existing = document.getElementById("mind-aku-invoice-frame");
  existing?.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "mind-aku-invoice-frame";
  iframe.setAttribute("aria-hidden", "true");
  // Sandbox: allow print modals + same-origin so we can call print(); no scripts.
  iframe.setAttribute("sandbox", "allow-modals allow-same-origin");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;pointer-events:none;";
  document.body.appendChild(iframe);

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // HTML file download already saved; user can open it and print.
    }
    window.setTimeout(() => iframe.remove(), 60_000);
  };

  iframe.addEventListener("load", triggerPrint);
  iframe.srcdoc = html;
  // Fallback if load does not fire for srcdoc in some browsers.
  window.setTimeout(triggerPrint, 350);
}

/**
 * Downloads the invoice as HTML and opens the system print dialog
 * (Save as PDF) via a hidden iframe — no pop-up window required.
 */
export function downloadInvoice(
  payment: PaymentHistoryItem,
  buyerName: string
): void {
  const html = buildInvoiceHtml(payment, buyerName);
  saveInvoiceHtmlFile(payment, html);
  printInvoiceViaIframe(html);
}
