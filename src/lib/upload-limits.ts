/** Keep in sync with backend/lib/constants.js */
export const MAX_PRODUCT_IMAGES = 8;
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
export const MAX_UPLOAD_MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));

export function formatMaxUploadSize() {
  return `${MAX_UPLOAD_MB}MB`;
}
