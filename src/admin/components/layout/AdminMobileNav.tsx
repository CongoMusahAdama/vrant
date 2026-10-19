import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ADMIN_NAV, isAdminNavActive } from '@/admin/lib/nav';

const AdminMobileNav = () => {
  const location = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Admin quick navigation"
    >
      <div className="grid grid-cols-5 max-w-lg mx-auto">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          const active = isAdminNavActive(location.pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-h-[56px] px-1 py-2 transition-colors touch-manipulation',
                active ? 'text-black bg-black/[0.04]' : 'text-black/45 active:bg-black/[0.03]'
              )}
            >
              <Icon className={cn('w-[18px] h-[18px]', active && 'stroke-[2.5]')} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[7px] font-bold tracking-[0.08em] uppercase leading-none">
                {item.short}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default AdminMobileNav;
