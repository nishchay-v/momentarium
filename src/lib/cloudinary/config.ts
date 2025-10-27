import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
}

export interface CloudinaryTransformation {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string | number;
  format?: string;
  gravity?: string;
  [key: string]: unknown;
}

export interface UploadOptions {
  folder?: string;
  public_id?: string;
  transformation?: CloudinaryTransformation[];
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  format?: string;
  quality?: string | number;
}

/**
 * Upload an image buffer to Cloudinary
 * @param buffer - Image buffer from uploaded file
 * @param options - Upload options
 * @returns Promise with upload result
 */
export const uploadImageToCloudinary = async (
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  const defaultOptions = {
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'momentarium-temp',
    resource_type: 'auto' as const,
    quality: 'auto',
    format: 'auto',
  };

  const uploadOptions = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          resolve(result as UploadResult);
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      }
    ).end(buffer);
  });
};

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Promise with deletion result
 */
export const deleteImageFromCloudinary = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Get optimized image URL with transformations
 * @param publicId - The public ID of the image
 * @param transformations - Array of transformations to apply
 * @returns Optimized image URL
 */
export const getOptimizedImageUrl = (
  publicId: string,
  transformations: CloudinaryTransformation[] = []
) => {
  return cloudinary.url(publicId, {
    transformation: transformations,
    quality: 'auto',
    format: 'auto',
  });
};

export default cloudinary;