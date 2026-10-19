import { useEffect, useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import AdminPageHeader from '../components/ui/AdminPageHeader';
import AdminPanel from '../components/ui/AdminPanel';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { formatGhs } from '../lib/format';

type AnalyticsData = {
  growth: {
    salesGrowth: number;
    orderGrowth: number;
    customerGrowth: number;
  };
  dailySales: { _id: string; revenue: number; orders: number }[];
  categoryPerformance: { _id: string; revenue: number; orders: number }[];
};

const formatPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

const Analytics = () => {
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<{ success: boolean; data: AnalyticsData }>(
          '/api/admin/analytics?period=30',
          { token }
        );
        if (!cancelled) setData(res.data);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const growth = data?.growth;

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Analytics"
        description="Last 30 days — growth vs previous period and top line items."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8">
        {[
          { label: 'Revenue', value: growth ? formatPct(growth.salesGrowth) : '—' },
          { label: 'Orders', value: growth ? formatPct(growth.orderGrowth) : '—' },
          { label: 'Customers', value: growth ? formatPct(growth.customerGrowth) : '—' },
        ].map((item) => (
          <div
            key={item.label}
            className="border border-black/10 bg-black/[0.02] p-4 text-center sm:text-left"
          >
            <p className="text-[8px] font-bold tracking-[0.18em] uppercase text-black/40">
              {item.label} growth
            </p>
            <p className="text-xl font-bold tabular-nums mt-1 text-black">
              {loading ? '—' : item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <AdminPanel title="Daily sales">
          {loading ? (
            <p className="text-[10px] font-bold uppercase text-black/40 animate-pulse">Loading…</p>
          ) : !data?.dailySales?.length ? (
            <p className="text-[10px] font-bold uppercase text-black/40">No sales in this period</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {data.dailySales.map((row) => (
                <li
                  key={row._id}
                  className="flex justify-between gap-2 text-[9px] font-bold uppercase"
                >
                  <span className="text-black/60">{row._id}</span>
                  <span className="text-black tabular-nums">
                    {formatGhs(row.revenue)} · {row.orders} orders
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel title="Top line items">
          {loading ? (
            <p className="text-[10px] font-bold uppercase text-black/40 animate-pulse">Loading…</p>
          ) : !data?.categoryPerformance?.length ? (
            <p className="text-[10px] font-bold uppercase text-black/40">No item data yet</p>
          ) : (
            <ul className="space-y-2">
              {data.categoryPerformance.map((row) => (
                <li
                  key={row._id}
                  className="flex justify-between gap-2 text-[9px] font-bold uppercase"
                >
                  <span className="text-black truncate">{row._id}</span>
                  <span className="text-black/50 shrink-0 tabular-nums">
                    {formatGhs(row.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>
    </AdminLayout>
  );
};

export default Analytics;
