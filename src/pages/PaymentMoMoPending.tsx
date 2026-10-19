import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ShopHeader from '@/components/navigation/ShopHeader';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { API_BASE } from '@/lib/api';
import { SHOP_HEADER_OFFSET_PT, PAGE_X } from '@/lib/page-layout';
import { sweetError, sweetSuccess } from '@/lib/sweet-alert';
import { cn } from '@/lib/utils';

export const MOMO_PAYMENT_SESSION_KEY = 'vrant_momo_payment';

type MoMoPaymentSession = {
  reference: string;
  displayText?: string;
  phone?: string;
  providerLabel?: string;
};

const POLL_MS = 4000;
const MAX_POLLS = 45;

const PaymentMoMoPending = () => {
  const { token, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const [session, setSession] = useState<MoMoPaymentSession | null>(null);
  const [status, setStatus] = useState<'waiting' | 'success' | 'failed' | 'auth'>('waiting');
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(MOMO_PAYMENT_SESSION_KEY);
      if (!raw) {
        setStatus('failed');
        return;
      }
      setSession(JSON.parse(raw) as MoMoPaymentSession);
    } catch {
      setStatus('failed');
    }
  }, []);

  useEffect(() => {
    if (!session?.reference) return;
    if (!isAuthenticated || !token) {
      setStatus('auth');
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      if (cancelled || attempts >= MAX_POLLS) {
        if (!cancelled && attempts >= MAX_POLLS) {
          setStatus('failed');
          sweetError(
            'Payment timed out',
            'No approval received within 3 minutes. Try again or use WhatsApp checkout.'
          );
        }
        return;
      }

      attempts += 1;
      setPollCount(attempts);

      try {
        const res = await fetch(
          `${API_BASE}/api/payments/verify/${encodeURIComponent(session.reference)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          }
        );
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success) {
          sessionStorage.removeItem(MOMO_PAYMENT_SESSION_KEY);
          setStatus('success');
          sweetSuccess('Payment received', 'Your order is confirmed.');
          window.dispatchEvent(new CustomEvent('vrant:order-paid'));
          return;
        }

        if (res.status === 202 && data.pending) {
          window.setTimeout(poll, POLL_MS);
          return;
        }

        sessionStorage.removeItem(MOMO_PAYMENT_SESSION_KEY);
        setStatus('failed');
        sweetError('Payment failed', data.message || 'Could not complete Mobile Money payment.');
      } catch {
        window.setTimeout(poll, POLL_MS);
      }
    };

    void poll();

    return () => {
      cancelled = true;
    };
  }, [session, isAuthenticated, token]);

  const maskedPhone =
    session?.phone && session.phone.length >= 7
      ? `${session.phone.slice(0, 3)}···${session.phone.slice(-3)}`
      : session?.phone;

  return (
    <div className="min-h-screen bg-white">
      <ShopHeader cartCount={cartCount} />
      <main className={cn(SHOP_HEADER_OFFSET_PT, 'pb-16', PAGE_X)}>
        <div className="w-full max-w-md mx-auto py-16 text-center">
          {status === 'waiting' && (
            <>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-black/40 animate-pulse mb-4">
                Waiting for MoMo approval…
              </p>
              {session?.providerLabel && maskedPhone ? (
                <p className="text-[11px] font-bold text-black mb-3">
                  {session.providerLabel} · {maskedPhone}
                </p>
              ) : null}
              <p className="text-[10px] font-bold text-black/50 uppercase tracking-wider leading-relaxed mb-6">
                {session?.displayText
                  || 'Check your phone for a prompt or OTP to approve this payment. Keep this page open.'}
              </p>
              <p className="text-[9px] font-bold text-black/30 tabular-nums">
                Checking… {pollCount > 0 ? `(${pollCount})` : ''}
              </p>
              {session?.reference ? (
                <p className="text-[8px] font-bold text-black/25 mt-4 tabular-nums break-all">
                  Ref: {session.reference}
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
                The MoMo payment was not approved in time. You can try Paystack again or checkout on
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

export default PaymentMoMoPending;
