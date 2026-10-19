import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import SiteLogo from '@/components/brand/SiteLogo';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useShopCatalog } from '@/contexts/ShopCatalogContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { cn } from '@/lib/utils';

const pillClass =
  'h-9 inline-flex items-center gap-2 rounded-md bg-white text-black shadow-sm px-3 text-[13px] font-medium hover:bg-white/90 transition-colors';

const menuLabelClass = 'text-[9px] font-bold tracking-[0.3em] uppercase text-army-green mb-3';
const menuLinkClass =
  'block py-2 text-[11px] font-bold tracking-[0.2em] uppercase text-black hover:text-army-green transition-colors';

/** Home-only header: Menu / logo / search & cart, floating over the hero */
const HomeHeader = () => {
  const { cartCount } = useCart();
  const { isAdmin, isAuthenticated } = useAuth();
  const { categories } = useCategories();
  const { products } = useShopCatalog();
  const { storePhone } = useSiteSettings();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setQuery('');
  };

  // Only list categories that currently have products, so the menu never leads to an empty page
  const stockedSlugs = new Set(products.map((p) => p.category));
  const shopMenuLinks = [
    { label: 'New in', to: '/#new-arrivals' },
    ...categories
      .filter((c) => stockedSlugs.has(c.slug))
      .map((c) => ({ label: c.label, to: `/products?category=${c.slug}` })),
    { label: 'All products', to: '/products' },
  ];
  const pageMenuLinks = [
    { label: 'Custom order', to: '/custom-design' },
    { label: 'Gallery', to: '/gallery' },
    { label: 'About', to: '/about' },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50">

      <div
        className={cn(
          'transition-colors duration-300',
          scrolled || searchOpen ? 'bg-white border-b border-black/10' : 'bg-transparent'
        )}
      >
        <div className="relative flex items-center justify-between h-16 sm:h-[4.5rem] px-4 sm:px-6 lg:px-10">
          <button type="button" className={pillClass} onClick={() => setMenuOpen(true)}>
            <Menu className="w-4 h-4" strokeWidth={2} />
            Menu
          </button>

          {/* Hidden over the hero; fades in once the visitor scrolls */}
          <Link
            to="/"
            aria-label="VRANT home"
            aria-hidden={!scrolled}
            tabIndex={scrolled ? 0 : -1}
            className={cn(
              'absolute left-1/2 -translate-x-1/2 transition-all duration-300',
              scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
            )}
          >
            <SiteLogo variant="light" className="h-10 sm:h-12" />
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle className={cn(pillClass, 'px-2.5')} />
            <button
              type="button"
              className={cn(pillClass, 'px-2.5')}
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
            >
              <Search className="w-4 h-4" strokeWidth={2} />
            </button>
            <Link to="/cart" className={cn(pillClass, 'px-2.5 relative')} aria-label="Cart">
              <ShoppingBag className="w-4 h-4" strokeWidth={2} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white text-[10px] leading-[18px] text-center tabular-nums">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <div className="bg-white border-t border-black/10 animate-fade-in">
            <form onSubmit={submitSearch} className="max-w-2xl mx-auto px-5 sm:px-8 pt-8 pb-7">
              <div className="flex items-center justify-between mb-4">
                <p className={menuLabelClass + ' mb-0'}>Search</p>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.2em] uppercase text-black/50 hover:text-black"
                >
                  Close <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center border-b border-black pb-2">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What are you looking for?"
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm sm:text-base font-bold tracking-[0.04em] text-black placeholder:text-black/30 placeholder:font-normal"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="shrink-0 w-9 h-9 inline-flex items-center justify-center text-black hover:text-army-green"
                >
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {shopMenuLinks.slice(1).map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setSearchOpen(false)}
                    className="px-3 py-1.5 border border-black/15 text-[9px] font-bold tracking-[0.18em] uppercase text-black/70 hover:border-army-green hover:text-army-green transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </form>
          </div>
        )}
      </div>

      {searchOpen && (
        <button
          type="button"
          aria-label="Close search"
          onClick={() => setSearchOpen(false)}
          className="fixed inset-0 -z-10 bg-black/35 animate-fade-in cursor-default"
        />
      )}

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[82vw] max-w-[320px] p-0 flex flex-col gap-0 border-r-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="px-7 pt-7 pb-6">
            <Link to="/" onClick={() => setMenuOpen(false)} aria-label="VRANT home">
              <SiteLogo variant="light" className="h-10" />
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto px-7 pb-8">
            <p className={menuLabelClass}>Shop</p>
            <ul className="space-y-0.5">
              {shopMenuLinks.map((l) => (
                <li key={l.to + l.label}>
                  <Link to={l.to} onClick={() => setMenuOpen(false)} className={menuLinkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="h-px bg-army-green/15 my-6" />

            <ul className="space-y-0.5">
              {pageMenuLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} onClick={() => setMenuOpen(false)} className={menuLinkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="px-7 py-5 bg-army-green text-white space-y-4">
            <div className="flex items-center gap-6">
              <Link
                to={isAdmin ? '/admin' : '/account'}
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-white hover:text-white/70"
              >
                <User className="w-3.5 h-3.5" strokeWidth={2} />
                {isAdmin ? 'Admin' : isAuthenticated ? 'Account' : 'Sign in'}
              </Link>
              <Link
                to="/cart"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-white hover:text-white/70"
              >
                <ShoppingBag className="w-3.5 h-3.5" strokeWidth={2} />
                Cart ({cartCount})
              </Link>
            </div>
            <a
              href={`tel:${storePhone.replace(/\s/g, '')}`}
              className="block text-[9px] font-bold tracking-[0.2em] uppercase text-white/60 hover:text-white"
            >
              Call / WhatsApp · {storePhone}
            </a>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default HomeHeader;
