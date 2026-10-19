import { SITE_LOGO_SRC } from '@/lib/brand';
import { getProductById } from '@/data/products';
import type { AdminShopOrder } from '@/admin/types/admin';
import { formatGhs, formatShortDate } from '@/admin/lib/format';

function assetUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const origin =
    typeof window !== 'undefined' ? window.location.origin : import.meta.env.VITE_SITE_URL || '';
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

function customerName(order: AdminShopOrder) {
  const c = order.customer;
  if (c && typeof c === 'object') return c.name;
  return order.shippingAddress?.fullName || 'Customer';
}

function deliveryLines(order: AdminShopOrder) {
  const addr = order.shippingAddress;
  if (!addr) return '';
  const place =
    addr.deliveryMethod === 'pickup'
      ? `Pickup: ${addr.pickupStation || '—'}`
      : `${addr.street || ''}, ${addr.city}, ${addr.region}`;
  return `${place}<br />${addr.phone || ''}`;
}

export const RECEIPT_PRINT_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; margin: 0; padding: 24px; color: #111; font-size: 11px; background: #fff; }
  .receipt-sheet { position: relative; overflow: hidden; max-width: 420px; margin: 0 auto; }
  .receipt-watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 0; }
  .receipt-watermark img { width: 82%; max-height: 82%; object-fit: contain; opacity: 0.1; }
  .receipt-body { position: relative; z-index: 1; }
  .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .brand img { height: 40px; width: auto; object-fit: contain; }
  h1 { font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; margin: 0; }
  .subtitle { color: #666; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px; margin: 14px 0 16px; }
  .meta-label { color: #888; font-size: 8px; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 2px; }
  .meta-value { font-size: 10px; text-transform: uppercase; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { text-align: left; padding: 8px 4px; border-bottom: 1px solid #e8e8e8; vertical-align: top; font-size: 10px; }
  th { font-size: 8px; text-transform: uppercase; letter-spacing: 0.12em; color: #888; font-weight: 700; }
  td.qty, td.price, th.qty, th.price { text-align: right; }
  .item-img { width: 44px; height: 44px; object-fit: contain; border: 1px solid #e5e5e5; background: #fff; padding: 2px; }
  .item-name { font-weight: 700; text-transform: uppercase; font-size: 9px; line-height: 1.35; }
  .item-size { color: #888; font-size: 8px; text-transform: uppercase; margin-top: 2px; }
  .total { font-weight: 700; font-size: 14px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd; text-transform: uppercase; letter-spacing: 0.06em; }
  .delivery { margin-top: 14px; padding-top: 12px; border-top: 1px solid #ddd; color: #555; font-size: 9px; text-transform: uppercase; line-height: 1.5; }
  .delivery-label { color: #888; font-size: 8px; letter-spacing: 0.12em; margin-bottom: 4px; }
`;

export function buildReceiptHtml(order: AdminShopOrder) {
  const logoUrl = assetUrl(SITE_LOGO_SRC);
  const itemRows = order.items
    .map((item, i) => {
      const imageSrc = assetUrl(getProductById(item.productId)?.frontImage || '');
      const imageCell = imageSrc
        ? `<img class="item-img" src="${imageSrc}" alt="${item.name}" />`
        : `<span class="item-img" style="display:inline-flex;align-items:center;justify-content:center;font-size:7px;color:#aaa;">—</span>`;

      return `
        <tr>
          <td>${imageCell}</td>
          <td>
            <div class="item-name">${item.name}</div>
            <div class="item-size">${item.size}${item.colorPreference ? ` · ${item.colorPreference}` : ''}</div>
          </td>
          <td class="qty">${item.quantity}</td>
          <td class="price">${item.price}</td>
        </tr>
      `;
    })
    .join('');

  const paymentRow = order.paymentStatus
    ? `<div><div class="meta-label">Payment</div><div class="meta-value">${order.paymentStatus}</div></div>`
    : '';

  return `
    <div class="receipt-sheet">
      <div class="receipt-watermark"><img src="${logoUrl}" alt="" /></div>
      <div class="receipt-body">
        <div class="brand">
          <img src="${logoUrl}" alt="VRANT" />
          <div>
            <h1>VRANT</h1>
            <div class="subtitle">Order receipt</div>
          </div>
        </div>
        <div class="meta">
          <div><div class="meta-label">Order</div><div class="meta-value">${order.orderNumber}</div></div>
          <div><div class="meta-label">Date</div><div class="meta-value">${formatShortDate(order.createdAt)}</div></div>
          <div><div class="meta-label">Customer</div><div class="meta-value">${customerName(order)}</div></div>
          <div><div class="meta-label">Status</div><div class="meta-value">${order.status}</div></div>
          ${paymentRow}
          <div><div class="meta-label">Channel</div><div class="meta-value">${order.channel}</div></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Item</th>
              <th class="qty">Qty</th>
              <th class="price">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div class="total">Total ${formatGhs(order.totalAmount)}</div>
        ${
          order.shippingAddress
            ? `<div class="delivery"><div class="delivery-label">Delivery</div>${deliveryLines(order)}</div>`
            : ''
        }
      </div>
    </div>
  `;
}

export function openReceiptPrintWindow(order: AdminShopOrder) {
  const win = window.open('', '_blank', 'width=520,height=760');
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt ${order.orderNumber}</title>
        <style>${RECEIPT_PRINT_STYLES}</style>
      </head>
      <body>${buildReceiptHtml(order)}</body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

export async function downloadReceiptPdf(order: AdminShopOrder, element: HTMLElement) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  pdf.save(`VRANT-receipt-${order.orderNumber}.pdf`);
}
