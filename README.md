# Momentarium - Gallery & Album System

A high-performance, animated masonry gallery with nested album support.

## Features

✅ **Responsive Masonry Grid** - Animated layout (1-5 columns)  
✅ **Fullscreen Gallery** - Keyboard, touch, and swipe navigation  
✅ **Album Support** - Nested collections with breadcrumb navigation  
✅ **Smart Image Caching** - Preload current and adjacent images  
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
├── lib/
│   └── imageCache.ts          # Centralized image cache
├── components/
│   ├── GalleryProvider.tsx    # State management + preloading
│   ├── GalleryWrapper.tsx     # Provider wrapper
│   ├── Gallery.tsx            # Fullscreen viewer
│   ├── Masonry.jsx            # Grid layout
│   ├── MasonryWrapper.tsx     # SSR-safe wrapper
│   └── Breadcrumb.tsx         # Album navigation
└── app/
    └── page.tsx               # Main page
```

## Performance

- **Instant display** - Images preloaded BEFORE gallery opens (zero delay!)
- **Zero flicker** on transitions
- **Single request** per image URL
- **Smart preloading** - Current image loads synchronously, adjacent images in parallel

## Examples

### Programmatic Control

```jsx
import { useGallery } from "@/components/GalleryProvider";

function MyComponent() {
  const { openGallery, openAlbum } = useGallery();

  // Open gallery
  const handleImage = () => {
    openGallery(items, 0);
  };

  // Open album
  const handleAlbum = () => {
    openAlbum(albumItems, "My Album");
  };
}
```

### Mixed Content

```jsx
const items = [
  // Album
  {
    id: "album-1",
    img: "cover.jpg",
    type: "album",
    albumName: "Vacation 2024",
    height: 400,
    albumItems: [
      { id: "v1", img: "beach.jpg", type: "image", height: 350 },
      { id: "v2", img: "sunset.jpg", type: "image", height: 450 },
    ],
  },
  // Single image
  {
    id: "img-1",
    img: "portrait.jpg",
    type: "image",
    height: 500,
  },
  // Another album
  {
    id: "album-2",
    img: "work-cover.jpg",
    type: "album",
    albumName: "Work Events",
    height: 350,
    albumItems: [{ id: "w1", img: "meeting.jpg", type: "image", height: 300 }],
  },
];
```

## Troubleshooting

### Images not loading?

- Check network tab for errors
- Verify image URLs are accessible
- Check CORS headers

### Gallery flickers?

- Should be fixed with `key={currentItem.id}`
- Check browser console for errors

### Albums not opening?

- Ensure `type: "album"` is set
- Verify `albumItems` array exists
- Check `openAlbum` is imported

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile Safari (iOS 12+)
- Chrome Mobile (Android 8+)

## Tech Stack

- **Next.js 14+** - React framework
- **React 18+** - UI library
- **TypeScript** - Type safety
- **GSAP** - Animations
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## License

[Your License Here]
