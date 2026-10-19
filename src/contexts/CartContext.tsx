import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from 'react';
import type { ShopProduct } from '@/data/products';

const CART_STORAGE_KEY = 'vrant_cart';

export interface CartItem {
  id: number;
  name: string;
  price: string;
  priceAmount: number;
  frontImage: string;
  size: string;
  quantity: number;
}

interface CartContextValue {
  cart: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: ShopProduct, size: string, quantity?: number) => void;
  updateQuantity: (id: number, size: string, quantity: number) => void;
  removeFromCart: (id: number, size: string) => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readStoredCart(): CartItem[] {
  try {
    const raw = sessionStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => readStoredCart());
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const addToCart = useCallback((product: ShopProduct, size: string, quantity = 1) => {
    if (product.stock === 0 || quantity < 1) return;
    const addQty = Math.min(quantity, product.stock);

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id && item.size === size);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.size === size
            ? {
                ...item,
                quantity: Math.min(product.stock, item.quantity + addQty),
              }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          priceAmount: product.priceAmount,
          frontImage: product.frontImage,
          size,
          quantity: addQty,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((id: number, size: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => !(item.id === id && item.size === size)));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === id && item.size === size ? { ...item, quantity } : item
      )
    );
  }, []);

  const removeFromCart = useCallback((id: number, size: string) => {
    setCart((prev) => prev.filter((item) => !(item.id === id && item.size === size)));
  }, []);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.priceAmount * item.quantity, 0),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      isCartOpen,
      openCart,
      closeCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      cartCount,
      cartTotal,
    }),
    [
      cart,
      isCartOpen,
      openCart,
      closeCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      cartCount,
      cartTotal,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
