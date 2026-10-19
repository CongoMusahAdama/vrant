import { formatGhs } from '@/admin/lib/format';
import type { AdminStats } from '@/admin/types/admin';
import { cn } from '@/lib/utils';

type AdminStatGridProps = {
  stats: AdminStats;
  loading?: boolean;
};

const ITEMS: {
  key: keyof AdminStats;
  label: string;
  format: (v: number) => string;
  card: string;
}[] = [
  {
    key: 'totalSales',
    label: 'Revenue',
    format: formatGhs,
    card: 'bg-[#e7ebe8] border-[#d0dbd4]',
  },
  {
    key: 'totalOrders',
    label: 'Orders',
    format: (v) => v.toLocaleString(),
    card: 'bg-[#ebe7e0] border-[#ddd5c8]',
  },
  {
    key: 'totalCustomers',
    label: 'Customers',
    format: (v) => v.toLocaleString(),
    card: 'bg-[#e6e8ed] border-[#cfd4dc]',
  },
  {
    key: 'totalProducts',
    label: 'Products',
    format: (v) => v.toLocaleString(),
    card: 'bg-[#ede9e5] border-[#ddd6ce]',
  },
];

const AdminStatGrid = ({ stats, loading }: AdminStatGridProps) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
    {ITEMS.map((item) => (
      <div
        key={item.key}
        className={cn('border p-3.5 sm:p-4 text-left min-h-[72px] flex flex-col justify-center', item.card)}
      >
        <p className="text-[8px] sm:text-[9px] font-bold tracking-[0.16em] uppercase text-black/50">
          {item.label}
        </p>
        <p className="text-base sm:text-xl font-bold tabular-nums mt-1 text-black/85">
          {loading ? '—' : item.format(stats[item.key])}
        </p>
      </div>
    ))}
  </div>
);

export default AdminStatGrid;
