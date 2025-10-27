export interface UploadResponse {
  success: boolean;
  data?: {
    public_id: string;
    url: string;
    width: number;
    height: number;
    format: string;
    size: number;
    created_at: string;
  };
  error?: string;
}

/**
 * Upload an image file to the backend API
 * @param file - The image file to upload
 * @returns Promise with upload response
 */
export const uploadImage = async (file: File): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Upload failed');
    }

    return result;
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

/**
 * Upload multiple images
 * @param files - Array of image files to upload
 * @returns Promise with array of upload responses
 */
export const uploadMultipleImages = async (files: File[]): Promise<UploadResponse[]> => {
  const uploadPromises = files.map(file => uploadImage(file));
  return Promise.all(uploadPromises);
};

/**
 * Validate image file before upload
 * @param file - The file to validate
 * @returns Validation result
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum 10MB allowed.'
    };
  }

  return { valid: true };
};