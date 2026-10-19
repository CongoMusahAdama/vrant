import { useState } from 'react';
import { Minus, Plus, ChevronDown } from 'lucide-react';
import type { ShopProduct } from '@/data/products';
import type { DeliveryDetails } from '@/types/customer';
import {
  getProductColorOptions,
  productUsesCustomColorInput,
  resolveColorPreference,
} from '@/lib/product-options';
import { isDeliveryComplete } from '@/lib/delivery';
import DeliveryDetailsForm from '@/components/account/DeliveryDetailsForm';
import CheckoutOptions from '@/components/shop/CheckoutOptions';
import { usePaystack } from '@/contexts/PaystackContext';
import { useCart } from '@/contexts/CartContext';
import { showAddedToCartToast, ADD_TO_CART_BTN } from '@/lib/cart-toast';
import { cn } from '@/lib/utils';

const fieldLabel = 'block text-[9px] font-bold tracking-[0.18em] uppercase text-black mb-1';
const selectClass =
  'w-full appearance-none border border-black bg-white text-[10px] font-bold tracking-[0.1em] uppercase py-2 px-3 pr-9 min-h-[40px] focus:outline-none focus:ring-1 focus:ring-black rounded-none';

export type ProductPurchaseState = {
  size: string;
  quantity: number;
  colorChoice: string;
  colorCustom: string;
};

type ProductPurchasePanelProps = {
  product: ShopProduct;
  state: ProductPurchaseState & { delivery: DeliveryDetails };
  onStateChange: (patch: Partial<ProductPurchaseState>) => void;
  onDeliveryChange: (delivery: DeliveryDetails) => void;
  deliveryInitial?: Partial<DeliveryDetails> | null;
  isAuthenticated: boolean;
  lineTotal: number;
  onWhatsApp: () => void;
  onPaystack: () => void;
  onSignIn: () => void;
  paystackLoading?: boolean;
  checkoutError?: string;
};

const ProductPurchasePanel = ({
  product,
  state,
  onStateChange,
  onDeliveryChange,
  deliveryInitial,
  isAuthenticated,
  lineTotal,
  onWhatsApp,
  onPaystack,
  onSignIn,
  paystackLoading,
  checkoutError,
}: ProductPurchasePanelProps) => {
  const { enabled: paystackEnabled } = usePaystack();
  const { addToCart, openCart } = useCart();
  const { size, quantity, colorChoice, colorCustom, delivery } = state;
  const colorOptions = getProductColorOptions(product);
  const colorResolved = resolveColorPreference(colorChoice, colorCustom);
  const needsCustomColor = productUsesCustomColorInput(product) && colorChoice.includes('Other');
  const canAddToCart = Boolean(size?.trim());
  const canCheckout = Boolean(size && colorChoice && (!needsCustomColor || colorCustom.trim()));

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    addToCart(product, size, quantity);
    showAddedToCartToast({
      name: product.name,
      size,
      price: product.price,
      image: product.frontImage,
      onViewCart: () => openCart(),
    });
  };
  const deliverySaved = isDeliveryComplete(delivery);
  // Start collapsed only when delivery was already complete (e.g. saved profile).
  // Do not auto-collapse while the user is typing — that unmounts the form mid-field.
  const [deliveryOpen, setDeliveryOpen] = useState(!deliverySaved);

  const handleCheckout = (fn: () => void) => {
    if (!deliverySaved) {
      setDeliveryOpen(true);
    }
    fn();
  };

  return (
    <div className="space-y-3">
      {/* Size + quantity + color — one compact block */}
      <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="col-span-2 lg:col-span-1 xl:col-span-2">
          <label htmlFor="size-select" className={fieldLabel}>
            Size
          </label>
          <div className="relative">
            <select
              id="size-select"
              value={size}
              onChange={(e) => onStateChange({ size: e.target.value })}
              className={selectClass}
            >
              <option value="">Select size</option>
              {product.sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-black/40" />
          </div>
        </div>

        <div>
          <span className={fieldLabel}>Qty</span>
          <div className="flex items-stretch border border-black min-h-[40px]">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => onStateChange({ quantity: Math.max(1, quantity - 1) })}
              className="w-10 flex items-center justify-center hover:bg-black/5"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="flex-1 flex items-center justify-center text-[11px] font-bold tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() =>
                onStateChange({ quantity: Math.min(product.stock, quantity + 1) })
              }
              disabled={quantity >= product.stock}
              className="w-10 flex items-center justify-center hover:bg-black/5 disabled:opacity-30"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="color-select" className={fieldLabel}>
            Color
          </label>
          <div className="relative">
            <select
              id="color-select"
              value={colorChoice}
              onChange={(e) => onStateChange({ colorChoice: e.target.value })}
              className={selectClass}
            >
              <option value="">Select</option>
              {colorOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-black/40" />
          </div>
        </div>
      </div>

      {needsCustomColor && (
        <div>
          <label htmlFor="color-custom" className={fieldLabel}>
            Specify color
          </label>
          <input
            id="color-custom"
            value={colorCustom}
            onChange={(e) => onStateChange({ colorCustom: e.target.value })}
            placeholder="e.g. Olive, Cream"
            className="w-full border border-black bg-white text-[10px] font-bold uppercase py-2 px-3 min-h-[40px] focus:outline-none focus:ring-1 focus:ring-black rounded-none"
          />
        </div>
      )}

      {size && colorResolved && (
        <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-black/45">
          ₵{lineTotal}
          <span className="text-black/35">
            {' '}
            · {quantity}×{size} · {colorResolved}
          </span>
        </p>
      )}

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!canAddToCart}
        className={ADD_TO_CART_BTN}
      >
        Add to cart
      </button>

      {checkoutError && (
        <p className="text-[9px] font-bold text-red-600 uppercase tracking-wider">{checkoutError}</p>
      )}

      <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-black/40 text-center">
        Or checkout now
      </p>

      <CheckoutOptions
        isAuthenticated={isAuthenticated}
        paystackEnabled={paystackEnabled}
        onWhatsApp={() => handleCheckout(onWhatsApp)}
        onPaystack={() => handleCheckout(onPaystack)}
        onSignIn={onSignIn}
        whatsAppDisabled={!canCheckout}
        paystackDisabled={!canCheckout}
        paystackLoading={paystackLoading}
        whatsAppLabel="Checkout on WhatsApp"
        className="space-y-3"
      />

      {/* Delivery collapses when saved — saves vertical space */}
      <div className="border border-black/10">
        <button
          type="button"
          onClick={() => setDeliveryOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 min-h-[40px] text-left bg-black/[0.02] hover:bg-black/[0.04] transition-colors"
        >
          <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-black">
            Delivery / pickup
            {deliverySaved && (
              <span className="ml-2 text-black/40 font-bold">· saved</span>
            )}
          </span>
          <ChevronDown
            className={cn('w-4 h-4 shrink-0 transition-transform', deliveryOpen && 'rotate-180')}
          />
        </button>
        {deliveryOpen && (
          <div className="px-3 pb-3 pt-1 border-t border-black/10">
            <DeliveryDetailsForm
              initial={deliveryInitial}
              onSubmit={async (d) => onDeliveryChange(d)}
              onChange={onDeliveryChange}
              embedded
              compact
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPurchasePanel;
