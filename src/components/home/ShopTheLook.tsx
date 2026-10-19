import { useEffect, useMemo, useState } from 'react';
import { useShopCatalog } from '@/contexts/ShopCatalogContext';
import { VRANT_LOOKS } from '@/data/vrant-collection';
import RailProductCard from '@/components/home/RailProductCard';
import RailArrows from '@/components/home/RailArrows';
import { cn } from '@/lib/utils';

const SLIDE_MS = 3500;

const ShopTheLook = () => {
  const { products: catalog } = useShopCatalog();
  const [index, setIndex] = useState(0);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  /** Only looks whose products exist in the live catalog (matched by name, case-insensitive) */
  const looks = useMemo(() => {
    const byName = new Map(catalog.map((p) => [p.name.trim().toLowerCase(), p]));
    return VRANT_LOOKS.map((look) => ({
      ...look,
      products: look.products
        .map((name) => byName.get(name.toLowerCase()))
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    })).filter((look) => look.products.length > 0);
  }, [catalog]);

  const look = looks.length > 0 ? looks[index % looks.length] : null;
  const imageCount = look?.images.length ?? 0;

  // Restart the photo carousel whenever the look changes
  useEffect(() => setSlide(0), [index]);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (imageCount < 2 || paused || reduceMotion) return;
    const timer = window.setInterval(() => setSlide((s) => (s + 1) % imageCount), SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [imageCount, paused, index]);

  if (!look) return null;

  const step = (dir: 1 | -1) => setIndex((i) => (i + dir + looks.length) % looks.length);

  return (
    <section className="py-10 sm:py-14">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 mb-5">
        <h2 className="text-2xl sm:text-3xl font-medium normal-case tracking-tight text-black">
          Shop the look
        </h2>
        {looks.length > 1 && <RailArrows onPrev={() => step(-1)} onNext={() => step(1)} />}
      </div>

      <div className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-6 md:gap-8 px-4 sm:px-6 lg:px-10 items-center">
        <div
          className="relative aspect-[4/5] md:aspect-auto md:h-[min(80vh,760px)] overflow-hidden bg-[#f2f2f2]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {look.images.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={i === slide ? look.title : ''}
              loading="lazy"
              className={cn(
                'absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out',
                i === slide ? 'opacity-100' : 'opacity-0'
              )}
            />
          ))}

          {imageCount > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {look.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSlide(i)}
                  aria-label={`Show photo ${i + 1}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === slide ? 'w-6 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/90'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium normal-case tracking-normal text-black mb-1">{look.title}</p>
          <p className="text-xs font-normal normal-case tracking-normal text-black/50 mb-5">
            {look.products.length} {look.products.length === 1 ? 'piece' : 'pieces'} in this look
          </p>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none">
            {look.products.map((p) => (
              <RailProductCard key={p.id} product={p} className="w-[46%] sm:w-[44%] lg:w-[42%]" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShopTheLook;
