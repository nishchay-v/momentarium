/**
 * Core media item interface used across gallery and upload contexts
 */
export interface MediaItem {
  id: string;
  img: string;
  url?: string;
  height: number;
  type?: "image" | "album";
  albumItems?: MediaItem[];
  albumName?: string;
  // Upload-specific properties
  isUploaded?: boolean;
  file?: File;
}
