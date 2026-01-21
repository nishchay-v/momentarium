"use client";

import Masonry from "@/components/MasonryWrapper";
import GalleryWrapper from "@/components/GalleryWrapper";
import Breadcrumb from "@/components/Breadcrumb";
import UploadModal from "@/components/UploadModal";
import { UploadProvider, useUpload } from "@/components/UploadProvider";
import { useGallery } from "@/components/GalleryProvider";
import { useState, useEffect } from "react";
import {
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";

// MASONRY ANIMATION CONFIGURATION
// Animation duration for masonry items (seconds)
const MASONRY_DURATION = 0.6;
// Stagger delay between items (seconds)
const MASONRY_STAGGER = 0.05;
// Scale factor when hovering over masonry items
const MASONRY_HOVER_SCALE = 0.95;

function GalleryMasonryView({
  selectedIds,
  onToggleSelect,
  selectionMode,
}: {
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  selectionMode: boolean;
}) {
  const { galleryItems } = useUpload();
  const { items: contextItems, navigationStack } = useGallery();

  // Use context items if in album, otherwise use gallery items
  const displayItems =
    navigationStack.length > 0 ? contextItems : galleryItems;

  // Add selection overlay to items when in selection mode
  const itemsWithSelection = displayItems.map((item) => ({
    ...item,
    isSelected: selectedIds.has(item.id),
    onSelect: selectionMode ? () => onToggleSelect(item.id) : undefined,
  }));

  return (
    <>
      <Breadcrumb />
      <div className="relative">
        {selectionMode && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* Selection overlay grid - clicks are handled by items */}
          </div>
        )}
        <Masonry
          items={itemsWithSelection}
          ease="power3.out"
          duration={MASONRY_DURATION}
          stagger={MASONRY_STAGGER}
          animateFrom="bottom"
          scaleOnHover={!selectionMode}
          hoverScale={MASONRY_HOVER_SCALE}
          blurToFocus={!selectionMode}
          colorShiftOnHover={false}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
        />
      </div>
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
        No Images in Gallery
      </h2>
      <p className="text-gray-600 text-center mb-8 max-w-md">
        Upload images to your R2 bucket. They will appear here and on the main
        gallery page.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onUploadClick}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Upload className="w-5 h-5" />
          Upload Images
        </button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
      <p className="text-gray-600">Loading gallery...</p>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      <div className="p-6 bg-red-100 rounded-full mb-6">
        <AlertCircle className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Failed to Load Gallery
      </h2>
      <p className="text-gray-600 text-center mb-8 max-w-md">{error}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Retry
      </button>
    </div>
  );
}

function UploadPageContent() {
  const {
    galleryItems,
    isLoadingGallery,
    galleryError,
    fetchGalleryItems,
    deleteGalleryItems,
    isDeleting,
    deleteError,
  } = useUpload();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch gallery items on mount
  useEffect(() => {
    fetchGalleryItems();
  }, [fetchGalleryItems]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === galleryItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(galleryItems.map((item) => item.id)));
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    const result = await deleteGalleryItems(ids);
    if (result?.success) {
      setSelectedIds(new Set());
      setSelectionMode(false);
      setShowDeleteConfirm(false);
    }
  };

  const handlePublishSuccess = () => {
    // Gallery items are automatically refreshed by the provider
  };

  // Loading state
  if (isLoadingGallery && galleryItems.length === 0) {
    return (
      <div className="font-sans min-h-screen p-8 pb-20 sm:p-20">
        <main className="w-full max-w-7xl mx-auto">
          <LoadingState />
        </main>
      </div>
    );
  }

  // Error state
  if (galleryError && galleryItems.length === 0) {
    return (
      <div className="font-sans min-h-screen p-8 pb-20 sm:p-20">
        <main className="w-full max-w-7xl mx-auto">
          <ErrorState error={galleryError} onRetry={fetchGalleryItems} />
        </main>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen p-8 pb-20 sm:p-20">
      <main className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gallery Manager
            </h1>
            <p className="text-gray-600">
              {galleryItems.length > 0
                ? `${galleryItems.length} image${galleryItems.length !== 1 ? "s" : ""} in R2 bucket`
                : "Upload images to get started"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectionMode ? (
              <>
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  {selectedIds.size === galleryItems.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <button
                  onClick={handleCancelSelection}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={selectedIds.size === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedIds.size})
                </button>
              </>
            ) : (
              <>
                {galleryItems.length > 0 && (
                  <button
                    onClick={() => setSelectionMode(true)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Manage
                  </button>
                )}
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Upload
                </button>
              </>
            )}
          </div>
        </div>

        {/* Delete Error */}
        {deleteError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 font-medium">
              <AlertCircle className="w-4 h-4" />
              {deleteError}
            </div>
          </div>
        )}

        {/* Content */}
        {galleryItems.length > 0 ? (
          <GalleryMasonryView
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            selectionMode={selectionMode}
          />
        ) : (
          <EmptyState onUploadClick={() => setIsUploadModalOpen(true)} />
        )}

        {/* Upload Modal */}
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onPublishSuccess={handlePublishSuccess}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Delete Images
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete {selectedIds.size} image
                {selectedIds.size !== 1 ? "s" : ""}? This will remove them from
                both R2 storage and the gallery. This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function UploadPageClient() {
  return (
    <UploadProvider>
      <GalleryWrapper>
        <UploadPageContent />
      </GalleryWrapper>
    </UploadProvider>
  );
}
