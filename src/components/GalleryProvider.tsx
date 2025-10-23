'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { preloadImages } from '@/lib/imageCache';

export interface MediaItem {
  id: string;
  img: string;
  url?: string;
  height: number;
  type?: 'image' | 'album';
  albumItems?: MediaItem[];
  albumName?: string;
  // Upload-specific properties
  isUploaded?: boolean;
  file?: File;
}

interface GalleryContextType {
  items: MediaItem[];
  currentIndex: number;
  isOpen: boolean;
  imagesPreloaded: boolean;
  navigationStack: MediaItem[][];
  currentAlbumName: string | null;
  // Upload state
  uploadedItems: MediaItem[];
  isUploading: boolean;
  uploadError: string | null;
  // Gallery actions
  openGallery: (items: MediaItem[], startIndex: number) => void;
  closeGallery: () => void;
  navigateToIndex: (index: number) => void;
  openAlbum: (albumItems: MediaItem[], albumName: string) => void;
  navigateBack: () => void;
  // Upload actions
  addUploadedImages: (files: File[]) => Promise<void>;
  deleteUploadedImage: (id: string) => void;
  clearUploadedImages: () => void;
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined);

export const useGallery = () => {
  const context = useContext(GalleryContext);
  if (!context) {
    throw new Error('useGallery must be used within a GalleryProvider');
  }
  return context;
};

interface GalleryProviderProps {
  children: ReactNode;
}

export const GalleryProvider = ({ children }: GalleryProviderProps) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const [navigationStack, setNavigationStack] = useState<MediaItem[][]>([]);
  const [currentAlbumName, setCurrentAlbumName] = useState<string | null>(null);
  
  // Upload state
  const [uploadedItems, setUploadedItems] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Preload remaining images in background when gallery opens
  useEffect(() => {
    if (isOpen && items.length > 0 && imagesPreloaded) {
      const preloadRange = 2;
      const remainingUrls = items
        .filter((item, index) => {
          const distance = Math.min(
            Math.abs(index - currentIndex),
            items.length - Math.abs(index - currentIndex)
          );
          return distance > preloadRange;
        })
        .map((item) => item.img);

      if (remainingUrls.length > 0) {
        setTimeout(() => {
          preloadImages(remainingUrls);
        }, 100);
      }
    }
  }, [isOpen, items, currentIndex, imagesPreloaded]);

  // Preload adjacent images when navigating
  useEffect(() => {
    if (!isOpen || !imagesPreloaded) return;

    const adjacentUrls: string[] = [];
    const preloadRange = 2;

    for (let i = -preloadRange; i <= preloadRange; i++) {
      const index = (currentIndex + i + items.length) % items.length;
      if (items[index]?.img) {
        adjacentUrls.push(items[index].img);
      }
    }

    if (adjacentUrls.length > 0) {
      preloadImages(adjacentUrls);
    }
  }, [currentIndex, isOpen, imagesPreloaded, items]);

  const openGallery = async (galleryItems: MediaItem[], startIndex: number) => {
    // Preload current image BEFORE opening gallery
    const currentImg = galleryItems[startIndex]?.img;
    if (currentImg) {
      await preloadImages([currentImg]);
    }
    
    setItems(galleryItems);
    setCurrentIndex(startIndex);
    setIsOpen(true);
    setImagesPreloaded(true);
    
    // Preload adjacent images immediately in background
    const adjacentUrls: string[] = [];
    const preloadRange = 2;
    
    for (let i = -preloadRange; i <= preloadRange; i++) {
      if (i === 0) continue;
      const index = (startIndex + i + galleryItems.length) % galleryItems.length;
      if (galleryItems[index]?.img) {
        adjacentUrls.push(galleryItems[index].img);
      }
    }
    
    if (adjacentUrls.length > 0) {
      preloadImages(adjacentUrls);
    }
  };

  const closeGallery = () => {
    setIsOpen(false);
    // Delay clearing items to allow for exit animation
    // Only clear items if we're not in an album context
    setTimeout(() => {
      if (!currentAlbumName) {
        // Only clear if we're not viewing an album
        setItems([]);
        setCurrentIndex(0);
        setImagesPreloaded(false);
      } else {
        // If in album, just reset index and preload state but keep items
        setCurrentIndex(0);
        setImagesPreloaded(false);
      }
    }, 300);
  };

  const navigateToIndex = async (index: number) => {
    // Preload next image before navigating for instant display
    const nextImg = items[index]?.img;
    if (nextImg) {
      await preloadImages([nextImg]);
    }
    
    setCurrentIndex(index);
    setImagesPreloaded(true);
  };

  const openAlbum = (albumItems: MediaItem[], albumName: string) => {
    setNavigationStack([...navigationStack, items]);
    setItems(albumItems);
    setCurrentIndex(0);
    setCurrentAlbumName(albumName);
  };

  const navigateBack = () => {
    if (navigationStack.length > 0) {
      const previousItems = navigationStack[navigationStack.length - 1];
      setNavigationStack(navigationStack.slice(0, -1));
      setItems(previousItems);
      setCurrentIndex(0);
      setCurrentAlbumName(null);
    }
  };

  // Upload methods
  const addUploadedImages = async (files: File[]) => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const { filesToMediaItems } = await import('@/lib/imageStore');
      const newMediaItems = await filesToMediaItems(files);
      setUploadedItems(prev => [...prev, ...newMediaItems]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload images');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteUploadedImage = (id: string) => {
    setUploadedItems(prev => prev.filter(item => item.id !== id));
  };

  const clearUploadedImages = () => {
    setUploadedItems([]);
  };

  const value: GalleryContextType = {
    items,
    currentIndex,
    isOpen,
    imagesPreloaded,
    navigationStack,
    currentAlbumName,
    // Upload state
    uploadedItems,
    isUploading,
    uploadError,
    // Gallery actions
    openGallery,
    closeGallery,
    navigateToIndex,
    openAlbum,
    navigateBack,
    // Upload actions
    addUploadedImages,
    deleteUploadedImage,
    clearUploadedImages,
  };

  return (
    <GalleryContext.Provider value={value}>
      {children}
    </GalleryContext.Provider>
  );
};