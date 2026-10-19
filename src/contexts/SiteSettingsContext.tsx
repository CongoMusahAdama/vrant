import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch } from '@/lib/api';
import {
  SITE_LOGO_ALT,
  SITE_LOGO_NAV,
  SITE_LOGO_NAV_2X,
  SITE_LOGO_NAV_HEIGHT,
  SITE_LOGO_NAV_WIDTH,
} from '@/lib/brand';
import type { SiteSettings } from '@/admin/types/admin';
import {
  DEFAULT_ABOUT_EYEBROW,
  DEFAULT_ABOUT_PARAGRAPHS,
  DEFAULT_ABOUT_TITLE,
  DEFAULT_HERO_IMAGE,
  DEFAULT_HERO_LEFT_IMAGE,
  DEFAULT_HERO_RIGHT_IMAGE,
  DEFAULT_HERO_IMAGE_ALT,
  DEFAULT_STORE_CITY,
  DEFAULT_STORE_EMAIL,
  DEFAULT_STORE_PHONE,
  resolveStoreCity,
  resolveStoreEmail,
} from '@/lib/site-content';
import { productImageUrl } from '@/lib/productImage';

type SiteSettingsContextValue = {
  settings: SiteSettings;
  loading: boolean;
  refresh: () => Promise<void>;
  logoSrc: string;
  logoSrcSet: string | undefined;
  logoAlt: string;
  logoWidth: number;
  logoHeight: number;
  heroImageSrc: string;
  heroLeftSrc: string;
  heroRightSrc: string;
  heroImageAlt: string;
  aboutEyebrow: string;
  aboutTitle: string;
  aboutParagraphs: string[];
  storeEmail: string;
  storePhone: string;
  storeCity: string;
};

const defaultSettings: SiteSettings = {
  logoUrl: '',
  logoAlt: SITE_LOGO_ALT,
  storeName: 'VRANT',
  storeEmail: DEFAULT_STORE_EMAIL,
  storePhone: DEFAULT_STORE_PHONE,
  storeCity: DEFAULT_STORE_CITY,
  heroImageUrl: DEFAULT_HERO_IMAGE,
  heroImageLeftUrl: DEFAULT_HERO_LEFT_IMAGE,
  heroImageRightUrl: DEFAULT_HERO_RIGHT_IMAGE,
  heroImageAlt: DEFAULT_HERO_IMAGE_ALT,
  aboutEyebrow: DEFAULT_ABOUT_EYEBROW,
  aboutTitle: DEFAULT_ABOUT_TITLE,
  aboutParagraphs: [...DEFAULT_ABOUT_PARAGRAPHS],
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        data: { settings: SiteSettings };
      }>('/api/settings');
      setSettings(res.data.settings || defaultSettings);
    } catch {
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onChange = () => {
      void refresh();
    };
    window.addEventListener('vrant:settings-changed', onChange);
    return () => window.removeEventListener('vrant:settings-changed', onChange);
  }, [refresh]);

  const value = useMemo<SiteSettingsContextValue>(() => {
    const hasCustomLogo = Boolean(settings.logoUrl?.trim());
    const heroPath = settings.heroImageUrl?.trim() || DEFAULT_HERO_IMAGE;
    const paragraphs =
      settings.aboutParagraphs?.length > 0
        ? settings.aboutParagraphs
        : DEFAULT_ABOUT_PARAGRAPHS;

    return {
      settings,
      loading,
      refresh,
      logoSrc: hasCustomLogo ? settings.logoUrl : SITE_LOGO_NAV,
      logoSrcSet: hasCustomLogo ? undefined : `${SITE_LOGO_NAV} 1x, ${SITE_LOGO_NAV_2X} 2x`,
      logoAlt: settings.logoAlt?.trim() || SITE_LOGO_ALT,
      logoWidth: SITE_LOGO_NAV_WIDTH,
      logoHeight: SITE_LOGO_NAV_HEIGHT,
      heroImageSrc: productImageUrl(heroPath) || productImageUrl(DEFAULT_HERO_IMAGE),
      heroLeftSrc: productImageUrl(settings.heroImageLeftUrl?.trim() || DEFAULT_HERO_LEFT_IMAGE),
      heroRightSrc: productImageUrl(settings.heroImageRightUrl?.trim() || DEFAULT_HERO_RIGHT_IMAGE),
      heroImageAlt: settings.heroImageAlt?.trim() || DEFAULT_HERO_IMAGE_ALT,
      aboutEyebrow: settings.aboutEyebrow?.trim() || DEFAULT_ABOUT_EYEBROW,
      aboutTitle: settings.aboutTitle?.trim() || DEFAULT_ABOUT_TITLE,
      aboutParagraphs: paragraphs,
      storeEmail: resolveStoreEmail(settings.storeEmail),
      storePhone: settings.storePhone?.trim() || DEFAULT_STORE_PHONE,
      storeCity: resolveStoreCity(settings.storeCity),
    };
  }, [settings, loading, refresh]);

  return (
    <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  }
  return ctx;
}
