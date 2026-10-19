import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/auth/AuthModal';
import CheckoutOptions from '@/components/shop/CheckoutOptions';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { buildCartOrderMessage } from '@/lib/whatsapp';
import { getDeliveryFromUser } from '@/lib/delivery';
import { useShopCheckout } from '@/hooks/useShopCheckout';
import DeliveryDetailsModal from '@/components/account/DeliveryDetailsModal';

const CartView = () => {
  const { cart, updateQuantity, removeFromCart, cartTotal } = useCart();
  const { login, isAuthenticated, user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [savingDelivery, setSavingDelivery] = useState(false);
  const {
    deliveryModalOpen,
    setDeliveryModalOpen,
    pendingChannel,
    startWhatsAppCheckout,
    startPaystackCheckout,
    completeWithDelivery,
    paystackLoading,
    paystackEnabled,
  } = useShopCheckout();

  const cartOrderItems = () =>
    cart.map((item) => ({
      productId: item.id,
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
      priceAmount: item.priceAmount,
    }));

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;
    const delivery = getDeliveryFromUser(user);
    const message = buildCartOrderMessage(cart, cartTotal, delivery);
    startWhatsAppCheckout(message, cartOrderItems(), cartTotal);
  };

  const handlePaystackCheckout = () => {
    if (cart.length === 0) return;
    if (!isAuthenticated) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }
    const result = startPaystackCheckout(cartOrderItems(), cartTotal);
    if (result.needsAuth) {
      setAuthMode('login');
      setAuthOpen(true);
    }
  };

  const openSignIn = () => {
    setAuthMode('login');
    setAuthOpen(true);
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-16 sm:py-24">
        <ShoppingBag className="w-10 h-10 mx-auto text-black/15 mb-4" strokeWidth={1.5} />
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-black/40 mb-6">
          Your cart is empty
        </p>
        <Link to="/products">
          <button type="button" className="btn-premium">
            Continue shopping
          </button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-4xl mx-auto px-0 sm:px-2">
        <ScrollReveal variant="fade-up">
          <h1 className="text-lg sm:text-xl font-bold tracking-[0.12em] uppercase text-black mb-8 sm:mb-10">
            Your Cart
          </h1>
        </ScrollReveal>

        {/* Column headers — desktop */}
        <div className="hidden sm:grid grid-cols-[1fr_5rem_6rem_5rem] gap-4 pb-3 border-b border-black text-[9px] font-bold tracking-[0.2em] uppercase text-black/50">
          <span />
          <span className="text-right">Price</span>
          <span className="text-center">Quantity</span>
          <span className="text-right">Total</span>
        </div>

        <ul className="divide-y divide-black/10">
          {cart.map((item, index) => {
            const lineTotal = item.priceAmount * item.quantity;
            return (
              <ScrollReveal key={`${item.id}-${item.size}`} variant="product" delay={index * 60}>
                <li className="py-6 sm:py-8">
                  <div className="flex gap-4 sm:gap-6">
                    <Link
                      to={`/products/${item.id}`}
                      className="w-20 sm:w-24 aspect-square bg-[#f5f5f5] shrink-0 flex items-center justify-center overflow-hidden border border-black/10"
                    >
                      <img
                        src={item.frontImage}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain p-1"
                      />
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col sm:grid sm:grid-cols-[1fr_5rem_6rem_5rem] sm:gap-4 sm:items-start">
                      <div className="sm:col-span-1">
                        <Link
                          to={`/products/${item.id}`}
                          className="text-[10px] sm:text-[11px] font-bold tracking-[0.12em] uppercase text-black hover:opacity-60 leading-snug block"
                        >
                          {item.name}
                        </Link>
                        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-black/50 mt-1">
                          Size {item.size}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id, item.size)}
                          className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.15em] uppercase text-black/50 hover:text-red-700 mt-2 min-h-[36px]"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                          Remove
                        </button>
                      </div>

                      <p className="text-[11px] font-bold text-black mt-3 sm:mt-0 sm:text-right">
                        <span className="sm:hidden text-black/40 mr-2 text-[9px] tracking-[0.2em] uppercase">
                          Price
                        </span>
                        {item.price}
                      </p>

                      <div className="mt-2 sm:mt-0 flex items-center sm:justify-center gap-2">
                        <span className="sm:hidden text-[9px] font-bold tracking-[0.2em] uppercase text-black/40">
                          Qty
                        </span>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => {
                            const q = parseInt(e.target.value, 10);
                            if (!Number.isNaN(q)) {
                              updateQuantity(item.id, item.size, q);
                            }
                          }}
                          className="w-14 sm:w-16 border border-black text-center text-[11px] font-bold py-2 bg-white focus:outline-none focus:ring-1 focus:ring-black"
                          aria-label={`Quantity for ${item.name}`}
                        />
                      </div>

                      <p className="text-[11px] font-bold text-black mt-2 sm:mt-0 sm:text-right">
                        <span className="sm:hidden text-black/40 mr-2 text-[9px] tracking-[0.2em] uppercase">
                          Total
                        </span>
                        ₵{lineTotal}
                      </p>
                    </div>
                  </div>
                </li>
              </ScrollReveal>
            );
          })}
        </ul>

        <ScrollReveal variant="fade-up" delay={120} className="pt-6 sm:pt-8 border-t border-black">
          <div className="flex justify-end mb-8 sm:mb-10">
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-black">
              Subtotal{' '}
              <span className="ml-4 tabular-nums">₵{cartTotal}</span>
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap sm:justify-end gap-3 sm:gap-4">
            <Link to="/products" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto min-h-[48px] px-6 py-3 border border-black bg-white text-[10px] font-bold tracking-[0.2em] uppercase text-black hover:bg-black/5 transition-colors"
              >
                Continue shopping
              </button>
            </Link>

            <button
              type="button"
              className="w-full sm:w-auto min-h-[48px] px-6 py-3 border border-black bg-white text-[10px] font-bold tracking-[0.2em] uppercase text-black hover:bg-black/5 transition-colors"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Update cart
            </button>

          </div>

          <div className="mt-8 pt-8 border-t border-black/10">
            <CheckoutOptions
              isAuthenticated={isAuthenticated}
              paystackEnabled={paystackEnabled}
              onWhatsApp={handleWhatsAppCheckout}
              onPaystack={handlePaystackCheckout}
              onSignIn={openSignIn}
              paystackLoading={paystackLoading}
              whatsAppLabel="Checkout on WhatsApp"
            />
          </div>
        </ScrollReveal>
      </div>

      <DeliveryDetailsModal
        open={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        saving={savingDelivery}
        submitLabel={pendingChannel === 'paystack' ? 'Continue to Paystack' : 'Continue to WhatsApp'}
        subtitle={
          pendingChannel === 'paystack'
            ? 'Add your delivery details before card payment.'
            : 'Add your delivery info so we can prefill WhatsApp checkout and track your order.'
        }
        onSave={async (delivery) => {
          setSavingDelivery(true);
          try {
            await completeWithDelivery(delivery);
          } finally {
            setSavingDelivery(false);
          }
        }}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={async (token, user) => {
          await login(token, user);
          setAuthOpen(false);
        }}
        initialMode={authMode}
        stayOnPage
      />
    </>
  );
};

export default CartView;
