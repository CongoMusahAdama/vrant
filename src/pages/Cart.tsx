import ShopHeader from '@/components/navigation/ShopHeader';
import CartView from '@/components/shop/CartView';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import ScrollToTop from '@/components/ui/scroll-to-top';
import { useCart } from '@/contexts/CartContext';
import { SHOP_HEADER_OFFSET_PT, PAGE_X, MOBILE_BOTTOM_SAFE } from '@/lib/page-layout';

const Cart = () => {
  const { cartCount } = useCart();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <ShopHeader cartCount={cartCount} />
      <main className={`w-full ${SHOP_HEADER_OFFSET_PT} ${MOBILE_BOTTOM_SAFE}`}>
        <CartView />
      </main>
      <Footer />
      <WhatsAppButton />
      <ScrollToTop />
    </div>
  );
};

export default Cart;
