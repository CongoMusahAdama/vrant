import type { ShopOrder } from '@/types/customer';
import { orderItemImages } from '@/admin/lib/orders';

type OrderProductImagesProps = {
  order: ShopOrder;
  size?: 'sm' | 'md';
};

const SIZE_CLASS = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12 sm:w-14 sm:h-14',
};

const OrderProductImages = ({ order, size = 'md' }: OrderProductImagesProps) => {
  const images = orderItemImages(order);
  const dim = SIZE_CLASS[size];

  return (
    <div className="flex flex-wrap gap-1">
      {images.map((img) =>
        img.src ? (
          <img
            key={img.key}
            src={img.src}
            alt={img.name}
            title={img.name}
            className={`${dim} object-contain border border-black/10 bg-white p-0.5 shrink-0`}
            loading="lazy"
          />
        ) : (
          <span
            key={img.key}
            className={`${dim} border border-dashed border-black/15 bg-black/[0.02] flex items-center justify-center text-[7px] font-bold uppercase text-black/30 text-center px-0.5 shrink-0`}
          >
            No img
          </span>
        )
      )}
    </div>
  );
};

export default OrderProductImages;
