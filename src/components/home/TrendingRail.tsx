import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useShopCatalog } from '@/contexts/ShopCatalogContext';
import { NEW_ARRIVALS_SECTION_ID } from '@/lib/scroll-to';
import RailProductCard from '@/components/home/RailProductCard';
import type { ShopProduct } from '@/data/products';

/** Each row repeats the catalog until it is long enough to glide across the screen */
const MIN_PER_ROW = 10;
/** Share of the row's spare width travelled while the section crosses the viewport */
const TRAVEL = 0.85;
/** Easing factor per frame — lower is smoother */
const EASE = 0.1;

function fillRow(items: ShopProduct[]) {
  if (items.length === 0) return [];
  return Array.from({ length: Math.ceil(MIN_PER_ROW / items.length) }, () => items).flat();
}

const cardWidth = 'w-[44vw] sm:w-[30vw] md:w-[23vw] lg:w-[17vw] xl:w-[15vw]';

/** Two rows that glide in opposite directions as the page scrolls */
const TrendingRail = () => {
  const { products } = useShopCatalog();
  const sectionRef = useRef<HTMLElement>(null);
  const rowA = useRef<HTMLDivElement>(null);
  const rowB = useRef<HTMLDivElement>(null);

  const base = products.slice(0, 16);
  const half = Math.ceil(base.length / 2);
  const top = fillRow(base.length > 3 ? base.slice(0, half) : base);
  const bottom = fillRow(base.length > 3 ? [...base.slice(half), ...base.slice(0, 1)].reverse() : base);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let current = 0;
    let frame = 0;
    let visible = false;

    const progress = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      return Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
    };

    const tick = () => {
      const target = progress();
      current += (target - current) * EASE;
      [rowA.current, rowB.current].forEach((row, i) => {
        if (!row) return;
        const spare = Math.max(0, row.scrollWidth - row.parentElement!.clientWidth) * TRAVEL;
        // Row A drifts left, row B drifts right
        const x = i === 0 ? -current * spare : -spare + current * spare;
        row.style.transform = `translate3d(${x}px, 0, 0)`;
      });
      if (visible || Math.abs(target - current) > 0.001) frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frame);
      if (visible) frame = requestAnimationFrame(tick);
    });
    observer.observe(section);
    current = progress();
    tick();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [products.length]);

  if (base.length === 0) return null;

  const renderRow = (items: ShopProduct[], ref: React.RefObject<HTMLDivElement>, key: string) => (
    <div className="overflow-hidden">
      <div ref={ref} className="flex gap-3 sm:gap-4 w-max will-change-transform px-4 sm:px-6 lg:px-10">
        {items.map((p, i) => (
          <RailProductCard key={`${key}-${p.id}-${i}`} product={p} className={cardWidth} />
        ))}
      </div>
    </div>
  );

  return (
    <section ref={sectionRef} id={NEW_ARRIVALS_SECTION_ID} className="scroll-mt-28 py-10 sm:py-14 overflow-hidden">
      <div className="flex items-end justify-between px-4 sm:px-6 lg:px-10 mb-6">
        <h2 className="text-[15px] sm:text-base font-medium normal-case tracking-normal text-black mb-0">
          Trending now
        </h2>
        <Link
          to="/products"
          className="text-[10px] font-bold tracking-[0.2em] uppercase text-black underline underline-offset-[6px] decoration-black/30 hover:decoration-army-green hover:text-army-green"
        >
          View all
        </Link>
      </div>

      <div className="space-y-8 sm:space-y-10">
        {renderRow(top, rowA, 'a')}
        {renderRow(bottom, rowB, 'b')}
      </div>
    </section>
  );
};

export default TrendingRail;
