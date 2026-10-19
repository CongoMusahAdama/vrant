import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ShopHeader from '@/components/navigation/ShopHeader';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { apiFetch } from '@/lib/api';
import { SHOP_HEADER_OFFSET_PT, PAGE_X } from '@/lib/page-layout';
import { sweetError, sweetSuccess } from '@/lib/sweet-alert';
import { cn } from '@/lib/utils';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const { token, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'auth'>('loading');

  const reference =
    searchParams.get('reference') || searchParams.get('trxref') || searchParams.get('ref');

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      return;
    }

    if (!isAuthenticated || !token) {
      setStatus('auth');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await apiFetch(`/api/payments/verify/${encodeURIComponent(reference)}`, { token });
        if (!cancelled) {
          setStatus('success');
          sweetSuccess('Payment received', 'Your order is confirmed.');
          window.dispatchEvent(new CustomEvent('vrant:order-paid'));
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('failed');
          const msg = err instanceof Error ? err.message : 'Could not verify payment';
          sweetError('Payment verification failed', msg);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reference, isAuthenticated, token]);

  return (
    <div className="min-h-screen bg-white">
      <ShopHeader cartCount={cartCount} />
      <main className={cn(SHOP_HEADER_OFFSET_PT, 'pb-16', PAGE_X)}>
        <div className="w-full max-w-md mx-auto py-16 text-center">
          {status === 'loading' && (
            <>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-black/40 animate-pulse">
                Verifying payment…
              </p>
              {reference ? (
                <p className="text-[9px] font-bold text-black/30 mt-3 tabular-nums break-all">
                  Ref: {reference}
                </p>
              ) : null}
            </>
          )}

          {status === 'success' && (
            <>
              <h1 className="text-sm font-bold tracking-[0.12em] uppercase text-black mb-3">
                Payment successful
              </h1>
              <p className="text-[10px] font-bold text-black/50 uppercase tracking-wider leading-relaxed mb-8">
                Thank you — your order is confirmed and will appear in your account.
              </p>
              <Link
                to="/account"
                className="inline-flex items-center justify-center bg-black text-white px-8 py-3 min-h-[48px] text-[10px] font-bold tracking-[0.2em] uppercase"
              >
                View my orders
              </Link>
            </>
          )}

          {status === 'failed' && (
            <>
              <h1 className="text-sm font-bold tracking-[0.12em] uppercase text-black mb-3">
                Payment not completed
              </h1>
              <p className="text-[10px] font-bold text-black/50 uppercase tracking-wider leading-relaxed mb-8">
                The payment was cancelled or could not be verified. You can try again or checkout on
                WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/cart"
                  className="inline-flex items-center justify-center border border-black px-6 py-3 min-h-[48px] text-[10px] font-bold tracking-[0.2em] uppercase"
                >
                  Back to cart
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center bg-black text-white px-6 py-3 min-h-[48px] text-[10px] font-bold tracking-[0.2em] uppercase"
                >
                  Continue shopping
                </Link>
              </div>
            </>
          )}

          {status === 'auth' && (
            <>
              <h1 className="text-sm font-bold tracking-[0.12em] uppercase text-black mb-3">
                Sign in to finish
              </h1>
              <p className="text-[10px] font-bold text-black/50 uppercase tracking-wider leading-relaxed mb-8">
                Sign in with the same account you used to pay, then we can confirm your order.
              </p>
              <Link
                to="/account"
                className="inline-flex items-center justify-center bg-black text-white px-8 py-3 min-h-[48px] text-[10px] font-bold tracking-[0.2em] uppercase"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentCallback;
