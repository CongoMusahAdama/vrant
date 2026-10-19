import { Link } from 'react-router-dom';

import type { AdminShopOrder } from '@/admin/types/admin';

import AdminStatusBadge from '@/admin/components/ui/AdminStatusBadge';

import OrderProductImages from '@/admin/components/orders/OrderProductImages';

import AdminOrderCard from '@/admin/components/orders/AdminOrderCard';

import { customerLabel, itemsSummary, paymentStatus } from '@/admin/lib/orders';

import { formatGhs, formatShortDate } from '@/admin/lib/format';

import { cn } from '@/lib/utils';



type AdminRecentOrdersTableProps = {

  orders: AdminShopOrder[];

  loading?: boolean;

};



const AdminRecentOrdersTable = ({ orders, loading }: AdminRecentOrdersTableProps) => {

  if (loading) {

    return (

      <p className="text-[10px] font-bold uppercase text-black/40 animate-pulse py-4">Loading…</p>

    );

  }



  if (orders.length === 0) {

    return <p className="text-[10px] font-bold uppercase text-black/40 py-4">No orders yet</p>;

  }



  return (

    <>

      <div className="lg:hidden space-y-2.5 -mx-1">

        {orders.map((order) => (

          <AdminOrderCard key={order._id} order={order} variant="recent" />

        ))}

      </div>



      <div className="hidden lg:block -mx-4 sm:-mx-5 border-t border-black/10 overflow-x-auto">

        <table className="w-full min-w-[760px] text-left border-collapse">

          <thead>

            <tr className="bg-black text-white">

              <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase w-[88px]">

                Products

              </th>

              <th className="px-4 sm:px-5 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">

                Order

              </th>

              <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Customer</th>

              <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Date</th>

              <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase min-w-[140px]">

                Items

              </th>

              <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Status</th>

              <th className="px-3 py-3 text-[9px] font-bold tracking-[0.18em] uppercase">Payment</th>

              <th className="px-4 sm:px-5 py-3 text-[9px] font-bold tracking-[0.18em] uppercase text-right">

                Total

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

                    <OrderProductImages order={order} size="sm" />

                  </td>

                  <td className="px-4 sm:px-5 py-3">

                    <Link

                      to="/admin/orders"

                      className="text-[10px] font-bold tracking-[0.1em] uppercase text-black hover:underline"

                    >

                      {order.orderNumber}

                    </Link>

                    <p className="text-[8px] font-bold uppercase text-black/40 mt-0.5">

                      {order.channel === 'paystack' ? 'Paystack' : 'WhatsApp'}

                    </p>

                  </td>

                  <td className="px-3 py-3">

                    <p className="text-[10px] font-bold text-black truncate max-w-[140px]">

                      {customer.name}

                    </p>

                    {customer.phone ? (

                      <p className="text-[8px] font-bold text-black/45 mt-0.5 tabular-nums">

                        {customer.phone}

                      </p>

                    ) : null}

                  </td>

                  <td className="px-3 py-3 text-[10px] font-bold text-black/70 tabular-nums whitespace-nowrap">

                    {formatShortDate(order.createdAt)}

                  </td>

                  <td className="px-3 py-3 text-[9px] font-bold uppercase text-black/70 leading-relaxed max-w-[180px]">

                    {itemsSummary(order)}

                  </td>

                  <td className="px-3 py-3">

                    <AdminStatusBadge status={order.status} />

                  </td>

                  <td className="px-3 py-3">

                    <AdminStatusBadge status={payment} />

                  </td>

                  <td className="px-4 sm:px-5 py-3 text-[11px] font-bold tabular-nums text-right whitespace-nowrap">

                    {formatGhs(order.totalAmount)}

                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

      </div>

    </>

  );

};



export default AdminRecentOrdersTable;

