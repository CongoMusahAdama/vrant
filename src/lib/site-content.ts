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
  'VRANT is a Ghanaian fashion house where local style meets the modern wardrobe.',
  'We take the cloth, colour and craft we grew up with — kente, batakari, adinkra and wax print — and cut them into clean, contemporary clothing, denim and hand-finished footwear made for everyday wear.',
  'Every piece honours where it comes from, and is made for wherever you are going.',
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
