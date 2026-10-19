import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from '@/components/navigation/Header';
import Footer from '@/components/layout/Footer';
import PaymentMethods from '@/components/layout/PaymentMethods';
import ScrollToTop from '@/components/ui/scroll-to-top';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { SOCIAL_LINKS } from '@/lib/social';
import { SITE_HEADER_OFFSET_PT, HEADER_OFFSET_SCROLL_MT, PAGE_X } from '@/lib/page-layout';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { cn } from '@/lib/utils';

const sectionClass = `mb-20 md:mb-24 ${HEADER_OFFSET_SCROLL_MT}`;
const headingClass = 'text-[11px] md:text-xs font-bold tracking-[0.25em] uppercase mb-8';
const subheadingClass = 'text-[10px] md:text-[11px] font-bold tracking-[0.2em] uppercase mb-4 text-black';
const bodyClass = 'text-[11px] md:text-xs font-bold tracking-[0.08em] uppercase leading-[1.9] text-black/80 max-w-xl mx-auto';
const listClass =
  'text-left max-w-md mx-auto space-y-3 list-none text-[11px] md:text-xs font-bold tracking-[0.08em] uppercase leading-[1.9] text-black/80';

const bullet = (text: string) => (
  <li className="flex gap-2">
    <span className="text-black/40 shrink-0" aria-hidden>
      *
    </span>
    <span>{text}</span>
  </li>
);

const Shipping = () => {
  const location = useLocation();
  const { storeEmail } = useSiteSettings();

  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() => {
        const el = document.querySelector(location.hash);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen bg-white text-black overflow-x-hidden">
      <Header variant="solid" />
      <ScrollToTop />

      <main className={cn('w-full', SITE_HEADER_OFFSET_PT, 'pb-20', PAGE_X)}>
        <div className="max-w-2xl mx-auto text-center">
          <section id="shipping" className={sectionClass}>
            <ScrollReveal variant="fade-up">
              <h1 className={`${headingClass} text-sm md:text-base`}>Shipping</h1>
              <div className={`${bodyClass} space-y-10`}>
                <div>
                  <h2 className={subheadingClass}>Ghana Orders</h2>
                  <p className="mb-4">
                    Orders are processed within 24 hours after payment confirmation.
                  </p>
                  <ul className={listClass}>
                    {bullet('Delivery: 1–3 business days')}
                    {bullet('Orders on weekends/holidays are processed next business day')}
                    {bullet('Delivery updates will be sent after dispatch')}
                  </ul>
                </div>

                <div>
                  <h2 className={subheadingClass}>International Orders</h2>
                  <p className="mb-4">
                    We ship via EMS to the UK, US and selected countries.
                  </p>
                  <ul className={listClass}>
                    {bullet('Delivery: 7–14 business days')}
                    {bullet('Orders processed within 24 hours after payment')}
                    {bullet('Tracking provided after shipment')}
                  </ul>
                </div>

                <p className="text-[10px] tracking-[0.06em] text-black/50 normal-case font-normal leading-[1.85]">
                  Customs fees, duties, or taxes (if any) are the customer&apos;s responsibility.
                </p>
              </div>
            </ScrollReveal>
          </section>

          <section id="returns" className={sectionClass}>
            <ScrollReveal variant="fade-up" delay={80}>
              <h2 className={headingClass}>Returns</h2>
              <div className={`${bodyClass} space-y-6`}>
                <p>
                  All sales are final unless there&apos;s an error on our side.
                </p>
                <ul className={listClass}>
                  {bullet('Items must be new, unused, and in original packaging')}
                  {bullet('Refunds are processed within 3–5 days after inspection')}
                  {bullet('Shipping fees, duties & taxes are non-refundable')}
                </ul>
              </div>
            </ScrollReveal>
          </section>

          <ScrollReveal variant="fade-up" delay={120}>
            <nav className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mb-10">
              <Link
                to="/privacy"
                className="text-[10px] font-bold tracking-[0.2em] uppercase hover:opacity-50 transition-opacity"
              >
                Privacy
              </Link>
              <Link
                to="/shipping"
                className="text-[10px] font-bold tracking-[0.2em] uppercase hover:opacity-50 transition-opacity"
              >
                Shipping
              </Link>
              <a
                href={`mailto:${storeEmail}`}
                className="text-[10px] font-bold tracking-[0.2em] uppercase hover:opacity-50 transition-opacity"
              >
                Contact
              </a>
            </nav>

            <div className="flex justify-center gap-6 mb-12">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold tracking-[0.15em] uppercase text-black/40 hover:text-black transition-colors"
                >
                  {social.shortLabel}
                </a>
              ))}
            </div>

            <PaymentMethods className="mb-4" />
          </ScrollReveal>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Shipping;
