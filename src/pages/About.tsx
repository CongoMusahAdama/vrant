import Header from '@/components/navigation/Header';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/ui/scroll-to-top';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { SITE_HEADER_OFFSET_PT, PAGE_X } from '@/lib/page-layout';
import { cn } from '@/lib/utils';

const About = () => {
  const { aboutEyebrow, aboutTitle, aboutParagraphs, loading } = useSiteSettings();

  return (
    <div className="min-h-screen bg-white text-black overflow-x-hidden">
      <Header variant="solid" />

      <main className={cn('w-full', SITE_HEADER_OFFSET_PT, 'pb-20', PAGE_X)}>
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal variant="fade-up">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-black/40 mb-3">
              {aboutEyebrow}
            </p>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-[0.12em] uppercase text-black mb-10 md:mb-14">
              {aboutTitle}
            </h1>
          </ScrollReveal>

          {loading ? (
            <p className="text-[10px] font-bold uppercase text-black/40 animate-pulse">Loading…</p>
          ) : (
            <ScrollReveal variant="fade-up" delay={0.1}>
              <div className="text-[11px] md:text-xs font-bold tracking-[0.08em] uppercase leading-[1.9] text-black/80 space-y-6">
                {aboutParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </ScrollReveal>
          )}
        </div>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default About;
