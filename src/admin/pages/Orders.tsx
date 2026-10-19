import { useCallback, useEffect, useRef, useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import AdminPageHeader from '../components/ui/AdminPageHeader';
import AdminOrdersList from '../components/orders/AdminOrdersList';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import type { AdminShopOrder } from '../types/admin';
import { cn } from '@/lib/utils';
import {
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
} from '@/lib/order-status';
import { sweetInfo, sweetSuccessCenter } from '@/lib/sweet-alert';
import { useOrderPolling } from '@/hooks/useOrderPolling';

const PAGE_SIZE = 10;
const ORDERS_POLL_MS = 20_000;
const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

const Orders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<AdminShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const ordersSnapshotRef = useRef<Map<string, { status: string; paymentStatus?: string }>>(
    new Map()
  );
  const ordersBootstrappedRef = useRef(false);
  const knownTotalRef = useRef(0);

  const loadOrders = useCallback(
    async (options?: { notify?: boolean; silent?: boolean }) => {
      if (!token) return;
      if (!options?.silent) setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        if (status !== 'all') params.set('status', status);
        if (search.trim()) params.set('search', search.trim());

        const res = await apiFetch<{
          success: boolean;
          data: {
            orders: AdminShopOrder[];
            pagination: { page: number; total: number; totalPages: number };
          };
        }>(`/api/shop-orders?${params}`, { token });

        const nextOrders = res.data.orders;
        const nextTotal = res.data.pagination.total;

        if (!ordersBootstrappedRef.current) {
          nextOrders.forEach((order) => {
            ordersSnapshotRef.current.set(order._id, {
              status: order.status,
              paymentStatus: order.paymentStatus,
            });
          });
          knownTotalRef.current = nextTotal;
          ordersBootstrappedRef.current = true;
        } else if (options?.notify) {
          if (nextTotal > knownTotalRef.current) {
            const added = nextTotal - knownTotalRef.current;
            sweetInfo(
              'New order received',
              `${added} new order${added > 1 ? 's' : ''} — refresh the list or check page 1.`
            );
          }

          nextOrders.forEach((order) => {
            const prev = ordersSnapshotRef.current.get(order._id);
            if (prev) {
              if (prev.status !== order.status) {
                sweetInfo(
                  'Order status changed',
                  `${order.orderNumber} is now ${ORDER_STATUS_LABEL[order.status] || order.status}.`
                );
              }
              if (
                order.paymentStatus &&
                prev.paymentStatus &&
                prev.paymentStatus !== order.paymentStatus
              ) {
                sweetInfo(
                  'Payment updated',
                  `${order.orderNumber}: ${PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus}.`
                );
              }
            } else {
              sweetInfo(
                'New order on this page',
                `${order.orderNumber} — ${ORDER_STATUS_LABEL[order.status] || order.status}.`
              );
            }
            ordersSnapshotRef.current.set(order._id, {
              status: order.status,
              paymentStatus: order.paymentStatus,
            });
          });

          knownTotalRef.current = nextTotal;
        } else {
          nextOrders.forEach((order) => {
            ordersSnapshotRef.current.set(order._id, {
              status: order.status,
              paymentStatus: order.paymentStatus,
            });
          });
          knownTotalRef.current = nextTotal;
        }

        setOrders(nextOrders);
        setTotal(nextTotal);
        setTotalPages(res.data.pagination.totalPages);
      } catch {
        setOrders([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [token, page, status, search]
  );

  useEffect(() => {
    ordersBootstrappedRef.current = false;
    ordersSnapshotRef.current.clear();
    knownTotalRef.current = 0;
  }, [token]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const pollOrders = useCallback(
    (options: { notify: boolean; silent: boolean }) => loadOrders(options),
    [loadOrders]
  );

  useOrderPolling({
    enabled: Boolean(token),
    intervalMs: ORDERS_POLL_MS,
    token,
    onPoll: pollOrders,
  });

  useEffect(() => {
    setPage(1);
  }, [status, search]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!token) return;
    const order = orders.find((o) => o._id === orderId);
    try {
      await apiFetch(`/api/shop-orders/${orderId}/status`, {
        method: 'PUT',
        token,
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
      ordersSnapshotRef.current.set(orderId, {
        status: newStatus,
        paymentStatus: order?.paymentStatus,
      });
      sweetSuccessCenter(
        'Order status updated',
        order
          ? `${order.orderNumber} is now ${ORDER_STATUS_LABEL[newStatus] || newStatus}. The customer will see this on their account.`
          : `Status set to ${ORDER_STATUS_LABEL[newStatus] || newStatus}.`
      );
    } catch {
      /* keep UI unchanged on error */
    }
  };

  return (
    <AdminLayout orderCount={total}>
      <AdminPageHeader
        title="Manage orders"
        description="All customer orders site-wide. Paystack orders show Paid when payment succeeds. For WhatsApp orders, set status to Confirmed after you verify payment. Customers receive email & SMS on every status change."
      />

      <div className="mb-4 space-y-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order #, name, phone…"
          className="w-full border border-black/20 bg-white px-4 py-3 min-h-[48px] text-[10px] font-bold uppercase tracking-wider placeholder:text-black/30"
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                'px-3 py-2 min-h-[40px] text-[9px] font-bold tracking-[0.12em] uppercase border transition-colors',
                status === s
                  ? 'bg-black text-white border-black'
                  : 'text-black/50 border-black/15 hover:border-black/30'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <AdminOrdersList
        orders={orders}
        loading={loading}
        onStatusChange={handleStatusChange}
        pagination={{
          page,
          totalPages,
          total,
          pageSize: PAGE_SIZE,
          onPageChange: setPage,
        }}
      />
    </AdminLayout>
  );
};

export default Orders;
