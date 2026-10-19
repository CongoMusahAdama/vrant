import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import type { ReactNode } from 'react';

/** All alerts auto-dismiss (ms) */
export const ALERT_DURATION = 4000;

type AlertVariant = 'success' | 'error' | 'info';

function AlertCard({
  title,
  description,
  variant,
}: {
  title: string;
  description?: string;
  variant: AlertVariant;
}) {
  const isSuccess = variant === 'success';
  const isError = variant === 'error';

  return (
    <div
      className="pointer-events-auto w-[min(100vw-2rem,380px)] border border-black bg-white shadow-lg animate-in slide-in-from-top-4 fade-in duration-300"
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center ${
            isSuccess ? 'bg-black text-white' : isError ? 'bg-red-600 text-white' : 'bg-black/10 text-black'
          }`}
        >
          {isSuccess ? (
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          ) : isError ? (
            <X className="h-3.5 w-3.5" strokeWidth={3} />
          ) : (
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-black">{title}</p>
          {description && (
            <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-black/50 mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function showAlert(variant: AlertVariant, title: string, description?: string) {
  toast.custom(() => <AlertCard title={title} description={description} variant={variant} />, {
    duration: ALERT_DURATION,
    position: 'top-center',
  });
}

export function sweetSuccess(title: string, description?: string) {
  showAlert('success', title, description);
}

/** Centered success alert — e.g. admin saves */
export function sweetSuccessCenter(title: string, description?: string) {
  toast.custom(
    () => (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
        <div className="absolute inset-0 bg-black/10 animate-in fade-in duration-300" aria-hidden />
        <div className="relative pointer-events-auto animate-in zoom-in-95 fade-in duration-300 shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
          <AlertCard title={title} description={description} variant="success" />
        </div>
      </div>
    ),
    { duration: ALERT_DURATION, position: 'top-center' }
  );
}

export function sweetError(title: string, description?: string) {
  showAlert('error', title, description);
}

export function sweetInfo(title: string, description?: string) {
  showAlert('info', title, description);
}

export function sweetAuthSuccess(mode: 'login' | 'register') {
  sweetSuccess(
    mode === 'login' ? 'Welcome back' : 'Account created',
    mode === 'login'
      ? 'You are signed in. Your wishlist and orders are ready.'
      : 'Welcome to VRANT. Start shopping and saving favourites.'
  );
}

export function sweetCustom(content: ReactNode, duration = ALERT_DURATION) {
  toast.custom(() => content, { duration, position: 'top-center' });
}
