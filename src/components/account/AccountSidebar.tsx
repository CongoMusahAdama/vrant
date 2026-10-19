import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LogOut, Package, Heart, MapPin, User } from 'lucide-react';

export type AccountSection = 'orders' | 'wishlist' | 'delivery' | 'profile';

const NAV_ITEMS: { key: AccountSection; label: string; shortLabel: string; icon: typeof Package }[] = [
  { key: 'orders', label: 'Orders', shortLabel: 'Orders', icon: Package },
  { key: 'wishlist', label: 'Wishlist', shortLabel: 'Saved', icon: Heart },
  { key: 'delivery', label: 'Delivery details', shortLabel: 'Delivery', icon: MapPin },
  { key: 'profile', label: 'Profile', shortLabel: 'Profile', icon: User },
];

function getInitials(name?: string) {
  if (!name?.trim()) return '·';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type AccountSidebarProps = {
  active: AccountSection;
  onSelect: (section: AccountSection) => void;
  isAuthenticated: boolean;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  orderCount?: number;
  wishlistCount?: number;
  onSignIn: () => void;
  onSignOut: () => void;
};

const AccountSidebar = ({
  active,
  onSelect,
  isAuthenticated,
  userName,
  userEmail,
  userPhone,
  orderCount = 0,
  wishlistCount = 0,
  onSignIn,
  onSignOut,
}: AccountSidebarProps) => (
  <aside className="w-full lg:w-64 xl:w-72 shrink-0">
      <div className="lg:sticky lg:top-[12rem] flex flex-col">
      <div className="mb-4 sm:mb-6 lg:mb-8 p-4 sm:p-5 border border-black/10 bg-black/[0.02]">
        <div className="flex items-start gap-3">
          {isAuthenticated && (
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-black bg-black text-[10px] font-bold tracking-[0.06em] text-white"
              aria-hidden
            >
              {getInitials(userName)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-black/40">
                My account
              </p>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="shrink-0 inline-flex items-center gap-1 text-[8px] font-bold tracking-[0.12em] uppercase text-red-600 hover:text-red-700 min-h-[32px] px-1 -mr-1"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
                  <span className="hidden min-[380px]:inline">Sign out</span>
                </button>
              )}
            </div>
            {isAuthenticated ? (
              <>
                <p className="text-[11px] sm:text-[12px] font-bold tracking-[0.06em] uppercase text-black leading-snug mt-1 line-clamp-2">
                  {userName}
                </p>
                <p className="text-[9px] font-bold text-black/45 mt-0.5 break-all line-clamp-2">
                  {userEmail}
                </p>
                {userPhone ? (
                  <p className="text-[9px] font-bold text-black/35 mt-0.5 tabular-nums">
                    {userPhone}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-black mt-1">
                Guest
              </p>
            )}
          </div>
        </div>

        {isAuthenticated && (
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-black/10">
            <div className="text-center py-1">
              <p className="text-xl sm:text-lg font-bold tabular-nums">{orderCount}</p>
              <p className="text-[8px] font-bold tracking-[0.15em] uppercase text-black/40 mt-0.5">
                Orders
              </p>
            </div>
            <div className="text-center py-1 border-l border-black/10">
              <p className="text-xl sm:text-lg font-bold tabular-nums">{wishlistCount}</p>
              <p className="text-[8px] font-bold tracking-[0.15em] uppercase text-black/40 mt-0.5">
                Saved
              </p>
            </div>
          </div>
        )}
      </div>

      <nav
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:flex lg:flex-col lg:gap-2"
        aria-label="Account sections"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={cn(
                'flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1.5 lg:gap-3',
                'text-center lg:text-left px-2 py-3.5 lg:px-4 min-h-[64px] lg:min-h-[48px]',
                'text-[9px] lg:text-[10px] font-bold tracking-[0.14em] lg:tracking-[0.18em] uppercase transition-colors border',
                isActive
                  ? 'bg-black text-white border-black'
                  : 'text-black/55 hover:text-black border-black/10 hover:border-black/30 bg-white active:bg-black/[0.03]'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
              <span className="lg:hidden leading-tight">{item.shortLabel}</span>
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-4 lg:mt-6">
        <Link
          to="/products"
          className="flex items-center justify-center lg:justify-start w-full text-[10px] font-bold tracking-[0.2em] uppercase text-black/40 hover:text-black transition-colors min-h-[44px] lg:min-h-[48px]"
        >
          Continue shopping →
        </Link>
      </div>

      {/* Desktop only: secondary sign out at sidebar foot */}
      {isAuthenticated && (
        <div className="hidden lg:block mt-8 pt-6 border-t border-black/10">
          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center justify-start gap-2 min-h-[48px] text-[10px] font-bold tracking-[0.18em] uppercase text-red-600 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            Sign out
          </button>
        </div>
      )}

      {!isAuthenticated && (
        <div className="mt-4 lg:mt-8">
          <button
            type="button"
            onClick={onSignIn}
            className="w-full bg-black text-white py-3.5 min-h-[48px] text-[10px] font-bold tracking-[0.2em] uppercase hover:opacity-90"
          >
            Sign in
          </button>
        </div>
      )}
    </div>
  </aside>
);

export default AccountSidebar;
