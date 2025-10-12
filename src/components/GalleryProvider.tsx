'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface GalleryItem {
  id: string;
  img: string;
  url?: string;
  height: number;
}

interface GalleryContextType {
  items: GalleryItem[];
  currentIndex: number;
  isOpen: boolean;
  openGallery: (items: GalleryItem[], startIndex: number) => void;
  closeGallery: () => void;
  navigateToIndex: (index: number) => void;
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
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const openGallery = (galleryItems: GalleryItem[], startIndex: number) => {
    setItems(galleryItems);
    setCurrentIndex(startIndex);
    setIsOpen(true);
  };

  const closeGallery = () => {
    setIsOpen(false);
    // Delay clearing items to allow for exit animation
    setTimeout(() => {
      setItems([]);
      setCurrentIndex(0);
    }, 300);
  };

  const navigateToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  const value: GalleryContextType = {
    items,
    currentIndex,
    isOpen,
    openGallery,
    closeGallery,
    navigateToIndex,
  };

  return (
    <GalleryContext.Provider value={value}>
      {children}
    </GalleryContext.Provider>
  );
};