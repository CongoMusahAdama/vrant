import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import DeliveryDetailsForm from './DeliveryDetailsForm';
import type { DeliveryDetails } from '@/types/customer';
import { getDeliveryFromUser } from '@/lib/delivery';
import { useAuth } from '@/contexts/AuthContext';

interface DeliveryDetailsModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (delivery: DeliveryDetails) => void | Promise<void>;
  title?: string;
  subtitle?: string;
  saving?: boolean;
  submitLabel?: string;
}

const DeliveryDetailsModal = ({
  open,
  onClose,
  onSave,
  title = 'Delivery details',
  subtitle = 'Add your delivery info so we can prefill WhatsApp checkout and track your order.',
  saving = false,
  submitLabel = 'Continue to WhatsApp',
}: DeliveryDetailsModalProps) => {
  const { user } = useAuth();
  const [session, setSession] = useState(0);

  useEffect(() => {
    if (open) setSession((s) => s + 1);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const initialDelivery = useMemo(() => getDeliveryFromUser(user), [session, user]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delivery-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden />
      <div
        className="relative z-10 w-full sm:max-w-md bg-white border border-black max-h-[min(90dvh,100%)] overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black bg-white px-4 py-4">
          <div>
            <h2 id="delivery-modal-title" className="text-[11px] font-bold tracking-[0.2em] uppercase">
              {title}
            </h2>
            <p className="text-[10px] font-bold text-black/50 mt-1 leading-relaxed max-w-xs">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 min-h-[44px] min-w-[44px]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 sm:p-6 pb-32 sm:pb-6">
          <DeliveryDetailsForm
            key={session}
            initial={initialDelivery}
            onSubmit={onSave}
            submitLabel={submitLabel}
            loading={saving}
          />
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetailsModal;
