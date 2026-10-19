import { Link } from 'react-router-dom';
import type { ShopProduct } from '@/data/products';
import { cn } from '@/lib/utils';

interface RailProductCardProps {
  product: ShopProduct;
  className?: string;
}

/** Minimal product tile — image, name, brand, price */
const RailProductCard = ({ product, className }: RailProductCardProps) => {
  const soldOut = product.stock === 0;
  const hover = product.images[1];

  return (
    <Link
      to={`/products/${product.id}`}
      className={cn('group block snap-start shrink-0', className)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f2f2f2]">
        <img
          src={product.frontImage}
          alt={product.name}
          loading="lazy"
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
            hover && 'group-hover:opacity-0'
          )}
        />
        {hover && (
          <img
            src={hover}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
        {soldOut && (
          <span className="absolute bottom-2 left-2 bg-white text-black text-[11px] font-medium px-2 py-1">
            Sold out
          </span>
        )}
      </div>
      <h3 className="mt-3 text-[13px] font-semibold normal-case tracking-normal text-black leading-snug">
        {product.name}
      </h3>
      <p className="mt-0.5 text-xs font-normal text-black/50">VRANT</p>
      <p className="mt-2 text-xs font-normal text-black/60">{product.price}</p>
    </Link>
  );
};

export default RailProductCard;
