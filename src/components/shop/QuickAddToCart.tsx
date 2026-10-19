import { useState, useRef, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShopProduct } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { showAddedToCartToast } from '@/lib/cart-toast';

type QuickAddToCartProps = {
  product: ShopProduct;
  size?: 'sm' | 'md';
  className?: string;
  /** Use size already chosen on product page */
  preferredSize?: string;
  onSizePick?: (size: string) => void;
  onAdded?: () => void;
};

const QuickAddToCart = ({
  product,
  size = 'md',
  className,
  preferredSize,
  onSizePick,
  onAdded,
}: QuickAddToCartProps) => {
  const { addToCart, openCart } = useCart();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (product.stock === 0) return null;

  const addWithSize = (selectedSize: string) => {
    onSizePick?.(selectedSize);
    addToCart(product, selectedSize, 1);
    setOpen(false);
    showAddedToCartToast({
      name: product.name,
      size: selectedSize,
      price: product.price,
      image: product.frontImage,
      onViewCart: () => openCart(),
    });
    onAdded?.();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (preferredSize?.trim()) {
      addWithSize(preferredSize);
      return;
    }
    if (product.sizes.length === 1) {
      addWithSize(product.sizes[0]);
      return;
    }
    setOpen((o) => !o);
  };

  const btnClass =
    size === 'sm'
      ? 'h-8 w-8'
      : 'h-10 w-10 sm:h-11 sm:w-11';

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Add to cart"
        aria-expanded={open}
        className={cn(
          btnClass,
          'flex items-center justify-center bg-black text-white border border-black',
          'hover:bg-black/90 active:scale-95 transition-all shadow-sm'
        )}
      >
        <ShoppingBag className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} strokeWidth={2} />
      </button>

      {open && product.sizes.length > 1 && (
        <div
          className="absolute left-0 top-full mt-1 z-20 min-w-[120px] border border-black bg-white shadow-lg py-1"
          role="menu"
        >
          <p className="px-3 py-1.5 text-[8px] font-bold tracking-[0.15em] uppercase text-black/40 border-b border-black/10">
            Pick size
          </p>
          {product.sizes.map((s) => (
            <button
              key={s}
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addWithSize(s);
              }}
              className="w-full text-left px-3 py-2.5 text-[10px] font-bold tracking-[0.12em] uppercase hover:bg-black hover:text-white transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuickAddToCart;
