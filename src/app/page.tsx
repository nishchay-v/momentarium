'use client';

import Masonry from '@/components/MasonryWrapper';
import GalleryWrapper from '@/components/GalleryWrapper';
import Breadcrumb from '@/components/Breadcrumb';
import UploadModal from '@/components/UploadModal';
import { useGallery } from '@/components/GalleryProvider';
import { useState } from 'react';
import { Upload, Image as ImageIcon, Plus } from 'lucide-react';
import Link from 'next/link';

// MASONRY ANIMATION CONFIGURATION
// Animation duration for masonry items (seconds)
const MASONRY_DURATION = 0.6;
// Stagger delay between items (seconds)
const MASONRY_STAGGER = 0.05;
// Scale factor when hovering over masonry items
const MASONRY_HOVER_SCALE = 0.95;

function UploadMasonryView() {
  const { uploadedItems, items: contextItems, navigationStack } = useGallery();
  
  // Use context items if in album, otherwise use uploaded items
  const displayItems = navigationStack.length > 0 ? contextItems : uploadedItems;
  
  return (
    <>
      <Breadcrumb />
      <Masonry
        items={displayItems}
        ease="power3.out"
        duration={MASONRY_DURATION}
        stagger={MASONRY_STAGGER}
        animateFrom="bottom"
        scaleOnHover={true}
        hoverScale={MASONRY_HOVER_SCALE}
        blurToFocus={true}
        colorShiftOnHover={false}
      />
    </>
  );
}

function EmptyState({ onUploadClick }: { onUploadClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      <div className="p-6 bg-gray-100 rounded-full mb-6">
        <ImageIcon className="w-12 h-12 text-gray-400" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Upload Your First Images
      </h2>
      <p className="text-gray-600 text-center mb-8 max-w-md">
        Create your personal gallery by uploading images. You can organize them into albums and view them in fullscreen.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onUploadClick}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Upload className="w-5 h-5" />
          Upload Images
        </button>
        <Link
          href="/demo"
          className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          <ImageIcon className="w-5 h-5" />
          View Demo Gallery
        </Link>
      </div>
    </div>
  );
}

function UploadPageContent() {
  const { uploadedItems } = useGallery();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <div className="font-sans min-h-screen p-8 pb-20 sm:p-20">
      <main className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Gallery</h1>
            <p className="text-gray-600">
              {uploadedItems.length > 0 
                ? `${uploadedItems.length} image${uploadedItems.length !== 1 ? 's' : ''} in your gallery`
                : 'Upload images to get started'
              }
            </p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Upload
          </button>
        </div>

        {/* Content */}
        {uploadedItems.length > 0 ? (
          <UploadMasonryView />
        ) : (
          <EmptyState onUploadClick={() => setIsUploadModalOpen(true)} />
        )}

        {/* Upload Modal */}
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <GalleryWrapper>
      <UploadPageContent />
    </GalleryWrapper>
  );
}
