'use client';

import { useGallery } from './GalleryProvider';
import { ChevronLeft } from 'lucide-react';

const Breadcrumb = () => {
  const { navigationStack, currentAlbumName, navigateBack } = useGallery();

  if (navigationStack.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <button
        onClick={navigateBack}
        className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 hover:bg-black/10 rounded-lg transition-colors duration-200 text-sm font-medium"
      >
        <ChevronLeft size={16} />
        <span>Back to {navigationStack.length > 1 ? 'Previous Album' : 'Gallery'}</span>
      </button>
      
      {currentAlbumName && (
        <div className="mt-2 text-2xl font-bold text-gray-800">
          {currentAlbumName}
        </div>
      )}
    </div>
  );
};

export default Breadcrumb;

