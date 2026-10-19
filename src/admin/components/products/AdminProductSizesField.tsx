import { PRODUCT_SIZES } from '@/lib/product-sizes';
import { ADMIN_LABEL } from '@/admin/lib/apiForm';
import { cn } from '@/lib/utils';

type AdminProductSizesFieldProps = {
  sizes: string[];
  onChange: (sizes: string[]) => void;
};

const AdminProductSizesField = ({ sizes, onChange }: AdminProductSizesFieldProps) => {
  const toggle = (size: string) => {
    if (sizes.includes(size)) {
      onChange(sizes.filter((s) => s !== size));
      return;
    }
    onChange([...sizes, size]);
  };

  return (
    <div className="space-y-3">
      <div>
        <span className={ADMIN_LABEL}>Available sizes *</span>
        <p className="text-[9px] font-bold uppercase tracking-wider text-black/40 mb-2">
          Tap to select sizes shoppers can choose at checkout
        </p>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_SIZES.map((size) => {
            const active = sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggle(size)}
                className={cn(
                  'min-h-[44px] px-4 text-[9px] font-bold tracking-[0.14em] uppercase border transition-colors touch-manipulation',
                  active
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black/55 border-black/15 hover:border-black/35'
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {sizes.length > 0 ? (
        <p className="text-[9px] font-bold uppercase tracking-wider text-black/45">
          Selected: {sizes.join(' · ')}
        </p>
      ) : (
        <p className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2">
          Select at least one size before saving
        </p>
      )}
    </div>
  );
};

export default AdminProductSizesField;
