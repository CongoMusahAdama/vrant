import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ADMIN_INPUT, ADMIN_LABEL } from '@/admin/lib/apiForm';
import { cn } from '@/lib/utils';

type AdminProductColorsFieldProps = {
  colors: string[];
  onChange: (colors: string[]) => void;
};

const AdminProductColorsField = ({ colors, onChange }: AdminProductColorsFieldProps) => {
  const [draft, setDraft] = useState('');

  const addColor = () => {
    const name = draft.trim();
    if (!name) return;
    const exists = colors.some((c) => c.toLowerCase() === name.toLowerCase());
    if (exists) {
      setDraft('');
      return;
    }
    onChange([...colors, name]);
    setDraft('');
  };

  const removeColor = (name: string) => {
    onChange(colors.filter((c) => c !== name));
  };

  return (
    <div className="space-y-3">
      <div>
        <span className={ADMIN_LABEL}>Available colors *</span>
        <p className="text-[9px] font-bold uppercase tracking-wider text-black/40 mb-2">
          Shoppers pick from these at checkout
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            className={cn(ADMIN_INPUT, 'flex-1')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Black, White, Tan"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addColor();
              }
            }}
          />
          <button
            type="button"
            onClick={addColor}
            disabled={!draft.trim()}
            className="shrink-0 inline-flex items-center gap-1.5 border border-black px-4 py-2 min-h-[48px] text-[9px] font-bold tracking-[0.12em] uppercase hover:bg-black hover:text-white transition-colors disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      {colors.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <span
              key={color}
              className="inline-flex items-center gap-1.5 border border-black/15 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-black/80"
            >
              {color}
              <button
                type="button"
                onClick={() => removeColor(color)}
                className="p-0.5 hover:text-red-700"
                aria-label={`Remove ${color}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2">
          Add at least one color before saving
        </p>
      )}
    </div>
  );
};

export default AdminProductColorsField;
