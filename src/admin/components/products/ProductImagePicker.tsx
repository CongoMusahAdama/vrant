import { useEffect, useId, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { ADMIN_LABEL } from '@/admin/lib/apiForm';
import { MAX_PRODUCT_IMAGES, MAX_UPLOAD_BYTES, formatMaxUploadSize } from '@/lib/upload-limits';
import { cn } from '@/lib/utils';

export type ImageRole = 'front' | 'back' | 'additional';

export type ProductImageEntry = {
  id: string;
  file: File;
  preview: string;
  role: ImageRole;
  /** Shown under thumbnails on the shop (e.g. Black, White) */
  label: string;
};

type ProductImagePickerProps = {
  images: ProductImageEntry[];
  onChange: (images: ProductImageEntry[]) => void;
  maxImages?: number;
  /** When editing, new uploads are extra angles (not front/back slots) */
  appendOnly?: boolean;
  /** Prefills empty thumbnail labels (e.g. product colors: Black, White) */
  colorSuggestions?: string[];
  onReject?: (message: string) => void;
};

function nextId() {
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function roleForIndex(index: number, appendOnly: boolean): ImageRole {
  if (appendOnly) return 'additional';
  if (index === 0) return 'front';
  if (index === 1) return 'back';
  return 'additional';
}

function labelSuggestion(colors: string[] | undefined, index: number): string {
  const name = colors?.[index]?.trim();
  return name || '';
}

const ProductImagePicker = ({
  images,
  onChange,
  maxImages = MAX_PRODUCT_IMAGES,
  appendOnly = false,
  colorSuggestions = [],
  onReject,
}: ProductImagePickerProps) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);

  useEffect(() => {
    imagesRef.current = images;
  });

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, []);

  useEffect(() => {
    if (!colorSuggestions.length) return;

    const current = imagesRef.current;
    if (current.length === 0) return;

    const next = current.map((img, index) => {
      if (img.label.trim()) return img;
      const suggestion = labelSuggestion(colorSuggestions, index);
      return suggestion ? { ...img, label: suggestion } : img;
    });

    if (next.some((img, i) => img.label !== current[i].label)) {
      onChange(next);
    }
  }, [colorSuggestions, onChange]);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;

    const remaining = maxImages - images.length;
    const picked = Array.from(files).slice(0, remaining);
    const accepted: File[] = [];

    for (const file of picked) {
      if (file.size > MAX_UPLOAD_BYTES) {
        onReject?.(
          `"${file.name}" is too large. Each image must be ${formatMaxUploadSize()} or less. Try a smaller photo from your gallery.`
        );
        continue;
      }
      accepted.push(file);
    }

    if (!accepted.length) return;

    const startIndex = images.length;
    const next = accepted.map((file, index) => {
      const absoluteIndex = startIndex + index;
      return {
        id: nextId(),
        file,
        preview: URL.createObjectURL(file),
        role: roleForIndex(absoluteIndex, appendOnly),
        label: labelSuggestion(colorSuggestions, absoluteIndex),
      };
    });

    onChange(
      [...images, ...next].map((img, index) => ({
        ...img,
        role: roleForIndex(index, appendOnly),
      }))
    );
    if (inputRef.current) inputRef.current.value = '';
  };

  const updateLabel = (id: string, label: string) => {
    onChange(images.map((img) => (img.id === id ? { ...img, label } : img)));
  };

  const removeImage = (id: string) => {
    const target = images.find((img) => img.id === id);
    if (target) URL.revokeObjectURL(target.preview);
    onChange(
      images
        .filter((img) => img.id !== id)
        .map((img, index) => ({ ...img, role: roleForIndex(index, appendOnly) }))
    );
  };

  return (
    <div>
      <span className={ADMIN_LABEL}>Product images *</span>
      <p className="text-[9px] font-bold text-black/40 uppercase tracking-wider mb-3">
        Add one photo per angle or color (up to {maxImages}). Max {formatMaxUploadSize()} each.
        {appendOnly
          ? ' New photos are added as extra views on the product page.'
          : ' First photo is the main view, second is the next angle — all others appear as thumbnails.'}
      </p>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {images.map((img) => (
            <div key={img.id} className="border border-black/15 bg-white">
              <div className="relative aspect-square bg-black/[0.03]">
                <img
                  src={img.preview}
                  alt="Product preview"
                  className="w-full h-full object-contain p-1"
                />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 min-h-[32px] min-w-[32px] flex items-center justify-center bg-black/75 text-white hover:bg-black"
                  aria-label="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-2 border-t border-black/10 space-y-2">
                <label className="block">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-black/45">
                    View label *
                  </span>
                  <input
                    type="text"
                    value={img.label}
                    onChange={(e) => updateLabel(img.id, e.target.value)}
                    placeholder={labelSuggestion(colorSuggestions, images.indexOf(img)) || 'e.g. Black'}
                    className="mt-1 w-full border border-black/15 bg-white px-2 py-2 min-h-[40px] text-[10px] font-bold text-black placeholder:text-black/30"
                    required
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => addFiles(e.target.files)}
        disabled={images.length >= maxImages}
      />
      <label
        htmlFor={inputId}
        className={cn(
          'inline-flex items-center justify-center gap-2 border border-dashed border-black/25 px-4 py-3 min-h-[48px] text-[9px] font-bold tracking-[0.12em] uppercase cursor-pointer hover:border-black/40 hover:bg-black/[0.02] transition-colors',
          images.length >= maxImages && 'opacity-40 pointer-events-none'
        )}
      >
        <ImagePlus className="w-4 h-4 shrink-0" />
        {images.length === 0 ? 'Add images' : 'Add more images'}
      </label>
      {images.length >= maxImages && (
        <p className="text-[8px] font-bold uppercase text-black/35 mt-2">
          Maximum {maxImages} images
        </p>
      )}
    </div>
  );
};

export default ProductImagePicker;
