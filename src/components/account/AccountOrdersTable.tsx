import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, MessageCircle } from 'lucide-react';
import type { ShopOrder } from '@/types/customer';
import { getProductById } from '@/data/products';
import { cn } from '@/lib/utils';
import { openWhatsApp, buildOrderFollowUpMessage } from '@/lib/whatsapp';
import AccountOrderCard from '@/components/account/AccountOrderCard';
import OrderDeliveryDetailsDialog from '@/components/account/OrderDeliveryDetailsDialog';
import OrdersTablePagination, {
  ORDERS_PAGE_SIZE,
  type OrdersTablePaginationProps,
} from '@/components/account/OrdersTablePagination';

import {
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  orderStatusBadgeClass,
} from '@/lib/order-status';

type AccountOrdersTableProps = {
  orders: ShopOrder[];
  pagination?: Pick<OrdersTablePaginationProps, 'page' | 'totalPages' | 'total' | 'onPageChange'>;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function itemsSummary(order: ShopOrder) {
  const first = order.items[0];
  if (!first) return '—';
  const extra = order.items.length > 1 ? ` +${order.items.length - 1} more` : '';
  const color = first.colorPreference ? ` · ${first.colorPreference}` : '';
  return `${first.name} (${first.size}×${first.quantity})${extra}${color}`;
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

function orderItemImages(order: ShopOrder) {
  return order.items.map((item) => {
    const product = getProductById(item.productId);
    return {
      key: `${item.productId}-${item.size}`,
      src: product?.frontImage || '',
      name: item.name,
    };
  });
}

const AccountOrdersTable = ({ orders, pagination }: AccountOrdersTableProps) => {
  const [deliveryOrder, setDeliveryOrder] = useState<ShopOrder | null>(null);

  if (orders.length === 0) {
    return (
      <div className="border border-dashed border-black/20 p-8 sm:p-12 text-center">
        <p className="text-[11px] font-bold uppercase text-black/50 mb-4">No orders yet</p>
        <Link
          to="/products"
          className="inline-flex items-center justify-center w-full sm:w-auto bg-black text-white px-8 py-3.5 min-h-[48px] text-[10px] font-bold tracking-[0.2em] uppercase hover:opacity-90"
        >
          Shop collection
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: stacked order cards */}
      <div className="md:hidden space-y-3">
        {orders.map((order) => (
          <AccountOrderCard
            key={order._id}
            order={order}
            onViewDelivery={() => setDeliveryOrder(order)}
          />
        ))}
        {pagination && pagination.total > 0 && (
          <OrdersTablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={pagination.onPageChange}
            className="border border-black/10 rounded-none"
          />
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block border border-black/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase w-[88px]">
                  Products
                </th>
                <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Order</th>
                <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Date</th>
                <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase min-w-[160px]">
                  Items
                </th>
                <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase text-right">
                  Total
                </th>
                <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Payment</th>
                <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Status</th>
                <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase min-w-[140px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => {
                const payment = paymentDisplay(order);
                const images = orderItemImages(order);
                return (
                  <tr
                    key={order._id}
                    className={cn(
                      'border-t border-black/10 align-top',
                      index % 2 === 1 && 'bg-black/[0.02]'
                    )}
                  >
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {images.map((img) =>
                          img.src ? (
                            <img
                              key={img.key}
                              src={img.src}
                              alt={img.name}
                              title={img.name}
                              className="w-12 h-12 sm:w-14 sm:h-14 object-contain border border-black/10 bg-white p-0.5 shrink-0"
                              loading="lazy"
                            />
                          ) : (
                            <span
                              key={img.key}
                              className="w-12 h-12 sm:w-14 sm:h-14 border border-dashed border-black/15 bg-black/[0.02] flex items-center justify-center text-[7px] font-bold uppercase text-black/30 text-center px-0.5"
                            >
                              No img
                            </span>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-black">
                        {order.orderNumber}
                      </p>
                      <p className="text-[8px] font-bold uppercase text-black/40 mt-0.5">
                        {order.channel === 'paystack' ? 'Paystack' : 'WhatsApp'}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-[10px] font-bold text-black/70 tabular-nums whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-3 py-4 text-[9px] font-bold uppercase text-black/70 leading-relaxed max-w-[200px]">
                      {itemsSummary(order)}
                    </td>
                    <td className="px-3 py-4 text-[11px] font-bold tabular-nums text-right whitespace-nowrap">
                      ₵{order.totalAmount}
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={cn(
                          'inline-block text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-1 border',
                          payment.paid && 'bg-emerald-50 text-emerald-900 border-emerald-300',
                          payment.pending &&
                            !payment.failed &&
                            'bg-amber-50 text-amber-900 border-amber-200',
                          payment.failed && 'bg-red-50 text-red-800 border-red-200',
                          !payment.paid &&
                            !payment.pending &&
                            !payment.failed &&
                            'border-black/15 text-black/50'
                        )}
                      >
                        {payment.label}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={cn(
                          'inline-block text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-1 border',
                          orderStatusBadgeClass(order.status)
                        )}
                      >
                        {ORDER_STATUS_LABEL[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <button
                          type="button"
                          onClick={() => setDeliveryOrder(order)}
                          className="inline-flex items-center justify-center gap-1.5 border border-black/20 px-2 py-2 min-h-[40px] text-[8px] font-bold tracking-[0.12em] uppercase hover:border-black hover:bg-black/[0.03] transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => openWhatsApp(buildOrderFollowUpMessage(order))}
                          className="inline-flex items-center justify-center gap-1.5 bg-[#25D366] text-white px-2 py-2 min-h-[40px] text-[8px] font-bold tracking-[0.12em] uppercase hover:bg-[#1fb855] transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                          WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pagination && pagination.total > 0 && (
          <OrdersTablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={pagination.onPageChange}
          />
        )}
      </div>

      <OrderDeliveryDetailsDialog order={deliveryOrder} onClose={() => setDeliveryOrder(null)} />
    </>
  );
};

export default AccountOrdersTable;

