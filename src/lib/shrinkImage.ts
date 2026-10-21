/** Images are stored at most 1600px on the long side (see the Cloudinary upload), so larger is wasted bytes */
const MAX_SIDE = 1600;
/** Anything already this small is sent as-is */
const SKIP_BELOW_BYTES = 600 * 1024;
/** Vercel rejects request bodies over 4.5MB; keep a margin for the other form fields */
export const MAX_UPLOAD_REQUEST_BYTES = 4.2 * 1024 * 1024;

/**
 * Resize and re-encode a photo in the browser before upload, so phone photos
 * (often 3–8MB) fit within the hosting request limit. PNGs become WebP to keep transparency.
 * Falls back to the original file if anything goes wrong or the result isn't smaller.
 */
export async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.size < SKIP_BELOW_BYTES) {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const type = file.type === 'image/png' ? 'image/webp' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.86));
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + (type === 'image/webp' ? '.webp' : '.jpg');
    return new File([blob], name, { type, lastModified: file.lastModified });
  } catch {
    return file;
  }
}

/** Copy of a FormData with every image file shrunk */
export async function shrinkFormImages(formData: FormData): Promise<FormData> {
  const out = new FormData();
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const file = await shrinkImage(value);
      out.append(key, file, file.name);
    } else {
      out.append(key, value);
    }
  }
  return out;
}

/** Approximate request size (files only — text fields are tiny) */
export function formFilesBytes(formData: FormData): number {
  let total = 0;
  for (const value of formData.values()) {
    if (value instanceof File) total += value.size;
  }
  return total;
}
