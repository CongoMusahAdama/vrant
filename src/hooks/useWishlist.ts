import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

export function useWishlist() {
  const { user, token, updateUser, isAuthenticated, loading } = useAuth();
  const wishlist = user?.wishlist ?? [];

  const isInWishlist = useCallback(
    (productId: number) => wishlist.includes(productId),
    [wishlist]
  );

  const toggleWishlist = useCallback(
    async (productId: number) => {
      if (!token) throw new Error('Sign in required');
      const res = await apiFetch<{
        success: boolean;
        data: { wishlist: number[]; added: boolean };
      }>(`/api/auth/wishlist/${productId}`, {
        method: 'POST',
        token,
      });
      updateUser({ wishlist: res.data.wishlist });
      return res.data.added;
    },
    [token, updateUser]
  );

  return {
    wishlist,
    isInWishlist,
    toggleWishlist,
    isAuthenticated,
    hasToken: !!token,
    authLoading: loading,
  };
}
