/** Fixed/sticky navbar — use on all page headers */
export const STICKY_NAV_CLASS =
  'fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300';

/** Horizontal page padding — full width on mobile */
export const PAGE_X = 'px-4 sm:px-6 md:px-12 lg:px-16';

/** Main site header (logo + nav on desktop) */
export const SITE_HEADER_OFFSET_PT =
  'pt-[10.5rem] sm:pt-[12rem] md:pt-[14.5rem] lg:pt-[16rem]';

/** Shop header — logo + desktop nav; keep generous clearance so content is not covered */
export const SHOP_HEADER_OFFSET_PT =
  'pt-[7.5rem] sm:pt-[9rem] md:pt-[14rem] lg:pt-[15rem]';

/** Product detail — tighter desktop offset so the form sits beside the image without extra gap */
export const PRODUCT_DETAIL_OFFSET_PT =
  'pt-[7rem] sm:pt-[8.5rem] md:pt-[10.5rem] lg:pt-[11.75rem] xl:pt-[12.25rem]';

/** Account & admin — same header, less dead space below nav on desktop */
export const ACCOUNT_ADMIN_OFFSET_PT =
  'pt-[7.5rem] sm:pt-[9rem] md:pt-[11rem] lg:pt-[12rem] xl:pt-[12.5rem]';

/** @deprecated use SITE_HEADER_OFFSET_PT */
export const HEADER_OFFSET_PT = SITE_HEADER_OFFSET_PT;

export const HEADER_OFFSET_SCROLL_MT =
  'scroll-mt-[7.5rem] sm:scroll-mt-[9rem] md:scroll-mt-[18rem] lg:scroll-mt-[20rem] xl:scroll-mt-[21rem]';

/** Space above fixed bottom bars on mobile (sticky cart CTA, WhatsApp) */
export const MOBILE_BOTTOM_SAFE = 'pb-28 md:pb-16';

/** Admin mobile bottom tab bar clearance */
export const ADMIN_MOBILE_BOTTOM_SAFE =
  'pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-20';

/** Center nav: Shop, Gallery, About — small + bold */
export const NAV_LINK_BASE =
  'text-[9px] font-extrabold tracking-[0.22em] uppercase transition-colors';

export function navLinkClass(active: boolean, lightText = false) {
  if (lightText) {
    return active ? 'text-white' : 'text-white/70 hover:text-white';
  }
  return active ? 'text-black' : 'text-black/60 hover:text-black';
}
