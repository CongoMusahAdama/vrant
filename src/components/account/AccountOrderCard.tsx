import { MapPin, MessageCircle } from 'lucide-react';
import type { ShopOrder } from '@/types/customer';
import { getProductById } from '@/data/products';
import { cn } from '@/lib/utils';
import { openWhatsApp, buildOrderFollowUpMessage } from '@/lib/whatsapp';

import {
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  orderStatusBadgeClass,
} from '@/lib/order-status';

type AccountOrderCardProps = {
  order: ShopOrder;
  onViewDelivery: () => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function paymentDisplay(order: ShopOrder) {
  if (order.channel === 'paystack') {
    const ps = order.paymentStatus || 'pending';
    return {
      label: PAYMENT_STATUS_LABEL[ps] || ps,
      paid: ps === 'paid',
      pending: ps === 'pending',
      failed: ps === 'failed',
    };
  }
  return { label: 'WhatsApp', paid: false, pending: true, failed: false };
}

const AccountOrderCard = ({ order, onViewDelivery }: AccountOrderCardProps) => {
  const payment = paymentDisplay(order);

  return (
    <article className="border border-black/10 bg-white p-4 space-y-4">
      <div className="flex gap-3">
        <div className="flex gap-1.5 shrink-0">
          {order.items.map((item) => {
            const src = getProductById(item.productId)?.frontImage;
            return src ? (
              <img
                key={`${item.productId}-${item.size}`}
                src={src}
                alt={item.name}
                className="w-14 h-14 object-contain border border-black/10 bg-[#fafafa] p-0.5"
                loading="lazy"
              />
            ) : (
              <span
                key={`${item.productId}-${item.size}`}
                className="w-14 h-14 border border-dashed border-black/15 flex items-center justify-center text-[7px] font-bold uppercase text-black/30"
              >
                —
              </span>
            );
          })}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-black leading-snug">
            {order.orderNumber}
          </p>
          <p className="text-[9px] font-bold uppercase text-black/40 mt-0.5">
            {formatDate(order.createdAt)} · {order.channel === 'paystack' ? 'Paystack' : 'WhatsApp'}
          </p>
          <p className="text-[11px] font-bold text-black mt-2">₵{order.totalAmount}</p>
        </div>
      </div>

      <ul className="space-y-1.5 border-t border-black/5 pt-3">
        {order.items.map((item) => (
          <li
            key={`${item.productId}-${item.size}`}
            className="text-[9px] font-bold uppercase text-black/65 leading-relaxed"
          >
            {item.name} · {item.size} × {item.quantity}
            {item.colorPreference ? ` · ${item.colorPreference}` : ''}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <span
          className={cn(
            'text-[9px] font-bold tracking-[0.1em] uppercase px-2.5 py-1.5 border',
            payment.paid && 'bg-emerald-50 text-emerald-900 border-emerald-300',
            payment.pending && !payment.failed && 'bg-amber-50 text-amber-900 border-amber-200',
            payment.failed && 'bg-red-50 text-red-800 border-red-200',
            !payment.paid && !payment.pending && !payment.failed && 'border-black/15 text-black/50'
          )}
        >
          {payment.label}
        </span>
        <span
          className={cn(
            'text-[9px] font-bold tracking-[0.1em] uppercase px-2.5 py-1.5 border',
            orderStatusBadgeClass(order.status)
          )}
        >
          {ORDER_STATUS_LABEL[order.status] || order.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={onViewDelivery}
          className="inline-flex items-center justify-center gap-2 border border-black/20 py-3 min-h-[48px] text-[9px] font-bold tracking-[0.12em] uppercase active:bg-black/[0.04]"
        >
          <MapPin className="w-4 h-4 shrink-0" />
          Details
        </button>
        <button
          type="button"
          onClick={() => openWhatsApp(buildOrderFollowUpMessage(order))}
          className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 min-h-[48px] text-[9px] font-bold tracking-[0.12em] uppercase active:bg-[#1fb855]"
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          WhatsApp
        </button>
      </div>
    </article>
  );
};

export default AccountOrderCard;
