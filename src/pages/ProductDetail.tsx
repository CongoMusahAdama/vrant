import { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import ShopHeader from '@/components/navigation/ShopHeader';
import ProductPurchasePanel, { type ProductPurchaseState } from '@/components/shop/ProductPurchasePanel';
import AuthModal from '@/components/auth/AuthModal';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/ui/scroll-to-top';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import { useCategories } from '@/contexts/CategoriesContext';
import { useShopCatalog } from '@/contexts/ShopCatalogContext';
import { getProductGalleryImages } from '@/lib/product-images';
import ProductImageFlip from '@/components/shop/ProductImageFlip';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { buildSingleProductOrderMessage } from '@/lib/whatsapp';
import { getDeliveryFromUser, isDeliveryComplete } from '@/lib/delivery';
import { productUsesCustomColorInput, resolveColorPreference } from '@/lib/product-options';
import WishlistButton from '@/components/shop/WishlistButton';
import DeliveryDetailsModal from '@/components/account/DeliveryDetailsModal';
import { useShopCheckout } from '@/hooks/useShopCheckout';
import { cn } from '@/lib/utils';
import { PAGE_X, PRODUCT_DETAIL_OFFSET_PT } from '@/lib/page-layout';
import { sweetError } from '@/lib/sweet-alert';
import type { DeliveryDetails } from '@/types/customer';

const emptyDelivery = (): DeliveryDetails => ({
  fullName: '',
  phone: '',
  deliveryMethod: 'delivery',
  street: '',
  city: '',
  region: '',
  country: 'Ghana',
  pickupStation: '',
});

const ProductDetail = () => {
  const { id } = useParams();
  const productId = Number(id);
  const { getProductById, loading: catalogLoading } = useShopCatalog();
  const product = getProductById(productId);
  const { cartCount } = useCart();
  const { login, user, isAuthenticated } = useAuth();
  const { getLabel: getCategoryLabel } = useCategories();
  const [selectedImage, setSelectedImage] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [purchase, setPurchase] = useState<Omit<ProductPurchaseState, 'delivery'>>({
    size: '',
    quantity: 1,
    colorChoice: '',
    colorCustom: '',
  });
  const [delivery, setDelivery] = useState<DeliveryDetails>(emptyDelivery);

  const {
    deliveryModalOpen,
    setDeliveryModalOpen,
    pendingChannel,
    startWhatsAppCheckout,
    startPaystackCheckout,
    completeWithDelivery,
    paystackLoading,
  } = useShopCheckout();

  useEffect(() => {
    const fromUser = getDeliveryFromUser(user);
    if (fromUser) setDelivery(fromUser);
  }, [user]);

  if (catalogLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-black/40 animate-pulse">
          Loading product…
        </p>
      </div>
    );
  }

  if (!product) {
    return <Navigate to="/products" replace />;
  }

  const isSoldOut = product.stock === 0;
  const gallery = getProductGalleryImages(product);
  const imageUrls = gallery.map((img) => img.url);
  const lineTotal = product.priceAmount * purchase.quantity;
  const colorLabel = resolveColorPreference(purchase.colorChoice, purchase.colorCustom);
  const deliveryInitial = getDeliveryFromUser(user);

  const canPurchase = Boolean(
    purchase.size &&
      purchase.colorChoice &&
      (!productUsesCustomColorInput(product) ||
        !purchase.colorChoice.includes('Other') ||
        purchase.colorCustom.trim())
  );

  const orderItems = () => [
    {
      productId: product.id,
      name: product.name,
      size: purchase.size,
      quantity: purchase.quantity,
      price: product.price,
      priceAmount: product.priceAmount,
      colorPreference: colorLabel,
    },
  ];

  const runCheckout = (channel: 'whatsapp' | 'paystack') => {
    setCheckoutError('');
    if (!canPurchase) {
      setCheckoutError('Select size and color to continue');
      return;
    }
    if (!isDeliveryComplete(delivery)) {
      setCheckoutError('Please complete delivery / pickup details below');
      sweetError('Delivery required', 'Fill in your delivery or pickup details before checkout.');
      return;
    }

    const message = buildSingleProductOrderMessage(
      product,
      purchase.size,
      purchase.quantity,
      delivery,
      { colorPreference: colorLabel }
    );

    if (channel === 'whatsapp') {
      const result = startWhatsAppCheckout(message, orderItems(), lineTotal, { delivery });
      if (result.needsAuth) setAuthOpen(true);
      if (result.missingDelivery) setCheckoutError('Please complete delivery / pickup details');
    } else {
      if (!isAuthenticated) {
        setAuthOpen(true);
        return;
      }
      const result = startPaystackCheckout(orderItems(), lineTotal, { delivery });
      if (result.needsAuth) setAuthOpen(true);
      if (result.missingDelivery) setCheckoutError('Please complete delivery / pickup details');
      if (result.needsDelivery) setDeliveryModalOpen(true);
    }
  };

  const productMeta = (
    <>
      <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/40 mb-0.5">
        {getCategoryLabel(product.category)}
      </p>
      <h1 className="text-[12px] sm:text-[13px] font-bold tracking-[0.1em] uppercase text-black mb-1 leading-snug">
        {product.name}
      </h1>
      <p className="text-sm sm:text-base font-bold text-black">{product.price}</p>
    </>
  );

  const purchasePanel = !isSoldOut && (
    <ProductPurchasePanel
      product={product}
      state={{ ...purchase, delivery }}
      onStateChange={(patch) => {
        setPurchase((prev) => ({ ...prev, ...patch }));
        setCheckoutError('');
      }}
      onDeliveryChange={setDelivery}
      deliveryInitial={deliveryInitial}
      isAuthenticated={isAuthenticated}
      lineTotal={lineTotal}
      onWhatsApp={() => runCheckout('whatsapp')}
      onPaystack={() => runCheckout('paystack')}
      onSignIn={() => setAuthOpen(true)}
      paystackLoading={paystackLoading}
      checkoutError={checkoutError}
    />
  );

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
      <ShopHeader cartCount={cartCount} />

      <main className={cn(PRODUCT_DETAIL_OFFSET_PT, 'pb-28 lg:pb-10')}>
        <div className={cn('w-full max-w-[1200px] mx-auto', PAGE_X)}>
          <Link
            to="/products"
            className="inline-flex items-center text-[10px] font-bold tracking-[0.2em] uppercase text-black/50 hover:text-black mb-3 lg:mb-4 min-h-[40px]"
          >
            ← Back to shop
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,300px)_minmax(280px,1fr)] gap-4 sm:gap-5 lg:gap-6 lg:items-start">
            <div className="w-full min-w-0 lg:max-w-none">
              <div className="relative w-full">
                {!isSoldOut && (
                  <div className="absolute top-1 right-1 z-10">
                    <WishlistButton productId={product.id} />
                  </div>
                )}
                <ProductImageFlip
                  images={imageUrls}
                  labels={gallery.map((img) => img.label)}
                  alt={product.name}
                  className="w-full"
                  imageClassName={cn(
                    'w-full h-auto max-h-[min(88vw,520px)] sm:max-h-[560px] lg:max-h-[440px]',
                    'object-contain animate-product-image-in'
                  )}
                  index={selectedImage}
                  onIndexChange={setSelectedImage}
                  showControls={false}
                  showViewLabel={false}
                  showIndicators={false}
                  enableHoverFlip={gallery.length >= 2}
                />
              </div>

              {gallery.length > 1 && (
                <div className="flex flex-row gap-2 mt-2 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1 max-w-full">
                  {gallery.map((entry, index) => (
                    <button
                      key={`${entry.url}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className={cn(
                        'flex flex-col items-center shrink-0 snap-start min-h-[44px]',
                        selectedImage === index ? 'opacity-100' : 'opacity-60'
                      )}
                    >
                      <span
                        className={cn(
                          'aspect-square w-14 sm:w-16 border bg-white flex items-center justify-center p-1 transition-all',
                          selectedImage === index
                            ? 'border-black ring-1 ring-black'
                            : 'border-black/15'
                        )}
                      >
                        <img src={entry.url} alt="" className="max-h-full max-w-full object-contain" />
                      </span>
                      {entry.label ? (
                        <span className="text-[7px] font-bold tracking-[0.1em] uppercase text-black/50 mt-1">
                          {entry.label}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}

              <div className="lg:hidden mt-3 mb-1">{productMeta}</div>
            </div>

            <div className="min-w-0 lg:sticky lg:top-[12rem] lg:self-start">
              <div className="hidden lg:block mb-2">{productMeta}</div>

              {isSoldOut ? (
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-black/50">
                  Sold out
                </p>
              ) : (
                <div id="product-purchase">{purchasePanel}</div>
              )}
            </div>
          </div>

          <div className="mt-8 lg:mt-10 pt-6 border-t border-black/10 max-w-2xl">
            <p className="text-[11px] font-bold text-black/70 leading-[1.75] mb-4">
              {product.description}
            </p>
            <ul className="space-y-2">
              {product.details.map((detail) => (
                <li
                  key={detail}
                  className="text-[11px] font-bold text-black/80 leading-[1.75] pl-3 relative before:content-['-'] before:absolute before:left-0"
                >
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={async (token, userData) => {
          await login(token, userData);
          setAuthOpen(false);
        }}
        initialMode="login"
        stayOnPage
      />

      <DeliveryDetailsModal
        open={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        saving={savingDelivery}
        submitLabel={pendingChannel === 'paystack' ? 'Continue to Paystack' : 'Continue to WhatsApp'}
        subtitle="Complete delivery details to finish checkout."
        onSave={async (d) => {
          setSavingDelivery(true);
          try {
            setDelivery(d);
            await completeWithDelivery(d);
          } finally {
            setSavingDelivery(false);
          }
        }}
      />

      <WhatsAppButton />
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default ProductDetail;
