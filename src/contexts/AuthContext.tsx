import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import { apiFetch } from '@/lib/api';
import type { AuthUser } from '@/types/customer';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string, fallbackUser?: AuthUser) => Promise<AuthUser>;
  logout: () => void;
  updateUser: (userData: Partial<AuthUser>) => void;
  refreshUser: () => Promise<AuthUser | null>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserFromApi = useCallback(async (authToken: string) => {
    const data = await apiFetch<{ success: boolean; data: { user: AuthUser } }>(
      '/api/auth/me',
      { token: authToken }
    );
    const synced = {
      ...data.data.user,
      id: String(data.data.user.id),
      wishlist: data.data.user.wishlist ?? [],
    };
    setUser(synced);
    localStorage.setItem('vrant_user', JSON.stringify(synced));
    return synced;
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = token || localStorage.getItem('vrant_token');
    if (!storedToken) return null;
    return syncUserFromApi(storedToken);
  }, [token, syncUserFromApi]);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('vrant_token');

      if (storedToken) {
        try {
          setToken(storedToken);
          await syncUserFromApi(storedToken);
        } catch (error) {
          console.error('Token verification failed:', error);
          setToken(null);
          setUser(null);
          localStorage.removeItem('vrant_token');
          localStorage.removeItem('vrant_user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [syncUserFromApi]);

  const login = useCallback(
    async (newToken: string, fallbackUser?: AuthUser) => {
      setToken(newToken);
      localStorage.setItem('vrant_token', newToken);
      try {
        return await syncUserFromApi(newToken);
      } catch (error) {
        console.error('Failed to sync user after login:', error);
        if (fallbackUser) {
          const merged = {
            ...fallbackUser,
            id: String(fallbackUser.id),
            wishlist: fallbackUser.wishlist ?? [],
          };
          setUser(merged);
          localStorage.setItem('vrant_user', JSON.stringify(merged));
          return merged;
        }
        throw error;
      }
    },
    [syncUserFromApi]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vrant_token');
    localStorage.removeItem('vrant_user');
  }, []);

  const updateUser = useCallback((userData: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedUser = { ...prev, ...userData };
      localStorage.setItem('vrant_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      updateUser,
      refreshUser,
      isAuthenticated: !!token && !!user,
      isAdmin: user?.role === 'admin',
    }),
    [user, token, loading, login, logout, updateUser, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
