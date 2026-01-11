'use client';

import InfiniteCanvasWrapper from '@/components/InfiniteCanvasWrapper';
import GalleryWrapper from '@/components/GalleryWrapper';
import Breadcrumb from '@/components/Breadcrumb';
import { useGallery } from '@/components/GalleryProvider';
import { demoItems } from '@/lib/demoData';
import { Easing, motion } from 'framer-motion';

// ANIMATION CONFIGURATION
// Header fade-in delay (seconds)
const HEADER_FADE_DELAY = 0.5;
// Header fade-in duration (seconds)
const HEADER_FADE_DURATION = 0.6;
// Breadcrumb slide-in duration (seconds)
const BREADCRUMB_SLIDE_DURATION = 0.4;
// Easing curve for header animations
const HEADER_EASING: Easing = [0.22, 1, 0.36, 1];

// CANVAS CONFIGURATION
// Scale factor when hovering over items
const HOVER_SCALE = 0.97;

function DemoInfiniteCanvasView() {
  const { items: contextItems, currentAlbumName, navigateBack } = useGallery();
  
  // Use context items if we're currently in an album context
  const displayItems = currentAlbumName && contextItems.length > 0 ? contextItems : demoItems;
  
  return (
    <>
      {/* Header overlay - appears above the canvas */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-30 pointer-events-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: HEADER_FADE_DELAY, duration: HEADER_FADE_DURATION, ease: HEADER_EASING }}
      >
        <div className="flex items-center justify-between px-8 py-6">
          {/* Logo / Title */}
          <div className="pointer-events-auto">
            <h1 className="text-xl font-light tracking-[0.3em] text-white/80 uppercase">
              Momentarium
            </h1>
            <p className="text-xs text-white/40 tracking-[0.15em] uppercase mt-1">
              Infinite Gallery
            </p>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-white/70 text-sm tracking-wide">
                  Back from <span className="text-white/90">{currentAlbumName}</span>
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

export default function DemoPage() {
  return (
    <GalleryWrapper>
      <DemoInfiniteCanvasView />
    </GalleryWrapper>
  );
}
