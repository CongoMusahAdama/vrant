import { cn } from '@/lib/utils';
import { SITE_LOGO_SRC } from '@/lib/brand';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

type SiteLogoVariant = 'light' | 'dark' | 'hero';
type SiteLogoSize = 'nav' | 'full';

type SiteLogoProps = {
  /** light/hero = logo as-is (dark on white); dark = inverted for army footer */
  variant?: SiteLogoVariant;
  /** nav = crisp header assets; full = large master PNG */
  size?: SiteLogoSize;
  className?: string;
};

const SiteLogo = ({ variant = 'light', size = 'nav', className }: SiteLogoProps) => {
  const { logoSrc, logoSrcSet, logoAlt, logoWidth, logoHeight } = useSiteSettings();
  const isNav = size === 'nav';

  return (
    <img
      src={isNav ? logoSrc : logoSrc || SITE_LOGO_SRC}
      srcSet={isNav ? logoSrcSet : undefined}
      width={isNav ? logoWidth : 805}
      height={isNav ? logoHeight : 752}
      alt={logoAlt}
      className={cn(
        'w-auto object-contain [image-rendering:auto]',
        // Dark logo artwork: invert on the wine footer, and on dark-mode surfaces
        variant === 'dark' ? 'invert' : 'dark:invert',
        className
      )}
      decoding="async"
      fetchpriority="high"
    />
  );
};

export default SiteLogo;
