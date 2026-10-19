import { MessageCircle, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckoutOptionsProps {
  isAuthenticated: boolean;
  paystackEnabled?: boolean;
  onWhatsApp: () => void;
  onPaystack?: () => void;
  onSignIn?: () => void;
  whatsAppDisabled?: boolean;
  paystackDisabled?: boolean;
  paystackLoading?: boolean;
  whatsAppLabel?: string;
  className?: string;
}

const CheckoutOptions = ({
  isAuthenticated,
  paystackEnabled = false,
  onWhatsApp,
  onPaystack,
  onSignIn,
  whatsAppDisabled = false,
  paystackDisabled = false,
  paystackLoading = false,
  whatsAppLabel = 'Checkout on WhatsApp',
  className,
}: CheckoutOptionsProps) => {
  const showPaystack = isAuthenticated && paystackEnabled && onPaystack;

  return (
    <div className={cn('space-y-4', className)}>
      {isAuthenticated ? (
        <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-black/50 leading-[1.7]">
          {paystackEnabled
            ? "Choose how you'd like to pay — WhatsApp or secure card payment via Paystack."
            : 'Checkout on WhatsApp — card payment via Paystack will be enabled once keys are added.'}
        </p>
      ) : (
        <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-black/50 leading-[1.7]">
          Checkout on WhatsApp — no account needed. Sign in to unlock card payment with Paystack.
        </p>
      )}

      <button
        type="button"
        onClick={onWhatsApp}
        disabled={whatsAppDisabled}
        className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 min-h-[48px] text-[10px] font-bold tracking-[0.2em] uppercase hover:opacity-90 transition-opacity disabled:opacity-40 touch-manipulation"
      >
        <MessageCircle className="w-4 h-4" strokeWidth={2} />
        {whatsAppLabel}
      </button>

      {showPaystack && (
        <button
          type="button"
          onClick={onPaystack}
          disabled={paystackDisabled || paystackLoading}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 min-h-[48px] touch-manipulation',
            'text-[10px] font-bold tracking-[0.2em] uppercase transition-colors disabled:opacity-40',
            'bg-[#00C3F7] hover:bg-[#00A8D9] text-[#011B33]'
          )}
        >
          <CreditCard className="w-4 h-4" strokeWidth={2} />
          {paystackLoading ? 'Opening Paystack…' : 'Pay with Paystack'}
        </button>
      )}

      {!isAuthenticated && onSignIn && (
        <p className="text-[10px] font-bold text-black/60 leading-[1.7] text-center">
          Want card payment?{' '}
          <button
            type="button"
            onClick={onSignIn}
            className="underline underline-offset-2 hover:text-black uppercase tracking-[0.1em]"
          >
            Sign in
          </button>{' '}
          or{' '}
          <button
            type="button"
            onClick={onSignIn}
            className="underline underline-offset-2 hover:text-black uppercase tracking-[0.1em]"
          >
            create an account
          </button>
          .
        </p>
      )}
    </div>
  );
};

export default CheckoutOptions;
