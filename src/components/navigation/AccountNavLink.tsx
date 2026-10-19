import { Link } from 'react-router-dom';
import { User, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

type AccountNavLinkProps = {
  className?: string;
  textClass?: string;
};

/** Customers → /account · Admins → /admin */
const AccountNavLink = ({ className, textClass }: AccountNavLinkProps) => {
  const { isAdmin } = useAuth();
  const href = isAdmin ? '/admin' : '/account';
  const label = isAdmin ? 'Admin' : 'Account';

  return (
    <Link
      to={href}
      className={cn(
        'min-w-[44px] min-h-[44px] flex items-center justify-center hover:opacity-60 sm:min-w-0 sm:min-h-0',
        className
      )}
      aria-label={isAdmin ? 'Admin dashboard' : 'My account'}
    >
      {isAdmin ? (
        <Shield className="w-5 h-5 sm:hidden" strokeWidth={2} />
      ) : (
        <User className="w-5 h-5 sm:hidden" strokeWidth={2} />
      )}
      <span className={cn('hidden sm:inline text-[10px] font-bold tracking-[0.2em] uppercase', textClass)}>
        {label}
      </span>
    </Link>
  );
};

export default AccountNavLink;
