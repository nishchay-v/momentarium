'use client';

import Masonry from '@/components/MasonryWrapper';
import GalleryWrapper from '@/components/GalleryWrapper';
import Breadcrumb from '@/components/Breadcrumb';
import { useGallery } from '@/components/GalleryProvider';

const items = [
  {
    id: "album-1",
    img: "https://picsum.photos/id/1015/600/900?grayscale",
    type: "album",
    albumName: "Nature Collection",
    height: 400,
    albumItems: [
      {
        id: "album-1-1",
        img: "https://picsum.photos/id/10/600/800?grayscale",
        type: "image",
        height: 400,
      },
      {
        id: "album-1-2",
        img: "https://picsum.photos/id/11/600/750?grayscale",
        type: "image",
        height: 350,
      },
      {
        id: "album-1-3",
        img: "https://picsum.photos/id/12/600/900?grayscale",
        type: "image",
        height: 450,
      },
      {
        id: "album-1-4",
        img: "https://picsum.photos/id/13/600/700?grayscale",
        type: "image",
        height: 300,
      },
    ],
  },
  {
    id: "2",
    img: "https://picsum.photos/id/1011/600/750?grayscale",
    type: "image",
    height: 250,
  },
  {
    id: "album-2",
    img: "https://picsum.photos/id/1020/600/800?grayscale",
    type: "album",
    albumName: "Urban Scenes",
    height: 600,
    albumItems: [
      {
        id: "album-2-1",
        img: "https://picsum.photos/id/20/600/800?grayscale",
        type: "image",
        height: 400,
      },
      {
        id: "album-2-2",
        img: "https://picsum.photos/id/21/600/750?grayscale",
        type: "image",
        height: 350,
      },
      {
        id: "album-2-3",
        img: "https://picsum.photos/id/22/600/900?grayscale",
        type: "image",
        height: 500,
      },
    ],
  },
  {
    id: "4",
    img: "https://picsum.photos/id/1025/600/850?grayscale",
    type: "image",
    height: 350,
  },
  {
    id: "5",
    img: "https://picsum.photos/id/1035/600/700?grayscale",
    type: "image",
    height: 300,
  },
  {
    id: "6",
    img: "https://picsum.photos/id/1040/600/950?grayscale",
    type: "image",
    height: 450,
  },
  {
    id: "7",
    img: "https://picsum.photos/id/1050/600/650?grayscale",
    type: "image",
    height: 280,
  },
  {
    id: "8",
    img: "https://picsum.photos/id/1060/600/800?grayscale",
    type: "image",
    height: 380,
  },
];


function MasonryView() {
  const { items: contextItems, navigationStack } = useGallery();
  
  // Use context items if in album, otherwise use root items
  const displayItems = navigationStack.length > 0 ? contextItems : items;
  
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

export default function Home() {
  return (
    <GalleryWrapper>
      <div className="font-sans min-h-screen p-8 pb-20 sm:p-20">
        <main className="w-full max-w-7xl mx-auto">
          <MasonryView />
        </main>
      </div>
    </GalleryWrapper>
  );
}
