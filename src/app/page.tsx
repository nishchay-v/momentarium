'use client';

import Image from "next/image";

import Masonry from '@/components/MasonryWrapper';
import GalleryWrapper from '@/components/GalleryWrapper';

const items = [
  {
    id: "1",
    img: "https://picsum.photos/id/1015/600/900?grayscale",
    url: "https://example.com/one",
    height: 400,
  },
  {
    id: "2",
    img: "https://picsum.photos/id/1011/600/750?grayscale",
    url: "https://example.com/two",
    height: 250,
  },
  {
    id: "3",
    img: "https://picsum.photos/id/1020/600/800?grayscale",
    url: "https://example.com/three",
    height: 600,
  },
  {
    id: "4",
    img: "https://picsum.photos/id/1025/600/850?grayscale",
    url: "https://example.com/four",
    height: 350,
  },
  {
    id: "5",
    img: "https://picsum.photos/id/1035/600/700?grayscale",
    url: "https://example.com/five",
    height: 300,
  },
  {
    id: "6",
    img: "https://picsum.photos/id/1040/600/950?grayscale",
    url: "https://example.com/six",
    height: 450,
  },
  {
    id: "7",
    img: "https://picsum.photos/id/1050/600/650?grayscale",
    url: "https://example.com/seven",
    height: 280,
  },
  {
    id: "8",
    img: "https://picsum.photos/id/1060/600/800?grayscale",
    url: "https://example.com/eight",
    height: 380,
  },
];


export default function Home() {
  return (
    <GalleryWrapper>
      <div className="font-sans min-h-screen p-8 pb-20 sm:p-20">
        <main className="w-full max-w-7xl mx-auto">
          <Masonry
            items={items}
            ease="power3.out"
            duration={0.6}
            stagger={0.05}
            animateFrom="bottom"
            scaleOnHover={true}
            hoverScale={0.95}
            blurToFocus={true}
            colorShiftOnHover={false}
          />
        </main>
      </div>
    </GalleryWrapper>
  );
}
