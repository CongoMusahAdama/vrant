import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Images, Users } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import AdminPageHeader from '../components/ui/AdminPageHeader';
import AdminStatGrid from '../components/ui/AdminStatGrid';
import AdminPanel from '../components/ui/AdminPanel';
import AdminRecentOrdersTable from '../components/dashboard/AdminRecentOrdersTable';
import AdminSalesChart from '../components/dashboard/AdminSalesChart';
import AdminOverviewTabs, { type OverviewTab } from '../components/dashboard/AdminOverviewTabs';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import type { AdminStats, DashboardPayload, AdminShopOrder, RevenueTrendPoint } from '../types/admin';
import { formatGhs } from '../lib/format';

const emptyStats: AdminStats = {
  totalSales: 0,
  totalOrders: 0,
  totalCustomers: 0,
  totalProducts: 0,
  recentSales: 0,
  lowStockProducts: 0,
  orderValueTotal: 0,
};

const QUICK = [
  {
    to: '/admin/orders',
    label: 'Track orders',
    hint: 'Update status & delivery',
    icon: ShoppingCart,
  },
  {
    to: '/admin/customers',
    label: 'Customers',
    hint: 'Contact or manage accounts',
    icon: Users,
  },
  {
    to: '/admin/products',
    label: 'Add products',
    hint: 'Upload photos, price & stock',
    icon: Package,
  },
  {
    to: '/admin/gallery',
    label: 'Gallery',
    hint: 'Publish lookbook photos',
    icon: Images,
  },
];

const Dashboard = () => {
  const { token } = useAuth();
  const [tab, setTab] = useState<OverviewTab>('orders');
  const [stats, setStats] = useState<AdminStats>(emptyStats);
  const [recentOrders, setRecentOrders] = useState<AdminShopOrder[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<{ success: boolean; data: DashboardPayload }>(
          '/api/admin/dashboard',
          { token }
        );
        if (!cancelled) {
          setStats(res.data.stats);
          setRecentOrders(res.data.recentOrders || []);
          setRevenueTrend(res.data.revenueTrend || []);
        }
      } catch {
        if (!cancelled) {
          setStats(emptyStats);
          setRecentOrders([]);
          setRevenueTrend([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AdminLayout orderCount={stats.totalOrders} productCount={stats.totalProducts}>
      <AdminPageHeader
        title="Store overview"
        description="System management — not your personal shopper account."
      />

      <AdminOverviewTabs active={tab} onChange={setTab} />

      {tab === 'sales' ? (
        <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="border border-[#d0dbd4] bg-[#e7ebe8] p-4">
              <p className="text-[8px] font-bold tracking-[0.18em] uppercase text-black/50">
                Order value (all)
              </p>
              <p className="text-xl font-bold tabular-nums mt-1 text-black/85">
                {loading ? '—' : formatGhs(stats.orderValueTotal || 0)}
              </p>
            </div>
            <div className="border border-[#ddd5c8] bg-[#ebe7e0] p-4">
              <p className="text-[8px] font-bold tracking-[0.18em] uppercase text-black/50">
                Paid revenue
              </p>
              <p className="text-xl font-bold tabular-nums mt-1 text-black/85">
                {loading ? '—' : formatGhs(stats.totalSales)}
              </p>
            </div>
            <div className="border border-[#cfd4dc] bg-[#e6e8ed] p-4">
              <p className="text-[8px] font-bold tracking-[0.18em] uppercase text-black/50">
                This month
              </p>
              <p className="text-xl font-bold tabular-nums mt-1 text-black/85">
                {loading ? '—' : formatGhs(stats.recentSales)}
              </p>
            </div>
          </div>

          <AdminPanel title="Revenue — last 30 days">
            <AdminSalesChart trend={revenueTrend} loading={loading} />
          </AdminPanel>
        </div>
      ) : (
        <div className="mt-6 sm:mt-8 space-y-6 sm:space-y-8">
          <AdminStatGrid stats={stats} loading={loading} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {QUICK.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="border border-black/10 p-4 min-h-[72px] sm:min-h-[88px] hover:border-black/30 active:bg-black/[0.02] transition-colors flex flex-row sm:flex-col items-center sm:items-start justify-between gap-3 touch-manipulation"
                >
                  <Icon className="w-5 h-5 sm:w-4 sm:h-4 text-black/50 shrink-0" strokeWidth={2} />
                  <div className="text-right sm:text-left min-w-0">
                    <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-black">
                      {item.label}
                    </p>
                    <p className="text-[9px] font-bold text-black/40 mt-0.5 sm:mt-1 uppercase hidden sm:block">
                      {item.hint}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          <AdminPanel
            title="Recent orders"
            action={
              <Link
                to="/admin/orders"
                className="text-[9px] font-bold tracking-[0.12em] uppercase text-black/50 hover:text-black"
              >
                View all →
              </Link>
            }
          >
            <AdminRecentOrdersTable orders={recentOrders} loading={loading} />
          </AdminPanel>
        </div>
      )}
    </AdminLayout>
  );
};

export default Dashboard;
