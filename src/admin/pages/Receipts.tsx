import { useCallback, useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import AdminPageHeader from '../components/ui/AdminPageHeader';
import OrderReceipt from '../components/orders/OrderReceipt';
import AdminOrderCard from '../components/orders/AdminOrderCard';
import AdminPagination from '../components/ui/AdminPagination';
import OrderProductImages from '../components/orders/OrderProductImages';
import AdminStatusBadge from '../components/ui/AdminStatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import type { AdminShopOrder } from '../types/admin';
import { customerLabel, paymentStatus } from '../lib/orders';
import { formatGhs, formatShortDate } from '../lib/format';
import { ADMIN_BTN_OUTLINE } from '../lib/apiForm';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

const Receipts = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<AdminShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [receiptOrder, setReceiptOrder] = useState<AdminShopOrder | null>(null);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search.trim()) params.set('search', search.trim());

      const res = await apiFetch<{
        success: boolean;
        data: {
          orders: AdminShopOrder[];
          pagination: { page: number; total: number; totalPages: number };
        };
      }>(`/api/shop-orders?${params}`, { token });

      setOrders(res.data.orders);
      setTotal(res.data.pagination.total);
      setTotalPages(res.data.pagination.totalPages);
    } catch {
      setOrders([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [token, page, search]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <AdminLayout orderCount={total}>
      <AdminPageHeader
        title="Order receipts"
        description="Generate and print receipts for customer orders — separate from order management."
      />

      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order #, name, phone…"
          className="w-full border border-black/20 bg-white px-4 py-3 min-h-[48px] text-[10px] font-bold uppercase tracking-wider placeholder:text-black/30"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center border border-black/10">
          <p className="text-[10px] font-bold uppercase text-black/40 animate-pulse">Loading…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="border border-dashed border-black/20 p-8 sm:p-12 text-center">
          <p className="text-[11px] font-bold uppercase text-black/50">No orders to receipt</p>
          <p className="text-[10px] font-bold text-black/40 mt-2 uppercase tracking-wider">
            Orders will appear here once customers checkout
          </p>
        </div>
      ) : (
        <>
          <div className="lg:hidden space-y-2.5">
            {orders.map((order) => (
              <AdminOrderCard
                key={order._id}
                order={order}
                variant="receipt"
                onReceipt={setReceiptOrder}
              />
            ))}
          </div>

          <div className="hidden lg:block border border-black/10 overflow-x-auto bg-white">
            <table className="w-full min-w-[720px] text-left border-collapse">
              <thead>
                <tr className="bg-black text-white">
                  <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase w-[88px]">
                    Products
                  </th>
                  <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Order</th>
                  <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Customer</th>
                  <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Date</th>
                  <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Status</th>
                  <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase text-right">
                    Total
                  </th>
                  <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase min-w-[140px]">
                    Receipt
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
                        'border-t border-black/10 align-middle',
                        index % 2 === 1 && 'bg-black/[0.02]'
                      )}
                    >
                      <td className="px-3 py-3">
                        <OrderProductImages order={order} size="sm" />
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
                      <td className="px-3 py-4">
                        <div className="flex flex-col gap-1">
                          <AdminStatusBadge status={order.status} />
                          <AdminStatusBadge status={payment} />
                        </div>
                      </td>
                      <td className="px-3 py-4 text-[11px] font-bold tabular-nums text-right whitespace-nowrap">
                        {formatGhs(order.totalAmount)}
                      </td>
                      <td className="px-3 py-4">
                        <button
                          type="button"
                          onClick={() => setReceiptOrder(order)}
                          className={`${ADMIN_BTN_OUTLINE} gap-1.5 min-h-[40px] text-[8px] w-full`}
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          Generate receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <AdminPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="receipts"
          />
        </>
      )}

      {receiptOrder && (
        <OrderReceipt order={receiptOrder} onClose={() => setReceiptOrder(null)} />
      )}
    </AdminLayout>
  );
};

export default Receipts;
