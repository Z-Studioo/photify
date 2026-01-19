// Supabase Storage Utilities
// Helper functions for uploading files to Supabase Storage

import { createClient } from './client';

/**
 * Upload a data URL (base64) image to Supabase Storage
 * @param dataUrl - Base64 data URL (e.g., from canvas.toDataURL())
 * @param folder - Storage folder path (e.g., 'collages', 'products')
 * @param filename - Optional filename (will generate if not provided)
 * @returns Public URL of uploaded image or null if failed
 */
export async function uploadDataURLToStorage(
  dataUrl: string,
  folder: string,
  filename?: string
): Promise<string | null> {
  try {
    const supabase = createClient();

    // Convert data URL to blob
    const blob = await dataURLToBlob(dataUrl);
    if (!blob) {
      console.error('Failed to convert data URL to blob');
      return null;
    }

    // Generate filename if not provided
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = getExtensionFromMimeType(blob.type) || 'png';
    const finalFilename = filename || `${timestamp}-${randomStr}.${extension}`;

    // Build full path
    const filePath = `${folder}/${finalFilename}`;

    // Upload to storage
    const { error } = await supabase.storage
      .from('photify')
      .upload(filePath, blob, {
        contentType: blob.type,
        upsert: true, // Allow overwriting if file exists
      });

    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('photify')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

/**
 * Upload a File object to Supabase Storage
 * @param file - File object from input or drag-and-drop
 * @param folder - Storage folder path (e.g., 'collages', 'products')
 * @param filename - Optional filename (will use file.name if not provided)
 * @returns Public URL of uploaded image or null if failed
 */
export async function uploadFileToStorage(
  file: File,
  folder: string,
  filename?: string
): Promise<string | null> {
  try {
    const supabase = createClient();

    // Generate filename if not provided
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'png';
    const finalFilename = filename || `${timestamp}-${randomStr}.${extension}`;

    // Build full path
    const filePath = `${folder}/${finalFilename}`;

    // Upload to storage
    const { error } = await supabase.storage
      .from('photify')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('photify')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

/**
 * Convert data URL to Blob
 */
async function dataURLToBlob(dataUrl: string): Promise<Blob | null> {
  try {
    const response = await fetch(dataUrl);
    return await response.blob();
  } catch (error) {
    console.error('Failed to convert data URL to blob:', error);
    return null;
  }
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return mimeMap[mimeType] || 'png';
}

/**
 * Delete file from storage
 * @param publicUrl - Public URL of the file to delete
 */
export async function deleteFromStorage(publicUrl: string): Promise<boolean> {
  try {
    const supabase = createClient();

    // Extract file path from public URL
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf('photify') + 1).join('/');

    const { error } = await supabase.storage
      .from('photify')
      .remove([filePath]);

    if (error) {
      console.error('Storage delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

