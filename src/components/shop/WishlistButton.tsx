import { useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/hooks/useWishlist';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { sweetSuccess, sweetError } from '@/lib/sweet-alert';

interface WishlistButtonProps {
  productId: number;
  className?: string;
  size?: 'sm' | 'md';
}

const WishlistButton = ({ productId, className, size = 'md' }: WishlistButtonProps) => {
  const { login } = useAuth();
  const { isInWishlist, toggleWishlist, hasToken, authLoading } = useWishlist();
  const [authOpen, setAuthOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<number | null>(null);
  const active = isInWishlist(productId);

  const runToggle = async (id: number) => {
    setBusy(true);
    try {
      const added = await toggleWishlist(id);
      sweetSuccess(
        added ? 'Added to wishlist' : 'Removed from wishlist',
        added ? 'Saved to your account' : 'Removed from your account'
      );
    } catch (err) {
      sweetError('Wishlist update failed', err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (authLoading) return;

    if (hasToken) {
      await runToggle(productId);
      return;
    }

    setPendingProductId(productId);
    setAuthOpen(true);
  };

  const handleAuthSuccess = async (newToken: string, userData: Parameters<typeof login>[1]) => {
    try {
      await login(newToken, userData);
      setAuthOpen(false);
      const id = pendingProductId;
      setPendingProductId(null);
      if (id != null) {
        await runToggle(id);
      }
    } catch {
      sweetError('Could not sync account', 'Please try again.');
    }
  };

  const iconSize = size === 'sm' ? 'w-[15px] h-[15px]' : 'w-[17px] h-[17px]';
  const btnSize = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || authLoading}
        aria-label={active ? 'Remove from wishlist' : 'Save to wishlist'}
        aria-pressed={active}
        className={cn(
          btnSize,
          'inline-flex items-center justify-center rounded-full',
          'bg-white/90 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
          'text-black/45 hover:text-black active:scale-95',
          'transition-all duration-200 disabled:opacity-50',
          active && 'text-black',
          className
        )}
      >
        <Heart
          className={cn(iconSize, 'transition-all duration-200', active && 'fill-current')}
          strokeWidth={1.5}
        />
      </button>

      <AuthModal
        isOpen={authOpen}
        onClose={() => {
          setAuthOpen(false);
          setPendingProductId(null);
        }}
        onSuccess={handleAuthSuccess}
        initialMode="register"
        stayOnPage
      />
    </>
  );
};

export default WishlistButton;
