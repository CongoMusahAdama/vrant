export const DEFAULT_STORE_EMAIL = 'hello@vrant.com';

export const DEFAULT_STORE_CITY = 'Takoradi, GH';

export const DEFAULT_STORE_PHONE = '020 090 6851';

export function resolveStoreEmail(email?: string) {
  return email?.trim() || DEFAULT_STORE_EMAIL;
}

export function resolveStoreCity(city?: string) {
  return city?.trim() || DEFAULT_STORE_CITY;
}

export const DEFAULT_HERO_IMAGE = '/lookbook/look-13.jpg';

/** Desktop hero triptych side panels */
export const DEFAULT_HERO_LEFT_IMAGE = '/lookbook/look-18.jpg';
export const DEFAULT_HERO_RIGHT_IMAGE = '/lookbook/look-25.jpg';

export const DEFAULT_HERO_IMAGE_ALT = 'VRANT campaign';

export const DEFAULT_ABOUT_EYEBROW = 'Our story';

export const DEFAULT_ABOUT_TITLE = 'About VRANT';

export const DEFAULT_ABOUT_PARAGRAPHS = [
  'VRANT is a fashion house from Takoradi, Ghana — made for people who wear their heritage with confidence.',
  'We design clothing, denim and footwear that carry Ghanaian craft into the modern wardrobe: hand-pintucked diamond sets, kaftans with bold hand-cut print bibs, wax-print panel shirts and hand-finished suede slides with the VRANT script.',
  'Every piece is cut and finished by our own tailors, in small runs, with the kind of detail you feel the moment you put it on.',
  'Have a design of your own? Bring us your sketch or idea and we will make it just for you.',
  'VRANT — rooted in Ghana, cut for now.',
];

export function formatAboutBody(paragraphs: string[]) {
  return paragraphs.join('\n\n');
}

export function parseAboutBody(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
