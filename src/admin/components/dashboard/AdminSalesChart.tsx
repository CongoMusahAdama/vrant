import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RevenueTrendPoint } from '@/admin/types/admin';
import { fillRevenueTrend } from '@/admin/lib/salesChart';
import { formatGhs } from '@/admin/lib/format';

type AdminSalesChartProps = {
  trend: RevenueTrendPoint[];
  loading?: boolean;
};

const AdminSalesChart = ({ trend, loading }: AdminSalesChartProps) => {
  const data = fillRevenueTrend(trend);
  const hasSales = data.some((d) => d.revenue > 0);

  if (loading) {
    return (
      <p className="text-[10px] font-bold uppercase text-black/40 animate-pulse py-16 text-center">
        Loading chart…
      </p>
    );
  }

  if (!hasSales) {
    return (
      <p className="text-[10px] font-bold uppercase text-black/40 py-16 text-center">
        No revenue in the last 30 days yet
      </p>
    );
  }

  return (
    <div className="h-56 sm:h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: 'rgba(0,0,0,0.45)', fontWeight: 700 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(0,0,0,0.12)' }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 9, fill: 'rgba(0,0,0,0.45)', fontWeight: 700 }}
            tickLine={false}
            axisLine={false}
            width={42}
            tickFormatter={(v) => (v >= 1000 ? `₵${Math.round(v / 1000)}k` : `₵${v}`)}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as (typeof data)[number];
              return (
                <div className="border border-black/15 bg-white px-3 py-2 shadow-sm">
                  <p className="text-[9px] font-bold uppercase text-black/50">{row.label}</p>
                  <p className="text-[11px] font-bold tabular-nums text-black mt-1">
                    {formatGhs(row.revenue)}
                  </p>
                  <p className="text-[8px] font-bold uppercase text-black/40 mt-0.5">
                    {row.orders} order{row.orders === 1 ? '' : 's'}
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="revenue" fill="#4a5f52" radius={[2, 2, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AdminSalesChart;
