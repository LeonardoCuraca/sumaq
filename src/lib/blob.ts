import { put, del, list } from '@vercel/blob';

/**
 * Upload a file directly to Vercel Blob storage.
 * Requires BLOB_READ_WRITE_TOKEN environment variable configured on Vercel.
 */
export async function uploadImageToBlob(file: File, folder: string = 'products') {
  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.STORAGE_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured.');
  }

  const filename = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const blob = await put(filename, file, {
    access: 'public',
    token: token,
  });

  return blob;
}

/**
 * Delete a file from Vercel Blob
 */
export async function deleteImageFromBlob(url: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured.');
  }

  await del(url);
}

/**
 * List files in Vercel Blob
 */
export async function listBlobFiles(prefix?: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { blobs: [] };
  }

  return await list({ prefix });
}
