# Momentarium - Gallery & Album System

A high-performance, animated masonry gallery with nested album support.

## Features

✅ **Responsive Masonry Grid** - Animated layout (1-5 columns)  
✅ **Infinite Canvas** - Pannable gallery view  
✅ **Fullscreen Gallery** - Keyboard, touch, and swipe navigation  
✅ **Album Support** - Nested collections with breadcrumb navigation  
✅ **Smart Image Caching** - Preload current and adjacent images  
✅ **Upload Support** - Drag & drop image upload with preview  
✅ **Smooth Animations** - GSAP-powered transitions  
✅ **Type-Safe** - Full TypeScript support

## Quick Start

```jsx
import Masonry from "@/components/MasonryWrapper";
import GalleryWrapper from "@/components/GalleryWrapper";
import Breadcrumb from "@/components/Breadcrumb";

const items = [
  // Album
  {
    id: "album-1",
    img: "album-cover.jpg",
    type: "album",
    albumName: "My Album",
    height: 400,
    albumItems: [
      { id: "1-1", img: "photo1.jpg", type: "image", height: 350 },
      { id: "1-2", img: "photo2.jpg", type: "image", height: 450 },
    ],
  },
  // Single image
  {
    id: "2",
    img: "single.jpg",
    type: "image",
    height: 300,
  },
];

export default function Page() {
  return (
    <GalleryWrapper>
      <Breadcrumb />
      <Masonry items={items} />
    </GalleryWrapper>
  );
}
```

## Data Structure

### MediaItem Interface

```typescript
interface MediaItem {
  id: string; // Unique identifier
  img: string; // Image URL
  type?: "image" | "album"; // Content type
  height: number; // For masonry layout

  // Album-specific
  albumName?: string; // Album title
  albumItems?: MediaItem[]; // Nested items

  // Optional
  url?: string; // External link
  isUploaded?: boolean; // Upload marker
  file?: File; // Original file reference
}
```

## Components

### Masonry

Responsive grid layout with animations.

```jsx
<Masonry
  items={items} // MediaItem[]
  ease="power3.out" // GSAP easing
  duration={0.6} // Animation duration
  stagger={0.05} // Delay between items
  animateFrom="bottom" // Entry animation
  scaleOnHover={true} // Hover effect
  hoverScale={0.95} // Scale amount
  blurToFocus={true} // Blur animation
  colorShiftOnHover={false} // Color overlay
/>
```

### Infinite Canvas

Pannable and zoomable gallery view.

```jsx
<InfiniteCanvasWrapper
  items={items} // MediaItem[]
  scaleOnHover={true} // Hover effect
  hoverScale={0.97} // Scale amount
/>
```

### Gallery

Fullscreen image viewer.

**Keyboard Shortcuts:**

- `←` / `→` - Navigate
- `Esc` - Close

**Mobile:**

- Swipe left/right to navigate
- Tap background to close

### Breadcrumb

Navigation for albums. Automatically shows when inside an album.

## API

### useGallery Hook

For gallery viewing and album navigation.

```typescript
const {
  items, // Current MediaItem[]
  currentIndex, // Active item index
  isOpen, // Gallery open state
  imagesPreloaded, // Current image loaded
  navigationStack, // Album navigation history
  currentAlbumName, // Current album name
  openGallery, // (items, index) => void
  closeGallery, // () => void
  navigateToIndex, // (index) => void
  openAlbum, // (items, name) => void
  navigateBack, // () => void
} = useGallery();
```

### useUpload Hook

For image upload functionality (separate from gallery viewing).

```typescript
const {
  uploadedItems, // Uploaded MediaItem[]
  isUploading, // Upload in progress
  uploadError, // Error message
  addUploadedImages, // (files: File[]) => Promise<void>
  deleteUploadedImage, // (id: string) => void
  clearUploadedImages, // () => void
} = useUpload();
```

### Image Cache

```typescript
import { preloadImages, isImageCached } from "@/lib/imageCache";

// Preload images
await preloadImages(["url1.jpg", "url2.jpg"]);

// Check if cached
if (isImageCached("url1.jpg")) {
  // Image is ready
}
```

## How It Works

### Navigation Flow

```
Home Gallery
  ├─ Click image → Gallery viewer (instant, pre-loaded)
  └─ Click album → Album masonry grid
      ├─ Click image → Gallery viewer (album images only, instant)
      └─ Back button → Home gallery
```

### Instant Loading Strategy

Images are **preloaded BEFORE opening** the gallery for instant display:

1. **Before opening** - Current image preloaded synchronously (no delay!)
2. **On open** - Adjacent ±2 images preloaded immediately
3. **Background** - Remaining images preloaded (100ms delay)
4. **On navigate** - Next image preloaded before transition (instant!)

### Album Behavior

- Albums show a folder icon with item count
- Clicking an album opens its contents in masonry view
- Breadcrumb appears with "Back" button
- Navigation stack tracks history
- Gallery only shows images from current album

## Architecture

```
src/
├── types/
│   └── media.ts              # Shared MediaItem type
├── lib/
│   ├── imageCache.ts         # Centralized image cache
│   └── imageStore.ts         # Upload utilities
├── components/
│   ├── GalleryProvider.tsx   # Gallery state (viewing + albums)
│   ├── UploadProvider.tsx    # Upload state (separate concern)
│   ├── GalleryWrapper.tsx    # Gallery provider wrapper
│   ├── Gallery.tsx           # Fullscreen viewer
│   ├── InfiniteCanvas.tsx    # Pannable canvas view
│   ├── InfiniteCanvasWrapper.tsx # SSR-safe canvas wrapper
│   ├── Masonry.jsx           # Grid layout
│   ├── MasonryWrapper.tsx    # SSR-safe masonry wrapper
│   ├── UploadModal.tsx       # Upload dialog
│   └── Breadcrumb.tsx        # Album navigation
└── app/
    ├── page.tsx              # Infinite Canvas demo
    └── upload/
        └── page.tsx          # Upload gallery page
```

## Performance

- **Instant display** - Images preloaded BEFORE gallery opens (zero delay!)
- **Zero flicker** on transitions
- **Single request** per image URL
- **Smart preloading** - Current image loads synchronously, adjacent images in parallel

## Tech Stack

- **Next.js 14+** - React framework
- **React 18+** - UI library
- **TypeScript** - Type safety
- **GSAP** - Animations
- **Framer Motion** - UI animations
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
