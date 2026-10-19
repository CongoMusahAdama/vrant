import { useState } from 'react';

import { Trash2 } from 'lucide-react';

import type { ShopProduct } from '@/data/products';

import ProductCard from '@/components/shop/ProductCard';

import { useWishlist } from '@/hooks/useWishlist';

import { sweetSuccess, sweetError } from '@/lib/sweet-alert';

import { cn } from '@/lib/utils';



type AccountWishlistGridProps = {

  products: ShopProduct[];

};



const AccountWishlistGrid = ({ products }: AccountWishlistGridProps) => {

  const { toggleWishlist } = useWishlist();

  const [removingId, setRemovingId] = useState<number | null>(null);



  const handleRemove = async (productId: number) => {

    setRemovingId(productId);

    try {

      await toggleWishlist(productId);

      sweetSuccess('Removed', 'Item removed from your wishlist.');

    } catch (err) {

      sweetError('Could not remove', err instanceof Error ? err.message : undefined);

    } finally {

      setRemovingId(null);

    }

  };



  return (

    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">

      {products.map((product, index) => (

        <div key={product.id} className="relative flex flex-col">

          <ProductCard product={product} index={index} />

          <button

            type="button"

            disabled={removingId === product.id}

            onClick={() => handleRemove(product.id)}

            className={cn(

              'absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-20',

              'inline-flex items-center justify-center gap-1',

              'bg-white/95 border border-black/20 shadow-sm',

              'px-2 sm:px-2.5 py-2 min-h-[40px] sm:min-h-[36px]',

              'text-[8px] font-bold tracking-[0.1em] uppercase text-black/70',

              'active:bg-red-50 active:border-red-400 active:text-red-700',

              'disabled:opacity-50 touch-manipulation'

            )}

          >

            <Trash2 className="w-3.5 h-3.5 shrink-0" aria-hidden />
            <span className="sr-only">Remove from wishlist</span>

          </button>

        </div>

      ))}

    </div>

  );

};



export default AccountWishlistGrid;


