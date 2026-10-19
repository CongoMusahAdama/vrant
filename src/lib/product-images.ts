import type { ShopProduct } from '@/data/products';

export type ProductImageLabels = {
  front?: string;
  back?: string;
  additional?: string[];
};

export type GalleryImage = {
  url: string;
  label: string;
};

/** Prefer admin label; fall back to product color name only when label is empty */
function resolveGalleryLabel(
  rawLabel: string | undefined,
  colorIndex: number,
  colors?: string[]
): string {
  const trimmed = rawLabel?.trim() || '';
  if (trimmed) return trimmed;
  return colors?.[colorIndex]?.trim() || '';
}

/** Unique gallery entries: front, back, then extra views (admin uploads) */
export function getProductGalleryImages(
  product: Pick<ShopProduct, 'frontImage' | 'backImage' | 'images' | 'imageLabels' | 'colors'>
): GalleryImage[] {
  const labels = product.imageLabels;
  const colors = product.colors;
  const ordered: GalleryImage[] = [];

  if (product.frontImage?.trim()) {
    ordered.push({
      url: product.frontImage,
      label: resolveGalleryLabel(labels?.front, 0, colors),
    });
  }
  if (product.backImage?.trim() && product.backImage !== product.frontImage) {
    ordered.push({
      url: product.backImage,
      label: resolveGalleryLabel(labels?.back, 1, colors),
    });
  }

  const extras = (product.images || []).filter(
    (url) => url?.trim() && url !== product.frontImage && url !== product.backImage
  );
  const extraLabels = labels?.additional || [];
  extras.forEach((url, index) => {
    const colorIndex = ordered.length;
    ordered.push({
      url,
      label: resolveGalleryLabel(extraLabels[index], colorIndex, colors),
    });
  });

  const seen = new Set<string>();
  return ordered.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

/** @deprecated Use gallery entry labels from getProductGalleryImages */
export function galleryImageLabel(index: number, total: number): string {
  if (total <= 1) return '';
  return '';
}

export { resolveGalleryLabel };
