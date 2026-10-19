import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePaystack } from '@/contexts/PaystackContext';
import { apiFetch } from '@/lib/api';
import { getDeliveryFromUser, isDeliveryComplete, deliveryToAddressPayload } from '@/lib/delivery';
import { openWhatsApp } from '@/lib/whatsapp';
import { sweetError } from '@/lib/sweet-alert';
import { MOMO_PAYMENT_SESSION_KEY } from '@/pages/PaymentMoMoPending';
import type { DeliveryDetails, ShopOrderItem } from '@/types/customer';

type CheckoutChannel = 'whatsapp' | 'paystack';

type PendingCheckout = {
  channel: CheckoutChannel;
  message?: string;
  items: ShopOrderItem[];
  totalAmount: number;
};

export function useShopCheckout() {
  const { user, token, isAuthenticated, refreshUser } = useAuth();
  const { enabled: paystackEnabled } = usePaystack();
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckout | null>(null);
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [pendingChannel, setPendingChannel] = useState<CheckoutChannel>('whatsapp');
  const paystackInitInFlight = useRef(false);

  const runWhatsAppCheckout = useCallback(
    async (
      message: string,
      items: ShopOrderItem[],
      totalAmount: number,
      delivery?: DeliveryDetails | null
    ) => {
      if (token && delivery) {
        try {
          await apiFetch('/api/shop-orders', {
            method: 'POST',
            token,
            body: JSON.stringify({
              items,
              shippingAddress: delivery,
              totalAmount,
              channel: 'whatsapp',
            }),
          });
        } catch (e) {
          console.error('Order log failed:', e);
        }
      }
      openWhatsApp(message);
    },
    [token]
  );

  const runPaystackCheckout = useCallback(
    async (items: ShopOrderItem[], totalAmount: number, delivery: DeliveryDetails) => {
      if (!token || !user?.email) {
        sweetError('Sign in required', 'Please sign in to pay with Paystack.');
        return;
      }

      if (paystackInitInFlight.current) return;
      paystackInitInFlight.current = true;
      setPaystackLoading(true);
      try {
        const init = await apiFetch<{
          success: boolean;
          message?: string;
          data: {
            reference: string;
            publicKey?: string;
            amount: number;
            orderId: string;
            authorizationUrl?: string;
            chargeMode?: boolean;
            displayText?: string;
            phone?: string;
            providerLabel?: string;
          };
        }>('/api/payments/initialize', {
          method: 'POST',
          token,
          body: JSON.stringify({
            items,
            shippingAddress: delivery,
            totalAmount,
          }),
        });

        if (init.data.chargeMode) {
          sessionStorage.setItem(
            MOMO_PAYMENT_SESSION_KEY,
            JSON.stringify({
              reference: init.data.reference,
              displayText: init.data.displayText,
              phone: init.data.phone,
              providerLabel: init.data.providerLabel,
            })
          );
          window.location.assign('/payment/momo');
          return;
        }

        const { authorizationUrl } = init.data;
        if (!authorizationUrl) {
          throw new Error('Paystack did not return a checkout link. Please try again.');
        }

        // Keep loading state until navigation — prevents double-click duplicate orders
        window.location.assign(authorizationUrl);
      } catch (err) {
        paystackInitInFlight.current = false;
        setPaystackLoading(false);
        const msg = err instanceof Error ? err.message : 'Could not start Paystack payment';
        sweetError('Paystack unavailable', msg);
      }
    },
    [token, user?.email]
  );

  const completePending = useCallback(
    async (delivery: DeliveryDetails) => {
      if (!pendingCheckout) return;
      const pending = pendingCheckout;
      setPendingCheckout(null);
      setDeliveryModalOpen(false);

      if (pending.channel === 'whatsapp' && pending.message) {
        await runWhatsAppCheckout(pending.message, pending.items, pending.totalAmount, delivery);
      } else if (pending.channel === 'paystack') {
        await runPaystackCheckout(pending.items, pending.totalAmount, delivery);
      }
    },
    [pendingCheckout, runWhatsAppCheckout, runPaystackCheckout]
  );

  const resolveDelivery = useCallback(
    (inline?: DeliveryDetails | null) => {
      if (inline && isDeliveryComplete(inline)) return inline;
      if (isAuthenticated) return getDeliveryFromUser(user);
      return null;
    },
    [isAuthenticated, user]
  );

  const queueCheckout = useCallback(
    (
      channel: CheckoutChannel,
      items: ShopOrderItem[],
      totalAmount: number,
      message?: string,
      options?: { delivery?: DeliveryDetails | null }
    ): { needsAuth?: true; needsDelivery?: true; missingDelivery?: true; ok?: true } => {
      if (channel === 'paystack' && !isAuthenticated) {
        return { needsAuth: true };
      }

      if (channel === 'paystack' && !paystackEnabled) {
        sweetError(
          'Card payment unavailable',
          'Paystack is not configured yet. Please checkout on WhatsApp or sign in later.'
        );
        return {};
      }

      const delivery = resolveDelivery(options?.delivery);

      if (!isDeliveryComplete(delivery)) {
        if (options?.delivery) {
          return { missingDelivery: true };
        }
        if (isAuthenticated) {
          setPendingChannel(channel);
          setPendingCheckout({ channel, message, items, totalAmount });
          setDeliveryModalOpen(true);
          return { needsDelivery: true };
        }
        return { missingDelivery: true };
      }

      if (channel === 'whatsapp' && message) {
        void runWhatsAppCheckout(message, items, totalAmount, delivery);
      } else if (channel === 'paystack' && delivery) {
        void runPaystackCheckout(items, totalAmount, delivery);
      }

      return { ok: true };
    },
    [isAuthenticated, paystackEnabled, resolveDelivery, runWhatsAppCheckout, runPaystackCheckout]
  );

  const startWhatsAppCheckout = useCallback(
    (
      message: string,
      items: ShopOrderItem[],
      totalAmount: number,
      options?: { delivery?: DeliveryDetails | null }
    ) => queueCheckout('whatsapp', items, totalAmount, message, options),
    [queueCheckout]
  );

  const startPaystackCheckout = useCallback(
    (items: ShopOrderItem[], totalAmount: number, options?: { delivery?: DeliveryDetails | null }) =>
      queueCheckout('paystack', items, totalAmount, undefined, options),
    [queueCheckout]
  );

  const completeWithDelivery = useCallback(
    async (delivery: DeliveryDetails) => {
      if (!token) return;
      await apiFetch('/api/auth/profile', {
        method: 'PUT',
        token,
        body: JSON.stringify(deliveryToAddressPayload(delivery)),
      });
      await refreshUser();
      await completePending(delivery);
    },
    [token, refreshUser, completePending]
  );

  return {
    deliveryModalOpen,
    setDeliveryModalOpen,
    pendingChannel,
    startWhatsAppCheckout,
    startPaystackCheckout,
    completeWithDelivery,
    paystackLoading,
    paystackEnabled,
    /** @deprecated use startWhatsAppCheckout */
    startCheckout: startWhatsAppCheckout,
  };
}
