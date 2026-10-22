import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const SITE_URL = 'https://vrantinnovations.com';
export const SITE_NAME = 'VRANT Innovations';

const DEFAULT_TITLE = 'VRANT Innovations | Ghanaian Fashion House — Clothing, Jeans & Footwear';
const DEFAULT_DESCRIPTION =
  'VRANT Innovations (VRANT) is a fashion house from Takoradi, Ghana. Shop two-piece sets, print shirts, kaftans, jeans and hand-finished suede slides — or bring your own design.';
const DEFAULT_IMAGE = `${SITE_URL}/lookbook/look-13.jpg`;

type SeoOptions = {
  /** Page title; " | VRANT Innovations" is appended unless it already contains the brand */
  title?: string;
  description?: string;
  /** Absolute or site-relative image for link previews */
  image?: string;
  /** Hide this page from search results (account, cart, admin…) */
  noindex?: boolean;
  /** Extra JSON-LD for this page (e.g. a Product) */
  jsonLd?: Record<string, unknown> | null;
};

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

const absolute = (src: string) => (src.startsWith('http') ? src : `${SITE_URL}${src.startsWith('/') ? '' : '/'}${src}`);

/**
 * Per-page title, description, canonical URL, social preview and optional JSON-LD.
 * The canonical always points at vrantinnovations.com (never a preview/vercel.app host).
 */
export function useSeo({ title, description, image, noindex = false, jsonLd = null }: SeoOptions = {}) {
  const { pathname } = useLocation();
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const fullTitle = !title ? DEFAULT_TITLE : /vrant/i.test(title) ? title : `${title} | ${SITE_NAME}`;
    const desc = description || DEFAULT_DESCRIPTION;
    const img = absolute(image || DEFAULT_IMAGE);
    const url = `${SITE_URL}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`;

    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setCanonical(url);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', img);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', img);

    let script: HTMLScriptElement | null = null;
    if (jsonLdKey) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.page = 'true';
      script.text = jsonLdKey;
      document.head.appendChild(script);
    }
    return () => {
      script?.remove();
    };
  }, [title, description, image, noindex, jsonLdKey, pathname]);
}
