import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ShopHeader from '@/components/navigation/ShopHeader';
import ProductCard from '@/components/shop/ProductCard';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/ui/scroll-to-top';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { useShopCatalog } from '@/contexts/ShopCatalogContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { sortShopProductsNewestFirst } from '@/lib/shop-catalog';
import { SHOP_HEADER_OFFSET_PT, PAGE_X } from '@/lib/page-layout';
import { useCart } from '@/contexts/CartContext';
import TablePagination from '@/components/ui/TablePagination';
import { cn } from '@/lib/utils';
import { matchesSearch, rankSearchResults } from '@/lib/product-search';
import NoResultsDialog from '@/components/shop/NoResultsDialog';
import { useSeo } from '@/lib/seo';

const PRODUCTS_PAGE_SIZE = 12;

const Products = () => {
  useSeo({ title: 'Shop clothing, jeans & footwear', description: 'Shop the VRANT Innovations collection — two-piece sets, print shirts, kaftans, jeans and hand-finished suede slides, made in Takoradi, Ghana.' });
  const { products: shopProducts, loading: catalogLoading } = useShopCatalog();
  const { categories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || 'all';
  const { cartCount } = useCart();
  const [page, setPage] = useState(1);

  useEffect(() => {
    const validKeys = new Set(['all', ...categories.map((c) => c.slug)]);
    if (validKeys.has(categoryParam)) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam, categories]);

  const filteredProducts = useMemo(() => {
    const labelFor = (slug: string) => categories.find((c) => c.slug === slug)?.label ?? '';
    const matched = sortShopProductsNewestFirst(
      shopProducts.filter((product) => {
        const categoryMatch = selectedCategory === 'all' || product.category === selectedCategory;
        return categoryMatch && matchesSearch(product, searchQuery, labelFor(product.category));
      })
    );
    return searchQuery ? rankSearchResults(matched, searchQuery) : matched;
  }, [shopProducts, selectedCategory, searchQuery, categories]);

  const clearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('search');
    setSearchParams(next);
  };

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PAGE_SIZE));
  const pagedProducts = filteredProducts.slice(
    (page - 1) * PRODUCTS_PAGE_SIZE,
    page * PRODUCTS_PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <ShopHeader cartCount={cartCount} />

      <main className={`bg-white w-full ${SHOP_HEADER_OFFSET_PT}`}>
        <section className="py-4 sm:py-10 md:py-12 lg:py-16">
          <div className={cn('w-full max-w-[1600px] mx-auto', PAGE_X)}>
            <ScrollReveal variant="fade-up" className="mb-8 md:mb-12 text-center md:text-left">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-black/40 mb-2">
                {searchQuery ? 'Search' : 'Shop'}
              </p>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-[0.08em] uppercase text-black">
                {searchQuery
                  ? <>Results for &ldquo;{searchQuery}&rdquo;</>
                  : selectedCategory === 'all'
                    ? 'All pieces'
                    : categories.find((c) => c.slug === selectedCategory)?.label ?? 'All pieces'}
              </h1>
              {searchQuery && !catalogLoading ? (
                <p className="mt-3 text-[10px] font-bold tracking-[0.15em] uppercase text-black/50">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'} found
                  <span className="mx-2 text-black/20">·</span>
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-army-green underline underline-offset-4 hover:text-army-green-light"
                  >
                    Clear search
                  </button>
                </p>
              ) : null}
            </ScrollReveal>

            {catalogLoading ? (
              <p className="text-center py-16 text-[10px] font-bold tracking-[0.2em] uppercase text-black/40 animate-pulse">
                Loading collection…
              </p>
            ) : (
            <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-6 md:gap-x-12 lg:gap-x-16 gap-y-10 sm:gap-y-14 md:gap-y-20 lg:gap-y-24">
              {pagedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
            <TablePagination
              page={page}
              totalPages={totalPages}
              total={filteredProducts.length}
              pageSize={PRODUCTS_PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="products"
              className="mt-10 border border-black/10"
            />
            </>
            )}

            {!catalogLoading && filteredProducts.length === 0 && (
              <ScrollReveal variant="fade" className="text-center py-16">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-black/40">
                  No products found
                </p>
              </ScrollReveal>
            )}

            {!catalogLoading && searchQuery && filteredProducts.length === 0 && (
              <NoResultsDialog query={searchQuery} onClear={clearSearch} />
            )}
          </div>
        </section>
      </main>

      <WhatsAppButton />
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Products;
