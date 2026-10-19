import { X } from 'lucide-react';
import type { ShopOrder } from '@/types/customer';
import { formatDeliveryBlock } from '@/lib/delivery';
import {
  ORDER_STATUS_LABEL,
  orderStatusBadgeClass,
  orderStatusMessage,
} from '@/lib/order-status';
import { cn } from '@/lib/utils';

type OrderDeliveryDetailsDialogProps = {
  order: ShopOrder | null;
  onClose: () => void;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const OrderDeliveryDetailsDialog = ({ order, onClose }: OrderDeliveryDetailsDialogProps) => {
  if (!order) return null;

  const d = order.shippingAddress;
  const hasAddress =
    d?.fullName?.trim() ||
    d?.phone?.trim() ||
    d?.street?.trim() ||
    d?.pickupStation?.trim() ||
    d?.city?.trim();

  const history = [...(order.statusHistory || [])].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );
  const timeline =
    history.length > 0
      ? history
      : [{ status: order.status, changedAt: order.updatedAt || order.createdAt }];

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white border border-black border-b-0 sm:border-b max-h-[85vh] sm:max-h-[90vh] overflow-y-auto rounded-t-xl sm:rounded-none pb-[env(safe-area-inset-bottom)]">
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <span className="w-10 h-1 rounded-full bg-black/15" aria-hidden />
        </div>
        <div className="flex items-center justify-between border-b border-black px-4 py-4">
          <div>
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase">Order details</h2>
            <p className="text-[10px] font-bold text-black/50 mt-1">{order.orderNumber}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 min-h-[44px] min-w-[44px]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-6">
          <div>
            <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/40 mb-2">
              Current status
            </p>
            <span
              className={cn(
                'inline-block text-[10px] font-bold tracking-[0.12em] uppercase px-3 py-2 border',
                orderStatusBadgeClass(order.status)
              )}
            >
              {ORDER_STATUS_LABEL[order.status] || order.status}
            </span>
            <p className="text-[9px] font-bold uppercase text-black/50 mt-2 leading-relaxed">
              {orderStatusMessage(order.status)}
            </p>
          </div>

          <div>
            <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/40 mb-3">
              Status updates
            </p>
            <ul className="space-y-2 border border-black/10 divide-y divide-black/5">
              {timeline.map((entry, index) => (
                <li
                  key={`${entry.status}-${entry.changedAt}-${index}`}
                  className="px-3 py-2.5 flex items-start justify-between gap-3"
                >
                  <span
                    className={cn(
                      'text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-1 border shrink-0',
                      orderStatusBadgeClass(entry.status)
                    )}
                  >
                    {ORDER_STATUS_LABEL[entry.status] || entry.status}
                  </span>
                  <span className="text-[8px] font-bold uppercase text-black/45 text-right leading-relaxed">
                    {formatDateTime(entry.changedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/40 mb-2">
              Delivery / pickup
            </p>
            {!hasAddress ? (
              <p className="text-[10px] font-bold uppercase text-black/50">
                No delivery details saved for this order.
              </p>
            ) : (
              <div className="p-4 border border-black bg-[#fafafa]">
                <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/40 mb-2">
                  {d.deliveryMethod === 'pickup' ? 'Pickup' : 'Home delivery'}
                </p>
                <pre className="text-[10px] font-bold uppercase text-black/70 leading-relaxed whitespace-pre-wrap break-words font-[inherit]">
                  {formatDeliveryBlock(d)}
                </pre>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full border border-black py-3 min-h-[48px] text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDeliveryDetailsDialog;
