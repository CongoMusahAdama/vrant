import { Pencil, Trash2 } from 'lucide-react';
import type { MongoProduct } from '@/admin/types/admin';
import { productImageUrl } from '@/admin/lib/productImage';
import { formatGhs } from '@/admin/lib/format';
import { cn } from '@/lib/utils';

type AdminProductCardProps = {
  product: MongoProduct;
  onEdit: (product: MongoProduct) => void;
  onDelete: (id: string, name: string) => void;
  onToggleSoldOut: (product: MongoProduct, soldOut: boolean) => void;
  onMarkSoldOut: (product: MongoProduct) => void;
  updatingId?: string | null;
};

function stockStatus(product: MongoProduct) {
  if (product.soldOut || product.stock <= 0) {
    return { label: 'Sold out', tone: 'bg-[#f0e8e8] text-[#6b4f4f] border-[#ddd0d0]' };
  }
  if (product.stock <= 5) {
    return { label: 'Low stock', tone: 'bg-[#f3efe6] text-[#6b5c45] border-[#ddd4c4]' };
  }
  return { label: 'In stock', tone: 'bg-[#e8efe9] text-[#4a5f4f] border-[#cdd8cf]' };
}

const AdminProductCard = ({
  product,
  onEdit,
  onDelete,
  onToggleSoldOut,
  onMarkSoldOut,
  updatingId,
}: AdminProductCardProps) => {
  const img = productImageUrl(product.images?.front);
  const status = stockStatus(product);
  const isSoldOut = Boolean(product.soldOut || product.stock <= 0);
  const busy = updatingId === product._id;

  return (
    <article className="border border-black/10 bg-white p-3.5">
      <div className="flex gap-3">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-16 h-16 shrink-0 object-contain border border-black/10 bg-white p-0.5"
            loading="lazy"
          />
        ) : (
          <span className="w-16 h-16 shrink-0 border border-dashed border-black/15 bg-black/[0.02] flex items-center justify-center text-[7px] font-bold uppercase text-black/30">
            No img
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-black leading-snug">
            {product.name}
          </p>
          <p className="text-[9px] font-bold uppercase text-black/45 mt-0.5">{product.category}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <p className="text-sm font-bold tabular-nums">{formatGhs(product.price)}</p>
            <span className="text-[9px] font-bold text-black/40">·</span>
            <p className="text-[10px] font-bold tabular-nums text-black/60">Stock {product.stock}</p>
          </div>
          <span
            className={cn(
              'inline-flex mt-2 px-2 py-0.5 text-[8px] font-bold tracking-[0.1em] uppercase border',
              status.tone
            )}
          >
            {status.label}
          </span>
        </div>
      </div>

      <label className="flex items-center gap-3 min-h-[48px] mt-3 pt-3 border-t border-black/10 cursor-pointer">
        <input
          type="checkbox"
          checked={isSoldOut}
          disabled={busy}
          onChange={(e) => onToggleSoldOut(product, e.target.checked)}
          className="h-5 w-5 border-black/30 accent-black"
          aria-label={`Mark ${product.name} out of stock`}
        />
        <span className="text-[10px] font-bold uppercase tracking-wider text-black/70">
          Out of stock
        </span>
      </label>

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="flex-1 inline-flex items-center justify-center gap-1 border border-black/20 min-h-[48px] text-[9px] font-bold tracking-[0.1em] uppercase hover:border-black active:bg-black/[0.03]"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
        {!isSoldOut ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onMarkSoldOut(product)}
            className="flex-1 min-h-[48px] text-[9px] font-bold tracking-[0.1em] uppercase border border-[#ddd0d0] bg-[#f0e8e8] text-[#6b4f4f]"
          >
            Sold out
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onDelete(product._id, product.name)}
          className="inline-flex items-center justify-center min-h-[48px] min-w-[48px] text-red-600 border border-black/10 active:bg-red-50 shrink-0"
          aria-label="Delete product"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
};

export default AdminProductCard;
