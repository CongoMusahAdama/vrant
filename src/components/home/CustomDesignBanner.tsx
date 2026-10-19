import { Link } from 'react-router-dom';
import ScrollReveal from '@/components/ui/ScrollReveal';

/** Home-page call to action for made-to-order designs */
const CustomDesignBanner = () => (
  <section className="px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
    <ScrollReveal variant="fade-up">
      <div className="grid md:grid-cols-2 bg-army-green text-white overflow-hidden">
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[420px] order-1 md:order-2">
          <img
            src="/lookbook/look-25.jpg"
            alt="Made-to-order VRANT set"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="order-2 md:order-1 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/70 mb-3">Made for you</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-[0.06em] uppercase text-white leading-tight mb-4">
            Bring your own design
          </h2>
          <p className="text-[11px] sm:text-xs font-bold tracking-[0.06em] uppercase leading-[1.9] text-white/80 mb-8 max-w-md">
            Have a style in mind? Send us your sketch or inspiration photo — our tailors in Takoradi will make it just
            for you.
          </p>
          <div>
            <Link
              to="/custom-design"
              className="inline-flex items-center h-12 px-7 bg-white text-army-green text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-white/90 transition-colors"
            >
              Start your design
            </Link>
          </div>
        </div>
      </div>
    </ScrollReveal>
  </section>
);

export default CustomDesignBanner;
