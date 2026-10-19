/** Must match backend Product schema size enum */
export const PRODUCT_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size',
  // Jeans / trouser waist
  '28', '30', '32', '34', '36',
  // Footwear (EU)
  '38', '39', '40', '41', '42', '43', '44', '45', '46',
] as const;

export type ProductSize = (typeof PRODUCT_SIZES)[number];

export const DEFAULT_PRODUCT_SIZES: ProductSize[] = ['S', 'M', 'L', 'XL'];
