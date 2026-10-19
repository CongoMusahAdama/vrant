import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LogOut, ExternalLink } from 'lucide-react';
import { ADMIN_NAV, isAdminNavActive } from '@/admin/lib/nav';

function getInitials(name?: string) {
  if (!name?.trim()) return 'AD';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type AdminSidebarProps = {
  userName?: string;
  userEmail?: string;
  orderCount?: number;
  productCount?: number;
  onSignOut: () => void;
};

const AdminSidebar = ({
  userName,
  userEmail,
  orderCount = 0,
  productCount = 0,
  onSignOut,
}: AdminSidebarProps) => {
  const location = useLocation();

  return (
    <aside className="w-full lg:w-64 xl:w-72 shrink-0">
      <div className="lg:sticky lg:top-[12rem] flex flex-col">
        {/* Mobile: compact admin strip */}
        <div className="lg:hidden mb-3 p-3 border border-black/10 border-l-2 border-l-black bg-black/[0.02]">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-black bg-black text-[9px] font-bold text-white"
              aria-hidden
            >
              {getInitials(userName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-bold tracking-[0.2em] uppercase text-black/50">Admin</p>
              <p className="text-[10px] font-bold uppercase text-black truncate">
                {userName || 'Administrator'}
              </p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="shrink-0 inline-flex items-center justify-center min-h-[40px] min-w-[40px] text-red-600"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
          <div className="flex gap-2 mt-2.5">
            <span className="flex-1 text-center py-2 border border-black/10 bg-white text-[9px] font-bold uppercase">
              <span className="tabular-nums text-black">{orderCount}</span>
              <span className="text-black/40 ml-1">orders</span>
            </span>
            <span className="flex-1 text-center py-2 border border-black/10 bg-white text-[9px] font-bold uppercase">
              <span className="tabular-nums text-black">{productCount}</span>
              <span className="text-black/40 ml-1">products</span>
            </span>
          </div>
        </div>

        {/* Desktop: full profile card */}
        <div className="hidden lg:block mb-6 xl:mb-8 p-4 sm:p-5 border border-black/10 border-t-2 border-t-black bg-black/[0.03]">
          <div className="flex items-start gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-black bg-black text-[10px] font-bold tracking-[0.06em] text-white"
              aria-hidden
            >
              {getInitials(userName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-black">
                Admin panel
              </p>
              <p className="text-[12px] font-bold tracking-[0.06em] uppercase text-black leading-snug mt-1 line-clamp-2">
                {userName || 'Administrator'}
              </p>
              <p className="text-[9px] font-bold text-black/45 mt-0.5 break-all line-clamp-2">
                {userEmail}
              </p>
              <p className="text-[8px] font-bold tracking-[0.1em] uppercase text-black/35 mt-2 leading-relaxed">
                Orders, receipts, catalog & gallery
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-black/10">
            <div className="text-center py-1">
              <p className="text-lg font-bold tabular-nums">{orderCount}</p>
              <p className="text-[8px] font-bold tracking-[0.15em] uppercase text-black/40 mt-0.5">
                Store orders
              </p>
            </div>
            <div className="text-center py-1 border-l border-black/10">
              <p className="text-lg font-bold tabular-nums">{productCount}</p>
              <p className="text-[8px] font-bold tracking-[0.15em] uppercase text-black/40 mt-0.5">
                In catalog
              </p>
            </div>
          </div>
        </div>

        {/* Desktop nav only — mobile uses bottom bar */}
        <nav
          className="hidden lg:flex lg:flex-col lg:gap-2"
          aria-label="Admin sections"
        >
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = isAdminNavActive(location.pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex flex-row items-center gap-3 px-4 min-h-[48px]',
                  'text-[10px] font-bold tracking-[0.18em] uppercase transition-colors border',
                  active
                    ? 'bg-black text-white border-black'
                    : 'text-black/55 hover:text-black border-black/10 hover:border-black/30 bg-white'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block mt-6">
          <Link
            to="/products"
            className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-black/40 hover:text-black transition-colors min-h-[48px]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View storefront
          </Link>
        </div>

        <div className="hidden lg:block mt-8 pt-6 border-t border-black/10">
          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center gap-2 min-h-[48px] text-[10px] font-bold tracking-[0.18em] uppercase text-red-600 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
