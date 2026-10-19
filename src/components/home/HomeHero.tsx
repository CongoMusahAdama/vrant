import { Link } from 'react-router-dom';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';


/** Short pause so the entrance plays once the page has painted */
const BASE_DELAY_MS = 150;

/**
 * One photo: fades in from a slight zoom and settles at exactly 1:1 scale.
 * No continuous zoom afterwards — permanent scaling keeps the browser resampling
 * the image, which visibly softens it.
 */
const HeroPanel = ({
  src,
  alt = '',
  delayMs = 0,
  className = '',
  priority = false,
}: {
  src: string;
  alt?: string;
  delayMs?: number;
  className?: string;
  priority?: boolean;
}) => (
  <div
    className={`relative overflow-hidden animate-hero-in motion-reduce:animate-none ${className}`}
    style={{ animationDelay: `${BASE_DELAY_MS + delayMs}ms` }}
  >
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={priority ? 'sync' : 'async'}
    />
  </div>
);

const rise = (delayMs: number) => ({ animationDelay: `${BASE_DELAY_MS + delayMs}ms` });

const HomeHero = () => {
  const { heroImageSrc, heroLeftSrc, heroRightSrc, heroImageAlt } = useSiteSettings();

  return (
    <section className="relative h-[92svh] min-h-[560px] max-h-[1000px] w-full overflow-hidden bg-[#1f1f1f]">
      {/* Mobile: one full portrait image */}
      <HeroPanel
        src={heroImageSrc}
        alt={heroImageAlt}
        priority
        className="md:hidden absolute inset-0 [&_img]:object-[center_40%]"
      />

      {/* Desktop: three admin-set portrait panels, revealed left to right */}
      <div className="hidden md:grid absolute inset-0 grid-cols-3">
        <HeroPanel src={heroLeftSrc} delayMs={0} className="[&_img]:object-top" />
        <HeroPanel src={heroImageSrc} alt={heroImageAlt} delayMs={180} priority />
        <HeroPanel src={heroRightSrc} delayMs={360} className="[&_img]:object-top" />
      </div>

      {/* Light at the top for the header, deeper at the bottom where the copy sits — faces stay clear */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 px-5 sm:px-8 lg:px-12 pb-10 sm:pb-12 lg:pb-16">
        <div className="max-w-lg text-left text-white">
          <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.3em] uppercase text-white/75 mb-3 sm:mb-4 animate-rise-in motion-reduce:animate-none" style={rise(700)}>
            New collection · Takoradi, Ghana
          </p>
          <h1 className="text-[1.75rem] sm:text-4xl lg:text-5xl font-bold normal-case tracking-tight text-white leading-[1.1] mb-0 animate-rise-in motion-reduce:animate-none" style={rise(850)}>
            The VRANT Collection
          </h1>
          <p className="mt-3 sm:mt-4 max-w-sm text-xs sm:text-sm font-normal normal-case tracking-normal text-white/80 leading-relaxed animate-rise-in motion-reduce:animate-none" style={rise(1000)}>
            Ghanaian heritage, modern form — clothing, denim and footwear made in Ghana.
          </p>
          <div className="mt-6 flex items-center gap-5 animate-rise-in motion-reduce:animate-none" style={rise(1150)}>
            <Link
              to="/products"
              className="inline-flex items-center h-11 px-6 bg-white text-black text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-white/90 transition-colors"
            >
              Shop the collection
            </Link>
            <Link
              to="/gallery"
              className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-white underline underline-offset-[6px] decoration-white/60 hover:decoration-white"
            >
              Lookbook
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
