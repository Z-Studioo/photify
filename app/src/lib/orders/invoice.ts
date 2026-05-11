/**
 * Lightweight HTML invoice renderer. Used by both the orders list "Print"
 * action and the detail page's "Print / Download" actions to keep a single
 * template the truth.
 *
 * NOTE: this is intentionally a stop-gap until we move invoice rendering
 * server-side (PDF via puppeteer or pdfkit). For now both the list and
 * detail pages were carrying duplicate inline HTML, which made it
 * impossible to update the brand/styling consistently.
 */
export interface InvoiceItem {
  product: string;
  size?: string | null;
  unitPrice: string;
  quantity: number;
}

export interface InvoiceData {
  orderNumber: string;
  customer: string;
  email: string;
  phone?: string;
  date?: string;
  shippingMethod?: string;
  items: InvoiceItem[];
  subtotal?: string;
  deliveryCharge?: string;
  discount?: number;
  promoCode?: string | null;
  total: string;
}

function escape(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderInvoiceHtml(data: InvoiceData): string {
  const rows = data.items
    .map(
      item => `
        <tr>
          <td>${escape(item.product)}</td>
          <td>${escape(item.size ?? 'N/A')}</td>
          <td>${escape(item.unitPrice)}</td>
          <td>${escape(item.quantity ?? 1)}</td>
        </tr>`
    )
    .join('');

  const totalsBlock = (() => {
    const lines: string[] = [];
    if (data.subtotal) {
      lines.push(
        `<tr><td>Subtotal</td><td style="text-align:right">${escape(data.subtotal)}</td></tr>`
      );
    }
    if (data.deliveryCharge) {
      lines.push(
        `<tr><td>Delivery</td><td style="text-align:right">${escape(data.deliveryCharge)}</td></tr>`
      );
    }
    if (data.discount && data.discount > 0) {
      const codeSuffix = data.promoCode ? ` (${escape(data.promoCode)})` : '';
      lines.push(
        `<tr><td style="color:#15803d">Discount${codeSuffix}</td><td style="text-align:right;color:#15803d">-£${data.discount.toFixed(2)}</td></tr>`
      );
    }
    lines.push(
      `<tr><td><strong>Total</strong></td><td style="text-align:right"><strong>${escape(data.total)}</strong></td></tr>`
    );
    return `<table class="totals">${lines.join('')}</table>`;
  })();

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Invoice ${escape(data.orderNumber)}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
      h1 { color: #f63a9e; margin-bottom: 4px; }
      .meta { margin-bottom: 16px; font-size: 13px; color: #444; }
      .meta p { margin: 2px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 13px; }
      table.totals { width: 320px; margin-left: auto; margin-top: 16px; }
      table.totals td { border: none; padding: 6px 8px; }
    </style>
  </head>
  <body>
    <h1>Invoice ${escape(data.orderNumber)}</h1>
    <div class="meta">
      <p><strong>Customer:</strong> ${escape(data.customer)}</p>
      <p><strong>Email:</strong> ${escape(data.email)}</p>
      ${data.phone ? `<p><strong>Phone:</strong> ${escape(data.phone)}</p>` : ''}
      ${data.date ? `<p><strong>Date:</strong> ${escape(data.date)}</p>` : ''}
      ${data.shippingMethod ? `<p><strong>Shipping:</strong> ${escape(data.shippingMethod)}</p>` : ''}
    </div>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Size</th>
          <th>Unit Price</th>
          <th>Quantity</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${totalsBlock}
  </body>
</html>`;
}

export function openInvoiceForPrint(data: InvoiceData): boolean {
  const html = renderInvoiceHtml(data);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
}

export function downloadInvoiceHtml(data: InvoiceData): void {
  const html = renderInvoiceHtml(data);
  const blob = new Blob([html], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `invoice-${data.orderNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
