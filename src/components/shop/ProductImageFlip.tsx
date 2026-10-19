import { useState, useCallback, useEffect } from 'react';
import { FlipHorizontal2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
type ProductImageFlipProps = {
  images: string[];
  /** Optional labels aligned with images (from admin product form) */
  labels?: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  /** Controlled index (product page + thumbnails) */
  index?: number;
  onIndexChange?: (index: number) => void;
  /** Show flip / arrow controls */
  showControls?: boolean;
  /** Front / Back badge on image */
  showViewLabel?: boolean;
  /** Dots under image */
  showIndicators?: boolean;
  /** Hover swaps front ↔ back on grid cards (desktop) */
  enableHoverFlip?: boolean;
};

const ProductImageFlip = ({
  images,
  labels,
  alt,
  className,
  imageClassName,
  index: controlledIndex,
  onIndexChange,
  showControls = true,
  showViewLabel = true,
  showIndicators = true,
  enableHoverFlip = false,
}: ProductImageFlipProps) => {
  const [internalIndex, setInternalIndex] = useState(0);
  const [hovering, setHovering] = useState(false);

  const isControlled = controlledIndex !== undefined;
  const activeIndex = isControlled ? controlledIndex : internalIndex;
  const setIndex = useCallback(
    (next: number) => {
      const wrapped = images.length ? ((next % images.length) + images.length) % images.length : 0;
      if (isControlled) onIndexChange?.(wrapped);
      else setInternalIndex(wrapped);
    },
    [images.length, isControlled, onIndexChange]
  );

  useEffect(() => {
    if (isControlled) return;
    setInternalIndex(0);
  }, [images, isControlled]);

  if (!images.length) return null;

  const displayIndex =
    enableHoverFlip && hovering && images.length >= 2 && activeIndex === 0
      ? 1
      : activeIndex;

  const flip = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex(activeIndex + 1);
  };

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex(activeIndex - 1);
  };

  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex(activeIndex + 1);
  };

  const canFlip = images.length > 1;

  return (
    <div
      className={cn(
        'relative w-full h-full flex items-center justify-center overflow-hidden',
        className
      )}
      onMouseEnter={() => enableHoverFlip && setHovering(true)}
      onMouseLeave={() => enableHoverFlip && setHovering(false)}
    >
      <img
        key={images[displayIndex]}
        src={images[displayIndex]}
        alt={alt}
        className={cn(
          'block max-h-full max-w-full w-auto h-auto object-contain object-center transition-opacity duration-500 ease-out',
          imageClassName
        )}
        loading="lazy"
        draggable={false}
      />

      {canFlip && showViewLabel && labels?.[displayIndex]?.trim() ? (
        <span className="absolute top-2 left-2 z-[5] bg-white/95 border border-black/10 px-2 py-1 text-[8px] font-bold tracking-[0.15em] uppercase text-black pointer-events-none">
          {labels[displayIndex]}
        </span>
      ) : null}

      {canFlip && showControls && (
        <div className="absolute bottom-2 right-2 z-[5] flex items-center gap-1 pointer-events-auto">
          {images.length > 2 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Previous view"
                className="h-8 w-8 flex items-center justify-center bg-white border border-black/20 hover:border-black transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next view"
                className="h-8 w-8 flex items-center justify-center bg-white border border-black/20 hover:border-black transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={flip}
            aria-label="Flip product image"
            className="h-8 px-2.5 flex items-center gap-1 bg-black text-white text-[8px] font-bold tracking-[0.12em] uppercase hover:bg-black/90 transition-colors"
          >
            <FlipHorizontal2 className="w-3.5 h-3.5" />
            Flip
          </button>
        </div>
      )}

      {canFlip && showIndicators && images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[5] flex gap-1 pointer-events-none">
          {images.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1 w-1 rounded-full transition-colors',
                i === displayIndex ? 'bg-black' : 'bg-black/25'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageFlip;
