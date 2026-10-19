import type { ShopProduct } from '@/data/products';

/**
 * Starter VRANT collection — shown while the admin catalog (MongoDB) is empty
 * or unreachable. Once products are added in Admin → Products, those replace this list.
 */

const img = (slug: string, count: number) =>
  Array.from({ length: count }, (_, i) => `/products/${slug}-${i + 1}.jpg`);

function product(
  p: Omit<ShopProduct, 'price' | 'frontImage' | 'backImage' | 'images'> & {
    slug: string;
    imageCount: number;
  }
): ShopProduct {
  const { slug, imageCount, ...rest } = p;
  const images = img(slug, imageCount);
  return {
    ...rest,
    price: `₵${p.priceAmount.toLocaleString('en-GH')}`,
    frontImage: images[0],
    backImage: images[1] ?? images[0],
    images,
  };
}

const APPAREL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const VRANT_COLLECTION: ShopProduct[] = [
  product({
    id: 1,
    slug: 'ember-diamond-zip-set',
    imageCount: 5,
    name: 'Ember Diamond Zip Set',
    priceAmount: 850,
    category: 'sets',
    stock: 12,
    sizes: APPAREL_SIZES,
    colors: ['Ember Red', 'Ivory'],
    imageLabels: { front: 'The set', back: 'Rhinestone zip', additional: ['Folded', 'Styled', 'Lounge'] },
    description:
      'Our signature two-piece. A relaxed short-sleeve shirt with hand-pintucked diamond quilting, a rhinestone-studded half zip and a sharp point collar, paired with matching straight-leg trousers.',
    details: [
      'Hand-pintucked diamond quilting',
      'Rhinestone half-zip placket',
      'Matching straight-leg trousers',
      'Made in Ghana',
    ],
    createdAt: '2026-10-07T09:00:00.000Z',
  }),
  product({
    id: 2,
    slug: 'abstract-bib-kaftan',
    imageCount: 4,
    name: 'Abstract Bib Kaftan',
    priceAmount: 780,
    category: 'sets',
    stock: 10,
    sizes: APPAREL_SIZES,
    colors: ['Cocoa'],
    imageLabels: { front: 'Front', back: 'Bib detail', additional: ['Print close-up', 'Styled'] },
    description:
      'A long-sleeve kaftan in textured cocoa cloth, finished with a bold hand-cut print bib and side vents. Comes with matching trousers for a complete, modern native look.',
    details: [
      'Textured cocoa woven cloth',
      'Contrast print bib panel',
      'Side vents and buttoned cuffs',
      'Matching trousers included',
    ],
    createdAt: '2026-10-06T09:00:00.000Z',
  }),
  product({
    id: 3,
    slug: 'coral-panel-shirt-set',
    imageCount: 5,
    name: 'Coral Panel Shirt Set',
    priceAmount: 720,
    category: 'sets',
    stock: 10,
    sizes: APPAREL_SIZES,
    colors: ['Coral'],
    imageLabels: { front: 'Full look', back: 'Panel detail', additional: ['Shoulder', 'Seated', 'Styled'] },
    description:
      'A clean coral shirt with curved wax-print shoulder panels and print-trimmed sleeves, cut with a straight hem. Paired with tailored coral trousers.',
    details: [
      'Curved wax-print shoulder panels',
      'Print-trimmed sleeve hems',
      'Tailored matching trousers',
      'Made in Ghana',
    ],
    createdAt: '2026-10-05T09:00:00.000Z',
  }),
  product({
    id: 4,
    slug: 'ivory-diamond-set',
    imageCount: 3,
    name: 'Ivory Diamond Set',
    priceAmount: 850,
    category: 'sets',
    stock: 8,
    sizes: APPAREL_SIZES,
    colors: ['Ivory'],
    imageLabels: { front: 'Full look', back: 'Detail', additional: ['With Ember'] },
    description:
      'The diamond pintuck set in crisp ivory. A relaxed short-sleeve top with a soft collar and matching trousers — clean enough for a wedding, easy enough for Sunday.',
    details: [
      'Hand-pintucked diamond quilting',
      'Soft collar, relaxed fit',
      'Matching straight-leg trousers',
      'Made in Ghana',
    ],
    createdAt: '2026-10-04T09:00:00.000Z',
  }),
  product({
    id: 5,
    slug: 'vrant-cross-suede-slides',
    imageCount: 5,
    name: 'VRANT Cross Suede Slides',
    priceAmount: 380,
    category: 'footwear',
    stock: 25,
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Grey', 'Red', 'Brown', 'Black', 'Mint'],
    imageLabels: { front: 'Grey', back: 'On foot', additional: ['Colours', 'Basket', 'The range'] },
    description:
      'Hand-finished cross-strap slides in soft suede with a leather under-strap and the VRANT script on the upper. Cushioned footbed, built for all-day wear.',
    details: [
      'Suede upper with leather cross strap',
      'Embossed VRANT script',
      'Cushioned footbed',
      'Available in five colours',
    ],
    createdAt: '2026-10-03T09:00:00.000Z',
  }),
  product({
    id: 6,
    slug: 'crimson-print-shirt',
    imageCount: 1,
    name: 'Crimson Print Shirt',
    priceAmount: 480,
    category: 'shirts',
    stock: 6,
    sizes: APPAREL_SIZES,
    colors: ['Crimson / White'],
    description:
      'A long-sleeve shirt with a crimson print body, white textured sleeves and yoke, and a print-trimmed pocket square detail.',
    details: [
      'Bold print body',
      'White textured sleeves and collar',
      'Pocket square detail',
      'Made in Ghana',
    ],
    createdAt: '2026-10-02T09:00:00.000Z',
  }),
  product({
    id: 7,
    slug: 'olive-print-yoke-set',
    imageCount: 1,
    name: 'Olive Print Yoke Set',
    priceAmount: 700,
    category: 'sets',
    stock: 6,
    sizes: APPAREL_SIZES,
    colors: ['Olive'],
    description:
      'A short-sleeve olive shirt with a vivid abstract print yoke and structured shoulder panels, paired with matching olive trousers.',
    details: [
      'Abstract print yoke',
      'Structured shoulder panels',
      'Matching trousers included',
      'Made in Ghana',
    ],
    createdAt: '2026-10-01T09:00:00.000Z',
  }),
];

/** Lookbook photos for the home page and gallery (public/lookbook) */
export const VRANT_LOOKBOOK = [
  { id: 'look-9', image: '/lookbook/look-9.jpg', name: 'Ivory & Ember', caption: 'Diamond sets, side by side.', category: 'sets' },
  { id: 'look-13', image: '/lookbook/look-13.jpg', name: 'Ember, Together', caption: 'The Ember Diamond Zip Set.', category: 'sets' },
  { id: 'look-21', image: '/lookbook/look-21.jpg', name: 'Cocoa & Ivory', caption: 'Abstract Bib Kaftan meets the Ivory set.', category: 'lookbook' },
  { id: 'look-25', image: '/lookbook/look-25.jpg', name: 'Coral, Seated', caption: 'Wax-print panels, clean lines.', category: 'shirts' },
  { id: 'look-16', image: '/lookbook/look-16.jpg', name: 'Lounge', caption: 'Ember set with red suede slides.', category: 'lookbook' },
  { id: 'look-11', image: '/lookbook/look-11.jpg', name: 'Ember Duo', caption: 'Rhinestone zip, diamond quilting.', category: 'sets' },
  { id: 'look-14', image: '/lookbook/look-14.jpg', name: 'Standing Still', caption: 'The Ember set, head to toe.', category: 'sets' },
  { id: 'look-6', image: '/lookbook/look-6.jpg', name: 'Coral Panel', caption: 'Curved print shoulders.', category: 'shirts' },
  { id: 'look-18', image: '/lookbook/look-18.jpg', name: 'Ivory, Carried', caption: 'Ivory set, Ember in hand.', category: 'sets' },
  { id: 'look-24', image: '/lookbook/look-24.jpg', name: 'Slides, Every Colour', caption: 'VRANT Cross Suede Slides.', category: 'footwear' },
  { id: 'look-26', image: '/lookbook/look-26.jpg', name: 'Basket Drop', caption: 'Hand-finished suede.', category: 'footwear' },
  { id: 'look-7', image: '/lookbook/look-7.jpg', name: 'Grey Slide', caption: 'Suede, leather, VRANT script.', category: 'footwear' },
];

/** "Shop the look" — lookbook photos (rotating when more than one) plus the catalog products worn in it (matched by name, so it works for database products too) */
export const VRANT_LOOKS = [
  {
    title: 'Cross Suede Slides',
    images: [
      '/products/vrant-cross-suede-slides-5.jpg',
      '/products/vrant-cross-suede-slides-1.jpg',
      '/lookbook/look-26.jpg',
    ],
    products: ['VRANT Cross Suede Slides', 'Ivory Diamond Set', 'Ember Diamond Zip Set'],
  },
  { title: 'Ember, Together', images: ['/lookbook/look-13.jpg'], products: ['Ember Diamond Zip Set', 'VRANT Cross Suede Slides'] },
  { title: 'Coral, Seated', images: ['/lookbook/look-25.jpg'], products: ['Coral Panel Shirt Set'] },
  { title: 'Ember Lounge', images: ['/lookbook/look-16.jpg'], products: ['Ember Diamond Zip Set', 'VRANT Cross Suede Slides'] },
];
