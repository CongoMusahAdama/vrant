/** Fallback colors for legacy/static products without admin-defined colorways */
export const COLOR_PREFERENCES = [
  'Black',
  'White',
  'Army green',
  'Grey',
  'Navy',
  'Other (specify below)',
] as const;

/** Colors shown at checkout — product-specific from admin, else generic fallback */
export function getProductColorOptions(product: { colors?: string[] }): string[] {
  const fromProduct = (product.colors || []).map((c) => c.trim()).filter(Boolean);
  if (fromProduct.length > 0) return fromProduct;
  return [...COLOR_PREFERENCES];
}

export function productUsesCustomColorInput(product: { colors?: string[] }): boolean {
  return getProductColorOptions(product).some((c) => c.includes('Other'));
}

export const PAYSTACK_BRAND = {
  primary: '#00C3F7',
  primaryHover: '#00A8D9',
  text: '#011B33',
} as const;

export function resolveColorPreference(choice: string, custom: string): string {
  if (!choice) return '';
  if (choice.includes('Other') || choice === 'Other (specify below)') {
    return custom.trim() || 'Other (not specified)';
  }
  return choice;
}
