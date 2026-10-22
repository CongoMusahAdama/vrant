import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { isLegacyLocalUpload, productImageUrl } from '@/lib/productImage';
import Header from '@/components/navigation/Header';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/ui/scroll-to-top';
import ErrorBoundary from '@/components/ui/error-boundary';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { SITE_HEADER_OFFSET_PT, PAGE_X } from '@/lib/page-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VRANT_LOOKBOOK } from '@/data/vrant-collection';
import { useSeo } from '@/lib/seo';

interface GalleryItem {
  id: string;
  name: string;
  image: string;
  category: string;
  caption: string;
}

const Gallery = () => {
  useSeo({ title: 'Lookbook', description: 'The VRANT Innovations lookbook — diamond sets, kaftans, panel shirts and suede slides, styled in Takoradi.' });
  const [filter, setFilter] = useState('all');
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiFetch<{
      success: boolean;
      data: { items: { _id: string; name: string; image: string; category: string; caption?: string }[] };
    }>('/api/gallery')
      .then((res) => {
        if (cancelled) return;
        const apiItems = res.data.items
          .filter((item) => item.image && !isLegacyLocalUpload(item.image))
          .map((item) => ({
            id: item._id,
            name: item.name,
            image: productImageUrl(item.image),
            category: item.category,
            caption: item.caption || '',
          }));
        setImages(apiItems.length > 0 ? apiItems : VRANT_LOOKBOOK);
      })
      .catch(() => {
        if (!cancelled) setImages(VRANT_LOOKBOOK);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'lookbook', label: 'Lookbook' },
    { key: 'sets', label: 'Two-Piece Sets' },
    { key: 'shirts', label: 'Shirts' },
    { key: 'jeans', label: 'Jeans' },
    { key: 'footwear', label: 'Footwear' },
  ];

  const filteredImages =
    filter === 'all' ? images : images.filter((image) => image.category === filter);

  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
  }, []);

  const handleShopClick = useCallback(() => {
    navigate('/products');
  }, [navigate]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Header variant="solid" />

        <main className={`w-full ${SITE_HEADER_OFFSET_PT}`}>
          <section className="py-8 sm:py-10 md:py-14 bg-white">
            <div className="container mx-auto px-4 sm:px-6">
              <ScrollReveal variant="fade-up" className="text-center">
                <h1 className="heading-display text-xl sm:text-2xl md:text-3xl text-black mb-4">
                  Gallery
                </h1>
                <p className="text-[12px] font-bold text-black/70 max-w-2xl mx-auto leading-[1.7]">
                  Ghanaian heritage, worn the modern way. Looks from the VRANT studio and the people who wear us.
                </p>
              </ScrollReveal>
            </div>
          </section>

          <section className="py-6 sm:py-8">
            <div className="container mx-auto px-4 sm:px-6">
              <ScrollReveal
                variant="fade-up"
                delay={100}
                className="flex flex-wrap justify-center gap-3 sm:gap-4 overflow-x-auto scrollbar-none pb-2"
              >
                {categories.map((category) => (
                  <Button
                    key={category.key}
                    variant={filter === category.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange(category.key)}
                    className="transition-all duration-200"
                  >
                    {category.label}
                  </Button>
                ))}
              </ScrollReveal>
            </div>
          </section>

          <section className="py-8 sm:py-12">
            <div className="container mx-auto px-4 sm:px-6">
              {loading ? (
                <p className="text-center py-16 text-[10px] font-bold tracking-[0.2em] uppercase text-black/40 animate-pulse">
                  Loading gallery…
                </p>
              ) : filteredImages.length === 0 ? (
                <ScrollReveal variant="fade" className="text-center py-16 border border-dashed border-black/15 max-w-lg mx-auto px-6">
                  <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-black/50 mb-2">
                    Gallery coming soon
                  </p>
                  <p className="text-[10px] font-bold text-black/40 uppercase tracking-wider leading-relaxed">
                    New lookbook photos are on the way. Check back soon or shop the collection.
                  </p>
                  <Button
                    size="sm"
                    className="mt-6 bg-army-green hover:bg-army-green/90 text-white"
                    onClick={handleShopClick}
                  >
                    Shop now
                  </Button>
                </ScrollReveal>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
                  {filteredImages.map((item, index) => (
                    <ScrollReveal key={item.id} variant="product" delay={index * 80}>
                      <div className="group">
                        <div className="bg-card overflow-hidden border border-black/10 transition-all duration-500 hover:-translate-y-1 active:scale-[0.99]">
                          <div className="aspect-[4/5] overflow-hidden relative">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder.svg';
                              }}
                            />

                            <Badge className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-army-green text-white text-[9px] sm:text-xs px-2 sm:px-2.5">
                              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                            </Badge>

                            <div className="hidden sm:flex absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-end">
                              <div className="p-6 text-white">
                                <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                                <p className="text-sm text-white/90 leading-relaxed">{item.caption}</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 sm:p-6">
                            <h3 className="font-semibold text-foreground mb-0 sm:mb-2 text-[10px] sm:text-lg">{item.name}</h3>
                            <p className="hidden sm:block text-muted-foreground text-sm leading-relaxed">{item.caption}</p>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="py-16 bg-muted/20">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 animate-fade-in">
                Ready to Wear VRANT?
              </h2>
              <p
                className="text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in"
                style={{ animationDelay: '0.2s' }}
              >
                Local cloth, modern cuts. Find the piece that carries your story.
              </p>
              <Button
                size="lg"
                className="bg-army-green hover:bg-army-green/90 text-white px-8 py-6 text-lg font-semibold transition-all duration-300 hover:scale-105 animate-fade-in"
                style={{ animationDelay: '0.4s' }}
                onClick={handleShopClick}
              >
                Shop the Collection
              </Button>
            </div>
          </section>
        </main>

        <Footer />
        <ScrollToTop />
      </div>
    </ErrorBoundary>
  );
};

export default Gallery;
