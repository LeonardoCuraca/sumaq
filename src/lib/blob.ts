import { put, del } from '@vercel/blob';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Verifica la firma real del archivo (no solo el MIME declarado por el cliente). */
export function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

/** Sube una imagen validada a Vercel Blob (requiere BLOB_READ_WRITE_TOKEN). */
export async function uploadProductImage(bytes: ArrayBuffer, contentType: string) {
  const ext = ALLOWED_IMAGE_TYPES[contentType];
  const name = `products/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  return await put(name, bytes, { access: 'public', contentType, addRandomSuffix: false });
}

const isBlobUrl = (u: string) => {
  try {
    return new URL(u).hostname.endsWith('.public.blob.vercel-storage.com');
  } catch {
    return false;
  }
};

/** Elimina del Blob las imágenes que pertenezcan a nuestro store; ignora URLs externas. */
export async function deleteBlobImages(urls: string[]) {
  const own = urls.filter(isBlobUrl);
  if (own.length === 0 || !process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    await del(own);
  } catch (err) {
    console.warn('No se pudieron eliminar imágenes del Blob:', err);
  }
}
