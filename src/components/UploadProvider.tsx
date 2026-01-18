"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { MediaItem } from "@/types/media";

interface UploadContextType {
  // Upload state
  uploadedItems: MediaItem[];
  isUploading: boolean;
  uploadError: string | null;
  // Upload actions
  addUploadedImages: (files: File[]) => Promise<void>;
  deleteUploadedImage: (id: string) => void;
  clearUploadedImages: () => void;
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

  const value: UploadContextType = {
    uploadedItems,
    isUploading,
    uploadError,
    addUploadedImages,
    deleteUploadedImage,
    clearUploadedImages,
  };

  return (
    <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
  );
};
