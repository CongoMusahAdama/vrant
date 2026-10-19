import { useEffect } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { ALERT_DURATION } from '@/lib/sweet-alert';

/** Added-to-cart toast auto-closes after this (ms) */
export const CART_TOAST_DURATION = 3500;

type AddedToCartPayload = {
  name: string;
  size: string;
  price: string;
  image?: string;
  onViewCart?: () => void;
};

function AddedToCartToastContent({
  toastId,
  name,
  size,
  price,
  image,
  onViewCart,
}: AddedToCartPayload & { toastId: string | number }) {
  useEffect(() => {
    const timer = window.setTimeout(() => toast.dismiss(toastId), CART_TOAST_DURATION);
    return () => window.clearTimeout(timer);
  }, [toastId]);

  return (
    <div
      className="pointer-events-auto w-[min(100vw-2rem,360px)] border border-black bg-white shadow-lg animate-in slide-in-from-top-4 fade-in duration-300"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-stretch gap-0">
        {image && (
          <div className="w-16 sm:w-20 shrink-0 bg-[#f5f5f5] border-r border-black/10 flex items-center justify-center p-2">
            <img src={image} alt="" className="max-h-14 max-w-full object-contain" />
          </div>
        )}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-black text-white">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-black">
                Added to cart
              </p>
              <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-black/50 mt-0.5 truncate">
                {name}
              </p>
            </div>
          </div>
          <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-black/40">
            Size {size} · {price}
          </p>
          {onViewCart && (
            <button
              type="button"
              onClick={() => {
                onViewCart();
                toast.dismiss(toastId);
              }}
              className="mt-3 w-full bg-black text-white py-2.5 text-[9px] font-bold tracking-[0.18em] uppercase"
            >
              View cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function showAddedToCartToast(payload: AddedToCartPayload) {
  toast.custom(
    (id) => <AddedToCartToastContent toastId={id} {...payload} />,
    {
      duration: CART_TOAST_DURATION,
      position: 'top-center',
    }
  );
}

/** Dark add-to-cart button — no hover color swap */
export const ADD_TO_CART_BTN =
  'w-full bg-black text-white py-4 min-h-[52px] text-[10px] font-bold tracking-[0.2em] uppercase disabled:opacity-40 disabled:cursor-not-allowed transition-opacity active:opacity-90';

export const ADD_TO_CART_BTN_COMPACT =
  'shrink-0 min-w-[120px] bg-black text-white px-4 py-3 min-h-[48px] text-[10px] font-bold tracking-[0.15em] uppercase disabled:opacity-40 disabled:cursor-not-allowed active:opacity-90';
