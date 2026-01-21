"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { MediaItem, GalleryItem } from "@/types/media";

interface PublishResult {
  success: boolean;
  items: GalleryItem[];
  message: string;
}

interface DeleteResult {
  success: boolean;
  deleted: number;
  message: string;
}

interface UploadContextType {
  // Gallery state (fetched from R2)
  galleryItems: MediaItem[];
  isLoadingGallery: boolean;
  galleryError: string | null;
  // Upload state
  uploadedItems: MediaItem[];
  isUploading: boolean;
  uploadError: string | null;
  // Publish state
  isPublishing: boolean;
  publishError: string | null;
  publishedItems: GalleryItem[];
  // Delete state
  isDeleting: boolean;
  deleteError: string | null;
  // Gallery actions
  fetchGalleryItems: () => Promise<void>;
  deleteGalleryItems: (ids: string[]) => Promise<DeleteResult | null>;
  // Upload actions
  addUploadedImages: (files: File[]) => Promise<void>;
  deleteUploadedImage: (id: string) => void;
  clearUploadedImages: () => void;
  // Publish actions
  publishImages: (items: MediaItem[]) => Promise<PublishResult | null>;
  publishFiles: (files: File[]) => Promise<PublishResult | null>;
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
  // Gallery state
  const [galleryItems, setGalleryItems] = useState<MediaItem[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  // Upload state
  const [uploadedItems, setUploadedItems] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Publish state
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedItems, setPublishedItems] = useState<GalleryItem[]>([]);

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch gallery items from API
  const fetchGalleryItems = useCallback(async () => {
    setIsLoadingGallery(true);
    setGalleryError(null);

    try {
      const response = await fetch("/api/gallery");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch gallery");
      }

      const data = await response.json();
      setGalleryItems(data.items);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch gallery";
      setGalleryError(errorMessage);
      console.error("Gallery fetch error:", error);
    } finally {
      setIsLoadingGallery(false);
    }
  }, []);

  // Delete gallery items
  const deleteGalleryItems = useCallback(
    async (ids: string[]): Promise<DeleteResult | null> => {
      if (ids.length === 0) return null;

      setIsDeleting(true);
      setDeleteError(null);

      try {
        const response = await fetch("/api/gallery/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete images");
        }

        const result: DeleteResult = await response.json();

        if (result.success) {
          // Remove deleted items from local state
          setGalleryItems((prev) =>
            prev.filter((item) => !ids.includes(item.id))
          );
          return result;
        } else {
          throw new Error(result.message || "Delete failed");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete images";
        setDeleteError(errorMessage);
        console.error("Delete error:", error);
        return null;
      } finally {
        setIsDeleting(false);
      }
    },
    []
  );

  const addUploadedImages = async (files: File[]) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const { filesToMediaItems } = await import("@/lib/imageStore");
      const newMediaItems = await filesToMediaItems(files);
      setUploadedItems((prev) => [...prev, ...newMediaItems]);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload images"
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

  const publishImages = async (
    items: MediaItem[]
  ): Promise<PublishResult | null> => {
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

        // Refresh gallery items to include newly published
        await fetchGalleryItems();

        return result;
      } else {
        throw new Error(result.message || "Publishing failed");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to publish images";
      setPublishError(errorMessage);
      console.error("Publish error:", error);
      return null;
    } finally {
      setIsPublishing(false);
    }
  };

  // Direct publish from files (for simplified modal flow)
  const publishFiles = async (files: File[]): Promise<PublishResult | null> => {
    if (files.length === 0) return null;

    setIsPublishing(true);
    setPublishError(null);

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("images", file);
      }

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
        setPublishedItems((prev) => [...prev, ...result.items]);
        // Refresh gallery items
        await fetchGalleryItems();
        return result;
      } else {
        throw new Error(result.message || "Publishing failed");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to publish images";
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
    galleryItems,
    isLoadingGallery,
    galleryError,
    uploadedItems,
    isUploading,
    uploadError,
    isPublishing,
    publishError,
    publishedItems,
    isDeleting,
    deleteError,
    fetchGalleryItems,
    deleteGalleryItems,
    addUploadedImages,
    deleteUploadedImage,
    clearUploadedImages,
    publishImages,
    publishFiles,
    clearPublishedItems,
  };

  return (
    <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
  );
};
