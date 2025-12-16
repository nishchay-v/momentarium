import { MediaItem } from '@/components/GalleryProvider';
import { uploadImage, validateImageFile } from '@/lib/api/upload';

/**
 * Generate unique ID for uploaded images
 */
export const generateImageId = (): string => {
  return `uploaded-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Convert File to base64 data URL (for preview purposes)
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Get image dimensions from File object
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    
    // Create object URL for the file
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    
    // Clean up object URL after loading
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
  });
};

/**
 * Convert File to MediaItem using Cloudinary backend
 */
export const fileToMediaItem = async (file: File): Promise<MediaItem> => {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error(`Invalid file type: ${file.type}. Only image files are supported.`);
  }

  try {
    // Upload to Cloudinary via our backend API
    const uploadResult = await uploadImage(file);
    
    if (!uploadResult.success || !uploadResult.data) {
      throw new Error(uploadResult.error || 'Upload failed');
    }

    // Calculate display height (maintain aspect ratio, scale to reasonable size)
    const maxWidth = 600; // Standard width for masonry
    const aspectRatio = uploadResult.data.height / uploadResult.data.width;
    const displayHeight = Math.min(maxWidth * aspectRatio, 1000); // Cap at 1000px height
    
    return {
      id: generateImageId(),
      img: uploadResult.data.url, // Use Cloudinary URL instead of base64
      url: uploadResult.data.url, // Also set as URL
      type: 'image',
      height: Math.round(displayHeight),
      isUploaded: true,
      file: file, // Keep reference for potential future use
    };
  } catch (error) {
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Convert File to MediaItem for preview (using base64, no backend upload)
 * This is useful for showing previews before actual upload
 */
export const fileToPreviewMediaItem = async (file: File): Promise<MediaItem> => {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error(`Invalid file type: ${file.type}. Only image files are supported.`);
  }

  try {
    // Generate base64 data URL for preview
    const base64Url = await fileToBase64(file);
    
    // Get image dimensions
    const { width, height } = await getImageDimensions(file);
    
    // Calculate display height (maintain aspect ratio, scale to reasonable size)
    const maxWidth = 600; // Standard width for masonry
    const aspectRatio = height / width;
    const displayHeight = Math.min(maxWidth * aspectRatio, 1000); // Cap at 1000px height
    
    return {
      id: generateImageId(),
      img: base64Url,
      type: 'image',
      height: Math.round(displayHeight),
      isUploaded: false, // Mark as not uploaded yet
      file: file, // Keep reference for upload
    };
  } catch (error) {
    throw new Error(`Failed to process image preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Process multiple files to MediaItems
 */
export const filesToMediaItems = async (files: File[]): Promise<MediaItem[]> => {
  const results = await Promise.allSettled(
    files.map(file => fileToMediaItem(file))
  );
  
  const successful: MediaItem[] = [];
  const errors: string[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value);
    } else {
      errors.push(`${files[index].name}: ${result.reason}`);
    }
  });
  
  if (errors.length > 0) {
    console.warn('Some files failed to process:', errors);
  }
  
  return successful;
};

/**
 * Validate file types and size for upload (using backend validation rules)
 */
export const validateImageFiles = (files: File[]): { valid: File[]; invalid: string[] } => {
  const valid: File[] = [];
  const invalid: string[] = [];
  
  files.forEach(file => {
    const validation = validateImageFile(file);
    if (validation.valid) {
      valid.push(file);
    } else {
      invalid.push(`${file.name}: ${validation.error}`);
    }
  });
  
  return { valid, invalid };
};

// TODO: Future IndexedDB integration
// export const saveToIndexedDB = async (mediaItems: MediaItem[]): Promise<void> => { ... }
// export const loadFromIndexedDB = async (): Promise<MediaItem[]> => { ... }
// export const deleteFromIndexedDB = async (id: string): Promise<void> => { ... }

