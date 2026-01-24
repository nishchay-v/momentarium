"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { preloadImage, isImageCached } from "@/lib/imageCache";
import { MediaItem } from "@/types/media";

// Re-export MediaItem for backward compatibility
export type { MediaItem } from "@/types/media";

/**
 * Get the gallery (full-size) URL for a media item.
 * Falls back to thumbnail if no gallery URL is available.
 */
const getGalleryUrl = (item: MediaItem): string => item.url || item.img;

// IMAGE PRELOADING CONFIGURATION
// Number of adjacent images to preload (on each side of current)
const ADJACENT_PRELOAD_COUNT = 1;
// Delay before starting background preload (ms)
const BACKGROUND_PRELOAD_DELAY = 500;
// Delay before clearing gallery items after close (ms) - allows exit animation
const GALLERY_CLOSE_DELAY = 300;
// Stagger delay between images (ms)
const IMAGE_STAGGER_DELAY = 100;

interface GalleryContextType {
  items: MediaItem[];
  currentIndex: number;
  isOpen: boolean;
  navigationStack: MediaItem[][];
  currentAlbumName: string | null;
  // Gallery actions
  openGallery: (items: MediaItem[], startIndex: number) => void;
  closeGallery: () => void;
  navigateToIndex: (index: number) => void;
  openAlbum: (albumItems: MediaItem[], albumName: string) => void;
  navigateBack: () => void;
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined);

export const useGallery = () => {
  const context = useContext(GalleryContext);
  if (!context) {
    throw new Error("useGallery must be used within a GalleryProvider");
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
  const [navigationStack, setNavigationStack] = useState<MediaItem[][]>([]);
  const [currentAlbumName, setCurrentAlbumName] = useState<string | null>(null);
  
  // Track preload timeouts to cancel on unmount/close
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Lazily preload adjacent images (non-blocking, runs in background)
   * Only preloads images not already in cache
   */
  const preloadAdjacentImages = useCallback((galleryItems: MediaItem[], centerIndex: number) => {
    // Clear any pending preload
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }

    preloadTimeoutRef.current = setTimeout(() => {
      const urlsToPreload: string[] = [];
      
      // Preload ADJACENT_PRELOAD_COUNT images on each side
      for (let offset = 1; offset <= ADJACENT_PRELOAD_COUNT; offset++) {
        // Next image
        const nextIndex = (centerIndex + offset) % galleryItems.length;
        const nextUrl = getGalleryUrl(galleryItems[nextIndex]);
        if (!isImageCached(nextUrl)) {
          urlsToPreload.push(nextUrl);
        }
        
        // Previous image
        const prevIndex = (centerIndex - offset + galleryItems.length) % galleryItems.length;
        const prevUrl = getGalleryUrl(galleryItems[prevIndex]);
        if (!isImageCached(prevUrl)) {
          urlsToPreload.push(prevUrl);
        }
      }

      // Preload sequentially to avoid overwhelming the network
      urlsToPreload.forEach((url, i) => {
        setTimeout(() => {
          preloadImage(url);
        }, i * IMAGE_STAGGER_DELAY);
      });
    }, BACKGROUND_PRELOAD_DELAY);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, []);

  // Preload adjacent images when index changes (lazy, non-blocking)
  useEffect(() => {
    if (isOpen && items.length > 1) {
      preloadAdjacentImages(items, currentIndex);
    }
  }, [currentIndex, isOpen, items, preloadAdjacentImages]);

  const openGallery = (galleryItems: MediaItem[], startIndex: number) => {
    // Open gallery immediately - don't block on preloading
    setItems(galleryItems);
    setCurrentIndex(startIndex);
    setIsOpen(true);

    // Start lazy preloading of adjacent images in background
    preloadAdjacentImages(galleryItems, startIndex);
  };

  const closeGallery = () => {
    setIsOpen(false);
    
    // Cancel any pending preloads
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
      preloadTimeoutRef.current = null;
    }

    // Delay clearing items to allow for exit animation
    setTimeout(() => {
      if (!currentAlbumName) {
        setItems([]);
        setCurrentIndex(0);
      } else {
        setCurrentIndex(0);
      }
    }, GALLERY_CLOSE_DELAY);
  };

  const navigateToIndex = (index: number) => {
    // Navigate immediately - don't block on preloading
    setCurrentIndex(index);
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

  const value: GalleryContextType = {
    items,
    currentIndex,
    isOpen,
    navigationStack,
    currentAlbumName,
    // Gallery actions
    openGallery,
    closeGallery,
    navigateToIndex,
    openAlbum,
    navigateBack,
  };

  return (
    <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>
  );
};
