import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { useShopCatalog } from '@/contexts/ShopCatalogContext';
import { sortShopProductsNewestFirst } from '@/lib/shop-catalog';
import { NEW_ARRIVALS_HASH } from '@/lib/scroll-to';

/** Pause after load so the page paints (and the hero plays) before the pop-up */
const OPEN_DELAY_MS = 1400;
const SHOW_COUNT = 3;

/** Pages where a promo pop-up would get in the way */
const SKIP_PATHS = ['/admin', '/account', '/cart', '/payment', '/reset-password', '/custom-design'];

/**
 * "New drops" pop-up, shown once per page load (visit or refresh) on storefront pages.
 * Mounted once at the app root, so moving between pages doesn't bring it back.
 */
const NewDropsModal = () => {
  const { products, loading } = useShopCatalog();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const decided = useRef(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Decide once, based on the page the visitor landed on
  useEffect(() => {
    if (decided.current || loading || products.length === 0) return;
    decided.current = true;
    if (SKIP_PATHS.some((p) => pathname.startsWith(p))) return;
    const timer = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, products.length]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Leaving for another page (e.g. tapping a product) closes it
  useEffect(() => {
    if (open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) return null;

  const drops = sortShopProductsNewestFirst(products).slice(0, SHOW_COUNT);
  const [hero] = drops;

  return createPortal(
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-drops-title"
    >
      <div
        className="relative w-full max-w-[820px] max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white shadow-2xl flex flex-col md:grid md:grid-cols-[1fr_1.05fr] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-white/90 text-black hover:bg-white"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lead image */}
        <Link to={`/products/${hero.id}`} className="relative block shrink-0 aspect-[16/10] md:aspect-auto md:min-h-[460px] bg-[#f2f2f2] overflow-hidden group">
          <img
            src={hero.frontImage}
            alt={hero.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <span className="absolute left-4 top-4 bg-army-green text-white text-[9px] font-bold tracking-[0.25em] uppercase px-2.5 py-1">
            Just in
          </span>
        </Link>

        {/* Copy + list */}
        <div className="flex flex-col px-6 py-7 sm:px-8 sm:py-9">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-army-green mb-3">New drops</p>
          <h2 id="new-drops-title" className="text-xl sm:text-2xl font-bold tracking-[0.08em] uppercase text-black leading-tight mb-2">
            Fresh from the studio
          </h2>
          <p className="text-[10px] font-bold tracking-[0.06em] uppercase text-black/45 leading-relaxed mb-6">
            The latest pieces, cut and finished in Takoradi.
          </p>

          <ul className="divide-y divide-black/10 border-y border-black/10 mb-7">
            {drops.map((p) => (
              <li key={p.id}>
                <Link to={`/products/${p.id}`} className="flex items-center gap-4 py-3 group">
                  <span className="w-14 h-[72px] shrink-0 bg-[#f2f2f2] overflow-hidden">
                    <img src={p.frontImage} alt="" className="w-full h-full object-cover" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[10px] sm:text-[11px] font-bold tracking-[0.15em] uppercase text-black truncate group-hover:text-army-green transition-colors">
                      {p.name}
                    </span>
                    <span className="block text-[11px] font-bold text-black/50 mt-1">{p.price}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-black/30 group-hover:text-army-green group-hover:translate-x-0.5 transition-all" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-col sm:flex-row gap-3">
            <Link
              to={`/${NEW_ARRIVALS_HASH}`}
              onClick={() => setOpen(false)}
              className="w-full sm:flex-1 inline-flex items-center justify-center h-12 shrink-0 bg-army-green text-white text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-army-green-light transition-colors"
            >
              Shop new in
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full sm:flex-1 h-12 shrink-0 border border-black/20 text-[10px] font-bold tracking-[0.2em] uppercase text-black/70 hover:border-black hover:text-black transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NewDropsModal;
