// Type definitions for the Momentarium application

export interface User {
  id: number;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface Image {
  id: number;
  user_id: number;
  storage_key: string;
  original_filename?: string;
  content_type?: string;
  file_size_bytes?: number;
  width?: number;
  height?: number;
  created_at: Date;
}

export interface Album {
  id: number;
  user_id: number;
  title: string;
  theme_description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AlbumImage {
  album_id: number;
  image_id: number;
  display_order: number;
  created_at: Date;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ProcessingJob {
  id: string;
  user_id: number;
  status: JobStatus;
  image_keys: string[];
  result_data?: AlbumGenerationResult;
  error_message?: string;
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
}

// AI Model Response Types
export interface AlbumGenerationResult {
  albums: GeneratedAlbum[];
}

export interface GeneratedAlbum {
  title: string;
  theme: string;
  image_keys: string[];
}

// API Request/Response Types
export interface GenerateUploadUrlsRequest {
  filenames: string[];
  userId: number;
}

export interface GenerateUploadUrlsResponse {
  urls: UploadUrlInfo[];
}

export interface UploadUrlInfo {
  uploadUrl: string;
  storageKey: string;
  filename: string;
}

export interface ProcessGalleryRequest {
  imageKeys: string[];
  userId: number;
}

export interface ProcessGalleryResponse {
  jobId: string;
}

export interface JobStatusResponse {
  status: JobStatus;
  jobId: string;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  resultUrl?: string;
}

export interface GalleryResponse {
  albums: AlbumWithImages[];
}

export interface AlbumWithImages extends Album {
  images: ImageWithUrl[];
}

export interface ImageWithUrl extends Image {
  url: string;
}

// Internal Job Queue Payload
export interface JobQueuePayload {
  jobId: string;
  userId: number;
  imageKeys: string[];
}


