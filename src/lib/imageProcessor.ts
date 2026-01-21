import sharp from "sharp";
import ExifParser from "exif-parser";

// IMAGE PROCESSING CONFIGURATION
// Thumbnail: Optimized for InfiniteCanvas component
// Based on DEFAULT_ITEM_HEIGHT = 480 in InfiniteCanvas.tsx
const THUMBNAIL_HEIGHT = 480;
const THUMBNAIL_QUALITY = 80;

// Gallery: High quality for detailed viewing
const GALLERY_MAX_WIDTH = 2500;
const GALLERY_QUALITY = 95;

/**
 * EXIF metadata extracted from images
 */
export interface ExifMetadata {
  dateTaken?: string;
  cameraModel?: string;
  cameraMake?: string;
  iso?: number;
  fStop?: number;
  exposureTime?: string;
  focalLength?: number;
  width?: number;
  height?: number;
}

/**
 * Processed image result
 */
export interface ProcessedImage {
  thumbnail: Buffer;
  gallery: Buffer;
  exif: ExifMetadata;
  originalWidth: number;
  originalHeight: number;
}

/**
 * Extract EXIF data from a JPEG buffer
 * Note: EXIF data is typically only available in JPEG files
 */
export function extractExifData(buffer: Buffer): ExifMetadata {
  const metadata: ExifMetadata = {};

  try {
    const parser = ExifParser.create(buffer);
    const result = parser.parse();

    if (result.tags) {
      const tags = result.tags;

      // Date taken
      if (tags.DateTimeOriginal) {
        // EXIF date is in seconds since epoch
        const date = new Date(tags.DateTimeOriginal * 1000);
        metadata.dateTaken = date.toISOString();
      } else if (tags.CreateDate) {
        const date = new Date(tags.CreateDate * 1000);
        metadata.dateTaken = date.toISOString();
      }

      // Camera info
      if (tags.Model) {
        metadata.cameraModel = tags.Model;
      }
      if (tags.Make) {
        metadata.cameraMake = tags.Make;
      }

      // Exposure settings
      if (tags.ISO) {
        metadata.iso = tags.ISO;
      }
      if (tags.FNumber) {
        metadata.fStop = tags.FNumber;
      }
      if (tags.ExposureTime) {
        // Convert to fraction format (e.g., "1/250")
        if (tags.ExposureTime < 1) {
          metadata.exposureTime = `1/${Math.round(1 / tags.ExposureTime)}`;
        } else {
          metadata.exposureTime = `${tags.ExposureTime}s`;
        }
      }
      if (tags.FocalLength) {
        metadata.focalLength = tags.FocalLength;
      }

      // Image dimensions from EXIF
      if (tags.ImageWidth) {
        metadata.width = tags.ImageWidth;
      }
      if (tags.ImageHeight) {
        metadata.height = tags.ImageHeight;
      }
    }
  } catch (error) {
    // EXIF parsing failed - this is common for non-JPEG files
    console.warn("EXIF extraction failed:", error);
  }

  return metadata;
}

/**
 * Process an image buffer to generate thumbnail and gallery versions
 */
export async function processImage(buffer: Buffer): Promise<ProcessedImage> {
  // Extract EXIF data before processing (from original)
  const exif = extractExifData(buffer);

  // Get original image metadata
  const originalMetadata = await sharp(buffer).metadata();
  const originalWidth = originalMetadata.width || 0;
  const originalHeight = originalMetadata.height || 0;

  // Update EXIF with actual dimensions if not present
  if (!exif.width) exif.width = originalWidth;
  if (!exif.height) exif.height = originalHeight;

  // Generate thumbnail (height-based resize for masonry layout)
  const thumbnail = await sharp(buffer)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize({
      height: THUMBNAIL_HEIGHT,
      withoutEnlargement: true,
    })
    .webp({ quality: THUMBNAIL_QUALITY })
    .toBuffer();

  // Generate gallery version (width-based resize for full viewing)
  const gallery = await sharp(buffer)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize({
      width: GALLERY_MAX_WIDTH,
      withoutEnlargement: true,
    })
    .webp({ quality: GALLERY_QUALITY })
    .toBuffer();

  return {
    thumbnail,
    gallery,
    exif,
    originalWidth,
    originalHeight,
  };
}

/**
 * Process multiple images in parallel with concurrency limit
 */
export async function processImages(
  buffers: Buffer[],
  concurrency: number = 3
): Promise<ProcessedImage[]> {
  const results: ProcessedImage[] = [];

  // Process in batches to avoid overwhelming memory
  for (let i = 0; i < buffers.length; i += concurrency) {
    const batch = buffers.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(processImage));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Calculate display height for masonry layout based on aspect ratio
 * Matches the logic in imageStore.ts
 */
export function calculateDisplayHeight(
  width: number,
  height: number,
  standardWidth: number = 600,
  maxHeight: number = 1000
): number {
  const aspectRatio = height / width;
  return Math.min(Math.round(standardWidth * aspectRatio), maxHeight);
}
