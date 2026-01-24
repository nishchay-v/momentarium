"use client";

import { useEffect, useState } from "react";
import InfiniteCanvasWrapper from "@/components/InfiniteCanvasWrapper";
import GalleryWrapper from "@/components/GalleryWrapper";
import { useGallery, MediaItem } from "@/components/GalleryProvider";
import { Easing, motion } from "framer-motion";

// ANIMATION CONFIGURATION
// Header fade-in delay (seconds)
const HEADER_FADE_DELAY = 0.5;
// Header fade-in duration (seconds)
const HEADER_FADE_DURATION = 0.6;
// Breadcrumb slide-in duration (seconds)
const BREADCRUMB_SLIDE_DURATION = 0.4;
// Easing curve for header animations
const HEADER_EASING: Easing = [0.22, 1, 0.36, 1];

// Initial Y offset for header (px)
const HEADER_Y_OFFSET = -20;
// Animate Y offset for header (px)
const ANIMATE_HEADER_Y_OFFSET = 0;

// CANVAS CONFIGURATION
// Scale factor when hovering over items
const HOVER_SCALE = 0.97;

function InfiniteCanvasView() {
  const { items: contextItems, currentAlbumName, navigateBack } = useGallery();
  const [galleryItems, setGalleryItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch gallery items from API on mount
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await fetch("/api/gallery");
        if (response.ok) {
          const data = await response.json();
          setGalleryItems(data.items);
        }
      } catch (error) {
        console.error("Failed to fetch gallery:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGallery();
  }, []);

  // Determine which items to display:
  // 1. If in album context, use context items
  // 2. If gallery has items from R2, use those
  const displayItems =
    currentAlbumName && contextItems.length > 0
      ? contextItems
      : galleryItems.length > 0
        ? galleryItems
        : [];

  // Show loading state only if we don't have any items yet
  if (isLoading && galleryItems.length === 0 && !currentAlbumName) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
            <div
              className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-white/30 animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            />
          </div>
          <p className="text-white/40 text-sm tracking-widest uppercase">
            Loading Gallery
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header overlay - appears above the canvas */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-30 pointer-events-none"
        initial={{ opacity: 0, y: HEADER_Y_OFFSET }}
        animate={{ opacity: 1, y: ANIMATE_HEADER_Y_OFFSET }}
        transition={{
          delay: HEADER_FADE_DELAY,
          duration: HEADER_FADE_DURATION,
          ease: HEADER_EASING,
        }}
      >
        <div className="flex items-center justify-between px-8 py-6">
          {/* Logo / Title */}
          <div className="pointer-events-auto">
            <h1 className="text-xl font-normal tracking-[0.3em] text-white/80 uppercase">
              Nishchay
            </h1>
            {/* <p className="text-xs text-white/40 tracking-[0.15em] uppercase mt-1">
              Gallery
            </p> */}
          </div>

          {/* Breadcrumb for album navigation */}
          {currentAlbumName && (
            <motion.div
              className="pointer-events-auto"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: BREADCRUMB_SLIDE_DURATION }}
            >
              <button
                onClick={navigateBack}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-full border border-white/10 transition-all duration-300"
              >
                <svg
                  className="w-4 h-4 text-white/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="text-white/70 text-sm tracking-wide">
                  Back from{" "}
                  <span className="text-white/90">{currentAlbumName}</span>
                </span>
              </button>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Main infinite canvas - full screen */}
      <InfiniteCanvasWrapper
        items={displayItems}
        scaleOnHover={true}
        hoverScale={HOVER_SCALE}
      />
    </>
  );
}

export default function GalleryPage() {
  return (
    <GalleryWrapper>
      <InfiniteCanvasView />
    </GalleryWrapper>
  );
}
