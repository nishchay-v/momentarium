'use client';

import Masonry from '@/components/MasonryWrapper';
import GalleryWrapper from '@/components/GalleryWrapper';
import Breadcrumb from '@/components/Breadcrumb';
import { useGallery } from '@/components/GalleryProvider';
import { demoItems } from '@/lib/demoData';

function DemoMasonryView() {
  const { items: contextItems, navigationStack } = useGallery();
  
  // Use context items if in album, otherwise use demo items
  const displayItems = navigationStack.length > 0 ? contextItems : demoItems;
  
  return (
    <>
      <Breadcrumb />
      <Masonry
        items={displayItems}
        ease="power3.out"
        duration={0.6}
        stagger={0.05}
        animateFrom="bottom"
        scaleOnHover={true}
        hoverScale={0.95}
        blurToFocus={true}
        colorShiftOnHover={false}
      />
    </>
  );
}

export default function DemoPage() {
  return (
    <GalleryWrapper>
      <div className="font-sans min-h-screen p-8 pb-20 sm:p-20">
        <main className="w-full max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Demo Gallery</h1>
            <p className="text-gray-600">
              Explore our gallery features with sample images and albums
            </p>
          </div>
          <DemoMasonryView />
        </main>
      </div>
    </GalleryWrapper>
  );
}


