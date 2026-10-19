import { useRef, useState } from 'react';
import { Download } from 'lucide-react';
import type { AdminShopOrder } from '@/admin/types/admin';
import { formatGhs, formatShortDate } from '@/admin/lib/format';
import { downloadReceiptPdf, openReceiptPrintWindow } from '@/admin/lib/receiptExport';
import { getProductById } from '@/data/products';
import { SITE_LOGO_ALT, SITE_LOGO_SRC } from '@/lib/brand';
import { ADMIN_BTN, ADMIN_BTN_OUTLINE } from '@/admin/lib/apiForm';

type OrderReceiptProps = {
  order: AdminShopOrder;
  onClose: () => void;
};

function customerName(order: AdminShopOrder) {
  const c = order.customer;
  if (c && typeof c === 'object') return c.name;
  return order.shippingAddress?.fullName || 'Customer';
}

const OrderReceipt = ({ order, onClose }: OrderReceiptProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    openReceiptPrintWindow(order);
  };

  const handleDownload = async () => {
    const sheet = receiptRef.current;
    if (!sheet) return;
    setDownloading(true);
    try {
      await downloadReceiptPdf(order, sheet);
    } catch {
      /* fallback: open print dialog */
      openReceiptPrintWindow(order);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-md bg-white border border-black/10 max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 shrink-0">
          <p className="text-[10px] font-bold tracking-[0.15em] uppercase">Receipt</p>
          <button
            type="button"
            onClick={onClose}
            className="text-[9px] font-bold uppercase text-black/50 hover:text-black min-h-[44px] px-2"
          >
            Close
          </button>
        </div>

        <div
          ref={receiptRef}
          className="relative overflow-hidden bg-white p-5 space-y-4 shrink-0"
        >
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden
          >
            <img
              src={SITE_LOGO_SRC}
              alt=""
              className="max-w-[82%] max-h-[82%] object-contain opacity-[0.1]"
            />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={SITE_LOGO_SRC}
                alt={SITE_LOGO_ALT}
                className="h-10 w-auto object-contain shrink-0"
              />
              <div>
                <h1 className="text-[12px] font-bold tracking-[0.12em] uppercase">VRANT</h1>
                <p className="text-[9px] font-bold uppercase text-black/45 mt-1">Order receipt</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[9px] font-bold uppercase">
              <div>
                <p className="text-black/40">Order</p>
                <p className="text-black mt-0.5">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-black/40">Date</p>
                <p className="text-black mt-0.5">{formatShortDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-black/40">Customer</p>
                <p className="text-black mt-0.5">{customerName(order)}</p>
              </div>
              <div>
                <p className="text-black/40">Status</p>
                <p className="text-black mt-0.5">{order.status}</p>
              </div>
              {order.paymentStatus && (
                <div>
                  <p className="text-black/40">Payment</p>
                  <p className="text-black mt-0.5">{order.paymentStatus}</p>
                </div>
              )}
              <div>
                <p className="text-black/40">Channel</p>
                <p className="text-black mt-0.5">{order.channel}</p>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="text-left py-2 pr-2 text-[8px] font-bold uppercase text-black/40 w-14">
                    Image
                  </th>
                  <th className="text-left py-2 text-[8px] font-bold uppercase text-black/40">
                    Item
                  </th>
                  <th className="text-right py-2 text-[8px] font-bold uppercase text-black/40 w-10">
                    Qty
                  </th>
                  <th className="text-right py-2 text-[8px] font-bold uppercase text-black/40 w-16">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => {
                  const imageSrc = getProductById(item.productId)?.frontImage;
                  return (
                    <tr key={i} className="border-b border-black/5">
                      <td className="py-2 pr-2 align-top">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={item.name}
                            className="w-11 h-11 object-contain border border-black/10 bg-white p-0.5"
                          />
                        ) : (
                          <span className="w-11 h-11 border border-dashed border-black/15 bg-black/[0.02] flex items-center justify-center text-[7px] font-bold uppercase text-black/30">
                            —
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-[9px] font-bold uppercase align-top">
                        {item.name}
                        <span className="text-black/40 block text-[8px]">
                          {item.size}
                          {item.colorPreference ? ` · ${item.colorPreference}` : ''}
                        </span>
                      </td>
                      <td className="py-2 text-right text-[9px] tabular-nums align-top">
                        {item.quantity}
                      </td>
                      <td className="py-2 text-right text-[9px] align-top">{item.price}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <p className="text-[13px] font-bold tabular-nums border-t border-black/10 pt-3">
              Total {formatGhs(order.totalAmount)}
            </p>

            {order.shippingAddress && (
              <div className="text-[9px] font-bold uppercase text-black/50 leading-relaxed pt-2 border-t border-black/10">
                <p className="text-black/40 mb-1">Delivery</p>
                {order.shippingAddress.deliveryMethod === 'pickup'
                  ? `Pickup: ${order.shippingAddress.pickupStation || '—'}`
                  : `${order.shippingAddress.street || ''}, ${order.shippingAddress.city}, ${order.shippingAddress.region}`}
                <br />
                {order.shippingAddress.phone}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 p-4 border-t border-black/10 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className={`flex-1 ${ADMIN_BTN} gap-2`}
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            {downloading ? 'Preparing…' : 'Download PDF'}
          </button>
          <button type="button" onClick={handlePrint} className={`flex-1 ${ADMIN_BTN_OUTLINE}`}>
            Print receipt
          </button>
          <button type="button" onClick={onClose} className={`sm:w-auto ${ADMIN_BTN_OUTLINE}`}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderReceipt;
