import { Link } from 'react-router-dom';
import Header from '@/components/navigation/Header';
import Footer from '@/components/layout/Footer';
import PaymentMethods from '@/components/layout/PaymentMethods';
import ScrollToTop from '@/components/ui/scroll-to-top';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { SITE_HEADER_OFFSET_PT, PAGE_X } from '@/lib/page-layout';
import { useSeo } from '@/lib/seo';

const Privacy = () => {
  useSeo({ title: 'Privacy policy' });
  const { storeEmail } = useSiteSettings();
  return (
    <div className="min-h-screen bg-white text-black">
      <Header variant="solid" />
      <ScrollToTop />

      <main className={`w-full ${SITE_HEADER_OFFSET_PT} pb-20 ${PAGE_X}`}>
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-[11px] md:text-xs font-bold tracking-[0.25em] uppercase mb-8">
            Privacy
          </h1>
          <div className="text-[11px] md:text-xs font-bold tracking-[0.08em] uppercase leading-[1.9] text-black/80 max-w-xl mx-auto space-y-6 mb-20">
            <p>
              VRANT respects your privacy. We collect only the information needed to process
              orders, communicate with you, and improve your experience — such as name, email,
              phone number, and delivery address when you checkout or contact us.
            </p>
            <p>
              We do not sell your personal data. Information may be shared with payment and
              shipping partners solely to fulfill your order. You may request access or deletion
              of your data by emailing{' '}
              <a href={`mailto:${storeEmail}`} className="underline hover:opacity-60">
                {storeEmail}
              </a>
              .
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mb-12">
            <Link
              to="/privacy"
              className="text-[10px] font-bold tracking-[0.2em] uppercase hover:opacity-50"
            >
              Privacy
            </Link>
            <Link
              to="/shipping"
              className="text-[10px] font-bold tracking-[0.2em] uppercase hover:opacity-50"
            >
              Shipping
            </Link>
            <a
              href={`mailto:${storeEmail}`}
              className="text-[10px] font-bold tracking-[0.2em] uppercase hover:opacity-50"
            >
              Contact
            </a>
          </nav>

          <PaymentMethods />
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Privacy;
