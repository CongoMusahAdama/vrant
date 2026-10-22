import HomeHeader from '@/components/home/HomeHeader';
import HomeHero from '@/components/home/HomeHero';
import TrendingRail from '@/components/home/TrendingRail';
import ShopTheLook from '@/components/home/ShopTheLook';
import CustomDesignBanner from '@/components/home/CustomDesignBanner';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/ui/scroll-to-top';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import { useSeo } from '@/lib/seo';

const Index = () => {
  useSeo();
  return (
    <div className="min-h-screen bg-white overflow-x-hidden selection:bg-black selection:text-white">
      <HomeHeader />
      <main>
        <HomeHero />
        <TrendingRail />
        <CustomDesignBanner />
        <ShopTheLook />
      </main>
      <Footer />
      <ScrollToTop />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
