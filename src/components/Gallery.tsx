"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { isImageCached } from "@/lib/imageCache";
import { MediaItem } from "./GalleryProvider";
import Image from "next/image";
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";

/**
 * Get the gallery (full-size) URL for a media item.
 * Falls back to thumbnail if no gallery URL is available.
 */
const getGalleryUrl = (item: MediaItem): string => item.url || item.img;

// ANIMATION CONFIGURATION
// Gallery overlay fade-in duration
const OVERLAY_FADE_IN_DURATION = 0.3;
// Gallery overlay fade-out duration
const OVERLAY_FADE_OUT_DURATION = 0.2;
// Image fade-in duration for cached images (faster)
const CACHED_IMAGE_FADE_DURATION = 0.15;
// Image fade-in duration for uncached images
const UNCACHED_IMAGE_FADE_DURATION = 0.25;
// Initial image scale before fade-in
const INITIAL_IMAGE_SCALE = 0.95;
// Final image scale after fade-in
const FINAL_IMAGE_SCALE = 1;

// TOUCH INTERACTION CONFIGURATION
// Minimum swipe distance (px) to trigger navigation
const SWIPE_THRESHOLD = 50;

// ZOOM CONFIGURATION
// Maximum zoom level (200%)
const MAX_ZOOM_SCALE = 2;
// Minimum zoom level (100%)
const MIN_ZOOM_SCALE = 1;
// Pinch 
const PINCH_ZOOM_STEP = 20;
// Wheel zoom step
const WHEEL_ZOOM_STEP = 10;

// UI SIZES AND SPACING
// Close button icon size
const CLOSE_BUTTON_ICON_SIZE = 24;
// Navigation button icon size
const NAV_BUTTON_ICON_SIZE = 28;

// UI element heights for calculating available image space
const TOP_UI_HEIGHT = 24;
const BOTTOM_UI_HEIGHT = 160;
// Side navigation buttons width (p-3 = 12px + icon 28px + left/right-4 = 16px)
const SIDE_UI_WIDTH = 72;


interface GalleryProps {
  items: MediaItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const Gallery = ({
  items,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: GalleryProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  // Track which image URL has been loaded (use URL instead of index for reliability)
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  // Track if user is currently zoomed in (to disable swipe navigation)
  const [isZoomed, setIsZoomed] = useState(false);

  const currentItem = items[currentIndex];
  const currentUrl = currentItem ? getGalleryUrl(currentItem) : null;
  // Check if the gallery (full-size) image is cached
  const isCached = currentUrl ? isImageCached(currentUrl) : false;
  // Image is considered loaded if the loadedUrl matches current image
  const isLoaded = loadedUrl === currentUrl;

  // Reset zoom when navigating to a different image
  const resetZoom = useCallback(() => {
    if (transformRef.current) {
      transformRef.current.resetTransform(0); // Instant reset (0ms duration)
    }
    setIsZoomed(false);
  }, []);

  const handlePrevious = useCallback(() => {
    if (items.length <= 1) return;
    resetZoom();
    const newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    onNavigate(newIndex);
  }, [items, currentIndex, onNavigate, resetZoom]);

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    resetZoom();
    const newIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1;
    onNavigate(newIndex);
  }, [items, currentIndex, onNavigate, resetZoom]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrevious, handleNext]);

  // Animate gallery open/close
  useEffect(() => {
    if (!overlayRef.current) return;

    if (isOpen) {
      document.body.style.overflow = "hidden";
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: OVERLAY_FADE_IN_DURATION, ease: "power2.out" },
      );
    } else {
      document.body.style.overflow = "unset";
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: OVERLAY_FADE_OUT_DURATION,
        ease: "power2.out",
      });
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Reset loaded state when URL changes
  useEffect(() => {
    if (currentUrl && loadedUrl !== currentUrl) {
      setLoadedUrl(null);
    }
  }, [currentUrl, loadedUrl]);

  // Animate image when it loads
  useEffect(() => {
    if (!imageRef.current || !isLoaded) return;

    // Faster animation for cached images
    const duration = isCached
      ? CACHED_IMAGE_FADE_DURATION
      : UNCACHED_IMAGE_FADE_DURATION;

    gsap.fromTo(
      imageRef.current,
      { opacity: 0, scale: INITIAL_IMAGE_SCALE },
      { opacity: 1, scale: FINAL_IMAGE_SCALE, duration, ease: "power2.out" },
    );
  }, [isLoaded, isCached]);

  const handleImageLoad = useCallback(() => {
    if (currentUrl) {
      setLoadedUrl(currentUrl);
    }
  }, [currentUrl]);

  // Handle zoom state changes
  const handleZoomChange = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      const scale = ref.state.scale;
      setIsZoomed(scale > MIN_ZOOM_SCALE + 0.01); // Small threshold to handle floating point
    },
    []
  );

  // Touch handlers for mobile swipe (only when not zoomed)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return; // Don't track swipes when zoomed
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isZoomed) return; // Don't track swipes when zoomed
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (isZoomed) return; // Don't navigate when zoomed
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > SWIPE_THRESHOLD;
    const isRightSwipe = distance < -SWIPE_THRESHOLD;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  if (!isOpen || !currentItem) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white transition-colors duration-200 bg-black/20 rounded-full backdrop-blur-sm"
        aria-label="Close gallery"
      >
        <X size={CLOSE_BUTTON_ICON_SIZE} />
      </button>

      {/* Navigation buttons */}
      {items.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white/80 hover:text-white transition-colors duration-200 bg-black/20 rounded-full backdrop-blur-sm"
            aria-label="Previous image"
          >
            <ChevronLeft size={NAV_BUTTON_ICON_SIZE} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white/80 hover:text-white transition-colors duration-200 bg-black/20 rounded-full backdrop-blur-sm cursor-pointer"
            aria-label="Next image"
          >
            <ChevronRight size={NAV_BUTTON_ICON_SIZE} />
          </button>
        </>
      )}

      {/* Image counter */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 text-white/80 text-sm bg-black/20 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {items.length}
        </div>
      )}

      {/* Main image container */}
      <div
        ref={containerRef}
        className="absolute flex items-center justify-center"
        style={{
          top: TOP_UI_HEIGHT,
          bottom: BOTTOM_UI_HEIGHT,
          left: SIDE_UI_WIDTH,
          right: SIDE_UI_WIDTH,
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <TransformWrapper
          ref={transformRef}
          initialScale={MIN_ZOOM_SCALE}
          minScale={MIN_ZOOM_SCALE}
          maxScale={MAX_ZOOM_SCALE}
          centerOnInit={true}
          wheel={{ step: WHEEL_ZOOM_STEP }}
          pinch={{ step: PINCH_ZOOM_STEP }}
          doubleClick={{ mode: "reset" }}
          panning={{ disabled: !isZoomed }}
          onTransformed={handleZoomChange}
          alignmentAnimation={{ sizeX: 0, sizeY: 0 }}
        >
          <TransformComponent
            wrapperStyle={{
              width: "100%",
              height: "100%",
            }}
            contentStyle={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <Image
                key={currentItem.id}
                ref={imageRef}
                src={getGalleryUrl(currentItem)}
                alt={`Gallery image ${currentIndex + 1}`}
                className="object-contain shadow-2xl select-none"
                onLoad={handleImageLoad}
                style={{
                  opacity: 0,
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "auto",
                  height: "auto",
                }}
                width={currentItem.width}
                height={currentItem.height}
                draggable={false}
              />
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex gap-2 max-w-full overflow-x-auto p-4 pb-2 align-middle">
          {items.map((item: MediaItem, index: number) => (
            <button
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                if (index !== currentIndex) {
                  resetZoom();
                  onNavigate(index);
                }
              }}
              className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all duration-200 cursor-pointer ${index === currentIndex
                  ? "border-white scale-110"
                  : "border-white/30 hover:border-white/60"
                }`}
            >
              <Image
                src={item.img}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                width={item.width}
                height={item.height}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;
