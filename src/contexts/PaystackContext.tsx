import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch } from '@/lib/api';

type PaystackContextValue = {
  enabled: boolean;
  publicKey: string | null;
  currency: string;
  loading: boolean;
  refresh: () => Promise<void>;
};

const PaystackContext = createContext<PaystackContextValue | null>(null);

export function PaystackProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [currency, setCurrency] = useState('GHS');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        data: { enabled: boolean; publicKey: string | null; currency: string };
      }>('/api/payments/config');
      setEnabled(Boolean(res.data.enabled));
      setPublicKey(res.data.publicKey);
      setCurrency(res.data.currency || 'GHS');
    } catch {
      setEnabled(false);
      setPublicKey(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ enabled, publicKey, currency, loading, refresh }),
    [enabled, publicKey, currency, loading, refresh]
  );

  return <PaystackContext.Provider value={value}>{children}</PaystackContext.Provider>;
}

export function usePaystack() {
  const ctx = useContext(PaystackContext);
  if (!ctx) {
    throw new Error('usePaystack must be used within PaystackProvider');
  }
  return ctx;
}
