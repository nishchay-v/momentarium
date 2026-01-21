"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { MediaItem, GalleryItem } from "@/types/media";

interface PublishResult {
  success: boolean;
  items: GalleryItem[];
  message: string;
}

interface UploadContextType {
  // Upload state
  uploadedItems: MediaItem[];
  isUploading: boolean;
  uploadError: string | null;
  // Publish state
  isPublishing: boolean;
  publishError: string | null;
  publishedItems: GalleryItem[];
  // Upload actions
  addUploadedImages: (files: File[]) => Promise<void>;
  deleteUploadedImage: (id: string) => void;
  clearUploadedImages: () => void;
  // Publish actions
  publishImages: (items: MediaItem[]) => Promise<PublishResult | null>;
  clearPublishedItems: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
};

interface UploadProviderProps {
  children: ReactNode;
}

export const UploadProvider = ({ children }: UploadProviderProps) => {
  const [uploadedItems, setUploadedItems] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Publish state
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedItems, setPublishedItems] = useState<GalleryItem[]>([]);

  const addUploadedImages = async (files: File[]) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const { filesToMediaItems } = await import("@/lib/imageStore");
      const newMediaItems = await filesToMediaItems(files);
      setUploadedItems((prev) => [...prev, ...newMediaItems]);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload images",
      );
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteUploadedImage = (id: string) => {
    setUploadedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearUploadedImages = () => {
    setUploadedItems([]);
  };

  const publishImages = async (items: MediaItem[]): Promise<PublishResult | null> => {
    if (items.length === 0) return null;

    setIsPublishing(true);
    setPublishError(null);

    try {
      // Create FormData with files
      const formData = new FormData();
      
      for (const item of items) {
        if (item.file) {
          formData.append("images", item.file);
        }
      }

      // Send to publish API
      const response = await fetch("/api/publish", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to publish images");
      }

      const result: PublishResult = await response.json();

      if (result.success) {
        // Update local state - remove published items from upload queue
        setUploadedItems((prev) => 
          prev.filter((item) => {
            // Find matching published item by original filename
            const matchingPublished = result.items.find(
              (p) => p.originalFilename === item.file?.name
            );
            return !matchingPublished;
          })
        );

        // Store published items
        setPublishedItems((prev) => [...prev, ...result.items]);

        return result;
      } else {
        throw new Error(result.message || "Publishing failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to publish images";
      setPublishError(errorMessage);
      console.error("Publish error:", error);
      return null;
    } finally {
      setIsPublishing(false);
    }
  };

  const clearPublishedItems = () => {
    setPublishedItems([]);
  };

  const value: UploadContextType = {
    uploadedItems,
    isUploading,
    uploadError,
    isPublishing,
    publishError,
    publishedItems,
    addUploadedImages,
    deleteUploadedImage,
    clearUploadedImages,
    publishImages,
    clearPublishedItems,
  };

  return (
    <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
  );
};
