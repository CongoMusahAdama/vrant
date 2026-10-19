import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

/** Craftsmanship close-ups: what "made for you" actually means */
const DETAILS = [
  { src: '/products/abstract-bib-kaftan-2.jpg', alt: 'Hand-cut print bib on the Abstract Bib Kaftan', label: 'Hand-cut print' },
  { src: '/products/ember-diamond-zip-set-2.jpg', alt: 'Diamond pintucks and rhinestone zip', label: 'Pintuck detail' },
];

const STEPS = ['Share your idea', 'We confirm fit & price', 'Made by hand in Takoradi'];

/** Home-page call to action for made-to-order designs */
const CustomDesignBanner = () => (
  <section className="px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
    <ScrollReveal variant="fade-up">
      <div className="grid lg:grid-cols-[1fr_1.1fr] bg-army-green text-white overflow-hidden">
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-16">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/60 mb-4">
            Bespoke · Made to order
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-[2.1rem] font-bold tracking-[0.05em] uppercase text-white leading-[1.15] mb-5">
            Bring your
            <br />
            own design
          </h2>
          <p className="text-[11px] sm:text-xs font-bold tracking-[0.06em] uppercase leading-[1.9] text-white/75 mb-8 max-w-md">
            Send us a sketch, a photo or just an idea. Our tailors turn it into a piece that is entirely yours.
          </p>

          <ol className="mb-10 border-t border-white/15">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-baseline gap-4 py-3 border-b border-white/15">
                <span className="text-[10px] font-bold tracking-[0.2em] text-white/45 tabular-nums">0{i + 1}</span>
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase text-white/90">{step}</span>
              </li>
            ))}
          </ol>

          <div>
            <Link
              to="/custom-design"
              className="group inline-flex items-center gap-3 h-12 px-7 bg-white text-army-green text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-white/90 transition-colors"
            >
              Start your design
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-white/15 min-h-[320px] sm:min-h-[420px]">
          {DETAILS.map((d) => (
            <figure key={d.src} className="relative overflow-hidden bg-black/20">
              <img src={d.src} alt={d.alt} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              <figcaption className="absolute left-0 bottom-0 m-3 sm:m-4 bg-white/95 text-army-green px-2.5 py-1 text-[8px] sm:text-[9px] font-bold tracking-[0.2em] uppercase">
                {d.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </ScrollReveal>
  </section>
);

export default CustomDesignBanner;
