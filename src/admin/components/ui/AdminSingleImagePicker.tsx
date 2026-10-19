import { useEffect, useId, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { ADMIN_LABEL } from '@/admin/lib/apiForm';
import { cn } from '@/lib/utils';

type AdminSingleImagePickerProps = {
  file: File | null;
  preview: string | null;
  onChange: (file: File | null, preview: string | null) => void;
  label?: string;
  hint?: string;
  required?: boolean;
};

const AdminSingleImagePicker = ({
  file,
  preview,
  onChange,
  label = 'Image *',
  hint,
  required,
}: AdminSingleImagePickerProps) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef(preview);

  useEffect(() => {
    previewRef.current = preview;
  });

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    onChange(null, null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const pickFile = (files: FileList | null) => {
    const next = files?.[0];
    if (!next) return;
    if (preview) URL.revokeObjectURL(preview);
    onChange(next, URL.createObjectURL(next));
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <span className={ADMIN_LABEL}>{label}</span>
      {hint ? (
        <p className="text-[9px] font-bold text-black/40 uppercase tracking-wider mb-3">{hint}</p>
      ) : null}

      {preview && file ? (
        <div className="border border-black/15 bg-white mb-3 max-w-[200px]">
          <div className="relative aspect-[4/5] bg-black/[0.03]">
            <img src={preview} alt="Preview" className="w-full h-full object-contain p-1" />
            <button
              type="button"
              onClick={clear}
              className="absolute top-1 right-1 min-h-[32px] min-w-[32px] flex items-center justify-center bg-black/75 text-white hover:bg-black"
              aria-label="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        required={required && !file}
        onChange={(e) => pickFile(e.target.files)}
      />
      <label
        htmlFor={inputId}
        className={cn(
          'inline-flex items-center justify-center gap-2 border border-dashed border-black/25 px-4 py-3 min-h-[48px] text-[9px] font-bold tracking-[0.12em] uppercase cursor-pointer hover:border-black/40 hover:bg-black/[0.02] transition-colors'
        )}
      >
        <ImagePlus className="w-4 h-4 shrink-0" />
        {file ? 'Change image' : 'Choose image'}
      </label>
    </div>
  );
};

export default AdminSingleImagePicker;
