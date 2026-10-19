import { useState } from 'react';
import { MapPin } from 'lucide-react';
import type { AdminShopOrder } from '@/admin/types/admin';
import AdminStatusBadge from '@/admin/components/ui/AdminStatusBadge';
import OrderProductImages from '@/admin/components/orders/OrderProductImages';
import AdminOrderCard from '@/admin/components/orders/AdminOrderCard';
import AdminPagination from '@/admin/components/ui/AdminPagination';
import OrderDeliveryDetailsDialog from '@/components/account/OrderDeliveryDetailsDialog';
import { customerLabel, itemsSummary, paymentStatus } from '@/admin/lib/orders';
import { formatGhs, formatShortDate } from '@/admin/lib/format';
import { ORDER_STATUSES, STATUS_LABEL } from '@/admin/lib/status';
import { cn } from '@/lib/utils';
import { useAdminConfirm } from '@/admin/contexts/AdminConfirmContext';

type AdminOrdersListProps = {
  orders: AdminShopOrder[];
  loading?: boolean;
  onStatusChange: (orderId: string, status: string) => void;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
};

const AdminOrdersList = ({
  orders,
  loading,
  onStatusChange,
  pagination,
}: AdminOrdersListProps) => {
  const { confirm } = useAdminConfirm();
  const [deliveryOrder, setDeliveryOrder] = useState<AdminShopOrder | null>(null);

  const confirmStatusChange = async (order: AdminShopOrder, next: string) =>
    confirm({
      title: 'Update order status?',
      message: `Change ${order.orderNumber} from ${STATUS_LABEL[order.status] || order.status} to ${STATUS_LABEL[next] || next}?`,
      confirmLabel: 'Update status',
      cancelLabel: 'Cancel',
    });

  if (loading) {
    return (
      <div className="py-12 text-center border border-black/10">
        <p className="text-[10px] font-bold uppercase text-black/40 animate-pulse">
          Loading orders…
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="border border-dashed border-black/20 p-8 sm:p-12 text-center">
        <p className="text-[11px] font-bold uppercase text-black/50">No orders yet</p>
        <p className="text-[10px] font-bold text-black/40 mt-2 uppercase tracking-wider">
          Orders from WhatsApp or Paystack checkout will appear here
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="lg:hidden space-y-2.5">
        {orders.map((order) => (
          <AdminOrderCard
            key={order._id}
            order={order}
            variant="manage"
            onStatusChange={onStatusChange}
            onConfirmStatus={confirmStatusChange}
            onDelivery={setDeliveryOrder}
          />
        ))}
      </div>

      <div className="hidden lg:block border border-black/10 overflow-x-auto bg-white">
        <table className="w-full min-w-[960px] text-left border-collapse">
          <thead>
            <tr className="bg-black text-white">
              <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase w-[100px]">
                Products
              </th>
              <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Order</th>
              <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Customer</th>
              <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Date</th>
              <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase min-w-[160px]">
                Items
              </th>
              <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase text-right">
                Total
              </th>
              <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Payment</th>
              <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase min-w-[120px]">
                Status
              </th>
              <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase min-w-[120px]">
                Delivery
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => {
              const customer = customerLabel(order);
              const payment = paymentStatus(order);

              return (
                <tr
                  key={order._id}
                  className={cn(
                    'border-t border-black/10 align-top',
                    index % 2 === 1 && 'bg-black/[0.02]'
                  )}
                >
                  <td className="px-3 py-3">
                    <OrderProductImages order={order} />
                  </td>
                  <td className="px-3 py-4">
                    <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-black">
                      {order.orderNumber}
                    </p>
                    <p className="text-[8px] font-bold uppercase text-black/40 mt-0.5">
                      {order.channel === 'paystack' ? 'Paystack' : 'WhatsApp'}
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    <p className="text-[10px] font-bold text-black max-w-[140px] truncate">
                      {customer.name}
                    </p>
                    {customer.phone ? (
                      <p className="text-[8px] font-bold text-black/45 mt-0.5 tabular-nums">
                        {customer.phone}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-4 text-[10px] font-bold text-black/70 tabular-nums whitespace-nowrap">
                    {formatShortDate(order.createdAt)}
                  </td>
                  <td className="px-3 py-4 text-[9px] font-bold uppercase text-black/70 leading-relaxed max-w-[200px]">
                    {itemsSummary(order)}
                  </td>
                  <td className="px-3 py-4 text-[11px] font-bold tabular-nums text-right whitespace-nowrap">
                    {formatGhs(order.totalAmount)}
                  </td>
                  <td className="px-3 py-4">
                    <AdminStatusBadge status={payment} />
                  </td>
                  <td className="px-3 py-4">
                    <div className="space-y-2">
                      <AdminStatusBadge status={order.status} />
                      <select
                        value={order.status}
                        onChange={async (e) => {
                          const next = e.target.value;
                          if (next === order.status) return;
                          const ok = await confirmStatusChange(order, next);
                          if (ok) onStatusChange(order._id, next);
                        }}
                        className="w-full border border-black/20 bg-white px-2 py-2 min-h-[40px] text-[9px] font-bold uppercase tracking-wider text-black"
                        aria-label={`Update status for ${order.orderNumber}`}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryOrder(order)}
                      className="inline-flex items-center justify-center gap-1.5 border border-black/20 px-2 py-2 min-h-[40px] min-w-[120px] text-[8px] font-bold tracking-[0.12em] uppercase hover:border-black hover:bg-black/[0.03] transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      View delivery
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <AdminPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
          itemLabel="orders"
        />
      ) : null}

      <OrderDeliveryDetailsDialog
        order={deliveryOrder}
        onClose={() => setDeliveryOrder(null)}
      />
    </>
  );
};

export default AdminOrdersList;
