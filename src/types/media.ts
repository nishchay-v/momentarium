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
 * R2 storage keys for image versions
 */
export interface R2Keys {
  thumb: string;
  gallery: string;
}

/**
 * Published gallery item stored in gallery.json
 */
export interface GalleryItem {
  id: string;
  r2Keys: R2Keys;
  metadata: ExifMetadata;
  uploadDate: string;
  originalFilename?: string;
}

/**
 * Gallery database structure
 */
export interface GalleryDatabase {
  version: number;
  lastUpdated: string | null;
  items: GalleryItem[];
}

/**
 * Core media item interface used across gallery and upload contexts
 */
export interface MediaItem {
  id: string;
  img: string;
  url?: string;
  height: number;
  width: number;
  type?: "image" | "album";
  albumItems?: MediaItem[];
  albumName?: string;
  // Upload-specific properties
  isUploaded?: boolean;
  file?: File;
  // Published item properties
  isPublished?: boolean;
  r2Keys?: R2Keys;
  exifMetadata?: ExifMetadata;
}
