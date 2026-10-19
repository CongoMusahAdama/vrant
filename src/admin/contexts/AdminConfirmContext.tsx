import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import AdminConfirmDialog, {
  type AdminConfirmOptions,
} from '@/admin/components/ui/AdminConfirmDialog';

type ConfirmRequest = AdminConfirmOptions & {
  resolve: (confirmed: boolean) => void;
};

type AdminConfirmContextValue = {
  confirm: (options: AdminConfirmOptions) => Promise<boolean>;
};

const AdminConfirmContext = createContext<AdminConfirmContextValue | null>(null);

export function AdminConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const confirm = useCallback((options: AdminConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setRequest({ ...options, resolve });
    });
  }, []);

  const close = (confirmed: boolean) => {
    request?.resolve(confirmed);
    setRequest(null);
  };

  return (
    <AdminConfirmContext.Provider value={{ confirm }}>
      {children}
      {request ? (
        <AdminConfirmDialog
          open
          options={request}
          onConfirm={() => close(true)}
          onCancel={() => close(false)}
        />
      ) : null}
    </AdminConfirmContext.Provider>
  );
}

export function useAdminConfirm() {
  const ctx = useContext(AdminConfirmContext);
  if (!ctx) {
    throw new Error('useAdminConfirm must be used within AdminConfirmProvider');
  }
  return ctx;
}
