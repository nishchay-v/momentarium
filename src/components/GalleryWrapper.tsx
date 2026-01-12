"use client";

import { ReactNode } from "react";
import { GalleryProvider, useGallery } from "./GalleryProvider";
import Gallery from "./Gallery";

interface GalleryWrapperProps {
  children: ReactNode;
}

const GalleryContent = ({ children }: GalleryWrapperProps) => {
  const {
    items,
    currentIndex,
    isOpen,
    closeGallery,
    navigateToIndex,
  } = useGallery();

  return (
    <>
      {children}
      <Gallery
        items={items}
        currentIndex={currentIndex}
        isOpen={isOpen}
        onClose={closeGallery}
        onNavigate={navigateToIndex}
      />
    </>
  );
};

const GalleryWrapper = ({ children }: GalleryWrapperProps) => {
  return (
    <GalleryProvider>
      <GalleryContent>{children}</GalleryContent>
    </GalleryProvider>
  );
};

export default GalleryWrapper;
