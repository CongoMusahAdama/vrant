import { Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import SiteLogo from '@/components/brand/SiteLogo';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { SOCIAL_LINKS } from '@/lib/social';

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const Footer = () => {
  const year = new Date().getFullYear();
  const { storeEmail, storeCity, storePhone } = useSiteSettings();
  return (
    <footer className="bg-army-green-dark text-white pt-12 pb-6 border-t border-black/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 lg:gap-8 mb-8 sm:mb-10">
          
          {/* Brand Section */}
          <div className="col-span-2 lg:col-span-1 flex items-center justify-between lg:block">
            <Link to="/" className="inline-block lg:mb-5">
              <SiteLogo variant="dark" className="h-10 md:h-14 max-w-[220px]" />
            </Link>
            <div className="flex items-center gap-6">
              <a
                href={SOCIAL_LINKS[0].href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={SOCIAL_LINKS[0].label}
                className="text-white/40 hover:text-white transition-colors"
              >
                <TikTokIcon className="w-4 h-4" />
              </a>
              <a
                href={SOCIAL_LINKS[1].href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={SOCIAL_LINKS[1].label}
                className="text-white/40 hover:text-white transition-colors"
              >
                <Instagram className="w-4 h-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4 text-white/40">Collections</h3>
            <ul className="space-y-2.5">
              <li><Link to="/products" className="text-sm hover:text-white/60 transition-colors">All Products</Link></li>
              <li><Link to="/products?category=sets" className="text-sm hover:text-white/60 transition-colors">Two-Piece Sets</Link></li>
              <li><Link to="/products?category=shirts" className="text-sm hover:text-white/60 transition-colors">Shirts</Link></li>
              <li><Link to="/products?category=jeans" className="text-sm hover:text-white/60 transition-colors">Jeans</Link></li>
              <li><Link to="/products?category=footwear" className="text-sm hover:text-white/60 transition-colors">Footwear</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4 text-white/40">Information</h3>
            <ul className="space-y-2.5">
              <li><Link to="/custom-design" className="text-sm hover:text-white/60 transition-colors">Custom Order</Link></li>
              <li><Link to="/gallery" className="text-sm hover:text-white/60 transition-colors">Gallery</Link></li>
              <li><Link to="/shipping" className="text-sm hover:text-white/60 transition-colors">Shipping & Delivery</Link></li>
              <li><Link to="/shipping#returns" className="text-sm hover:text-white/60 transition-colors">Returns & Exchanges</Link></li>
              <li><Link to="/privacy" className="text-sm hover:text-white/60 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Newsletter Section */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4 text-white/40">Newsletter</h3>
            <p className="text-sm text-white/60 mb-4 leading-[1.7]">
              Join the house. Subscribe for early access to new collections and exclusive pieces.
            </p>
            <form className="relative">
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                className="w-full bg-transparent border-b border-white/20 pb-2 text-[10px] tracking-widest focus:border-white transition-colors outline-none uppercase"
                required
              />
              <button 
                type="submit"
                className="absolute right-0 bottom-2 text-[10px] font-bold tracking-widest hover:text-white/60 transition-colors"
              >
                JOIN
              </button>
            </form>
          </div>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-6 md:gap-10 pb-6">
          <Link
            to="/privacy"
            className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/shipping"
            className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors"
          >
            Shipping
          </Link>
          <a
            href={`mailto:${storeEmail}`}
            className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors"
          >
            Contact
          </a>
        </nav>


        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">
            © {year} VRANT. All rights reserved. Proudly Ghanaian.
          </p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="flex items-center text-[10px] tracking-[0.2em] text-white/30 uppercase">
              <MapPin className="w-3 h-3 mr-2" strokeWidth={1.5} />
              {storeCity}
            </div>
            {storePhone && (
              <a
                href={`tel:${storePhone.replace(/\s/g, '')}`}
                className="flex items-center text-[10px] tracking-[0.2em] text-white/30 hover:text-white transition-colors uppercase"
              >
                <Phone className="w-3 h-3 mr-2" strokeWidth={1.5} />
                {storePhone} · Call / WhatsApp
              </a>
            )}
            <div className="flex items-center text-[10px] tracking-[0.2em] text-white/30 uppercase">
              <Mail className="w-3 h-3 mr-2" strokeWidth={1.5} />
              {storeEmail}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;