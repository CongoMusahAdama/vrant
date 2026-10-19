import { Link } from 'react-router-dom';
import { FileText, MapPin } from 'lucide-react';
import type { AdminShopOrder } from '@/admin/types/admin';
import AdminStatusBadge from '@/admin/components/ui/AdminStatusBadge';
import OrderProductImages from '@/admin/components/orders/OrderProductImages';
import { customerLabel, itemsSummary, paymentStatus } from '@/admin/lib/orders';
import { formatGhs, formatShortDate } from '@/admin/lib/format';
import { ORDER_STATUSES } from '@/admin/lib/status';
import { ADMIN_BTN_OUTLINE } from '@/admin/lib/apiForm';
import { cn } from '@/lib/utils';

type AdminOrderCardProps = {
  order: AdminShopOrder;
  variant?: 'recent' | 'manage' | 'receipt';
  onStatusChange?: (orderId: string, status: string) => void;
  onConfirmStatus?: (order: AdminShopOrder, next: string) => Promise<boolean>;
  onDelivery?: (order: AdminShopOrder) => void;
  onReceipt?: (order: AdminShopOrder) => void;
};

const AdminOrderCard = ({
  order,
  variant = 'recent',
  onStatusChange,
  onConfirmStatus,
  onDelivery,
  onReceipt,
}: AdminOrderCardProps) => {
  const customer = customerLabel(order);
  const payment = paymentStatus(order);

  return (
    <article className="border border-black/10 bg-white p-3.5 space-y-3">
      <div className="flex items-start gap-3">
        <OrderProductImages order={order} size="sm" />
        <div className="min-w-0 flex-1">
          {variant === 'recent' ? (
            <Link
              to="/admin/orders"
              className="text-[11px] font-bold tracking-[0.1em] uppercase text-black hover:underline"
            >
              {order.orderNumber}
            </Link>
          ) : (
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-black">
              {order.orderNumber}
            </p>
          )}
          <p className="text-[8px] font-bold uppercase text-black/40 mt-0.5">
            {order.channel === 'paystack' ? 'Paystack' : 'WhatsApp'} · {formatShortDate(order.createdAt)}
          </p>
          <p className="text-[10px] font-bold text-black mt-1.5 truncate">{customer.name}</p>
          {customer.phone ? (
            <p className="text-[9px] font-bold text-black/45 tabular-nums">{customer.phone}</p>
          ) : null}
        </div>
        <p className="text-sm font-bold tabular-nums text-black shrink-0">{formatGhs(order.totalAmount)}</p>
      </div>

      <p className="text-[9px] font-bold uppercase text-black/60 leading-relaxed line-clamp-2">
        {itemsSummary(order)}
      </p>

      <div className="flex flex-wrap gap-1.5">
        <AdminStatusBadge status={order.status} />
        <AdminStatusBadge status={payment} />
      </div>

      {variant === 'manage' && onStatusChange ? (
        <div className="grid grid-cols-1 gap-2 pt-1">
          <select
            value={order.status}
            onChange={async (e) => {
              const next = e.target.value;
              if (next === order.status) return;
              const ok = onConfirmStatus ? await onConfirmStatus(order, next) : true;
              if (ok) onStatusChange(order._id, next);
            }}
            className="w-full border border-black/20 bg-white px-3 py-3 min-h-[48px] text-[10px] font-bold uppercase tracking-wider text-black"
            aria-label={`Update status for ${order.orderNumber}`}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {onDelivery ? (
            <button
              type="button"
              onClick={() => onDelivery(order)}
              className={cn(ADMIN_BTN_OUTLINE, 'w-full gap-1.5 min-h-[48px] justify-center')}
            >
              <MapPin className="w-4 h-4 shrink-0" />
              View delivery
            </button>
          ) : null}
        </div>
      ) : null}

      {variant === 'receipt' && onReceipt ? (
        <button
          type="button"
          onClick={() => onReceipt(order)}
          className={cn(ADMIN_BTN_OUTLINE, 'w-full gap-1.5 min-h-[48px] justify-center')}
        >
          <FileText className="w-4 h-4 shrink-0" />
          Generate receipt
        </button>
      ) : null}
    </article>
  );
};

export default AdminOrderCard;
