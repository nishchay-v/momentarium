# Technical Documentation

## System Architecture

### Overview

Momentarium uses a separated provider architecture:
- **GalleryProvider** - Handles viewing, navigation, and album state
- **UploadProvider** - Handles upload state (separation of concerns)

```
App
 └─ UploadProvider (optional, for upload pages)
     └─ GalleryWrapper (Provider)
         └─ GalleryProvider (Context + State)
             ├─ Breadcrumb (Album navigation)
             ├─ Masonry / InfiniteCanvas (Layout)
             └─ Gallery (Fullscreen viewer)
```

### Core Components

#### 1. Shared Types (`src/types/media.ts`)

Centralized type definitions to avoid circular imports.

```typescript
interface MediaItem {
  id: string;
  img: string;
  url?: string;
  height: number;
  type?: "image" | "album";
  albumItems?: MediaItem[];
  albumName?: string;
  isUploaded?: boolean;
  file?: File;
}
```

#### 2. Image Cache (`src/lib/imageCache.ts`)

Simple Map-based cache for tracking preloaded images.

```typescript
const cache = new Map<string, boolean>();

// API
preloadImage(url: string): Promise<void>
preloadImages(urls: string[]): Promise<void>
isImageCached(url: string): boolean
clearCache(): void
getCacheSize(): number
```

#### 3. Gallery Provider (`src/components/GalleryProvider.tsx`)

Focused on gallery viewing and album navigation only.

**State:**

```typescript
{
  items: MediaItem[]           // Current items
  currentIndex: number         // Active item
  isOpen: boolean              // Gallery state
  imagesPreloaded: boolean     // Load status
  navigationStack: MediaItem[][] // Album history
  currentAlbumName: string | null
}
```

**Preload Strategy:**

1. Current image (synchronous, before opening - INSTANT!)
2. Adjacent ±2 images (parallel, on open)
3. Remaining images (delayed 100ms, background)
4. Next image (synchronous, before navigation - INSTANT!)

#### 4. Upload Provider (`src/components/UploadProvider.tsx`)

Dedicated to upload functionality, separate from viewing.

**State:**

```typescript
{
  uploadedItems: MediaItem[]   // Uploaded images
  isUploading: boolean         // Upload in progress
  uploadError: string | null   // Error message
}
```

**Actions:**

```typescript
addUploadedImages(files: File[]): Promise<void>
deleteUploadedImage(id: string): void
clearUploadedImages(): void
```

#### 5. Masonry (`src/components/Masonry.jsx`)

Responsive grid with animated positioning.

**Layout Algorithm:**

```javascript
const colHeights = new Array(columns).fill(0);
const gap = 16;
const columnWidth = (width - totalGaps) / columns;

items.forEach((item) => {
  const col = colHeights.indexOf(Math.min(...colHeights));
  const x = col * (columnWidth + gap);
  const y = colHeights[col];
  colHeights[col] += height + gap;
});
```

#### 6. Infinite Canvas (`src/components/InfiniteCanvas.tsx`)

Pannable and zoomable canvas view with physics-based interactions.

#### 7. Gallery (`src/components/Gallery.tsx`)

Fullscreen viewer with smooth transitions.

**Key Fix - No Flicker:**

```jsx
<img
  key={currentItem.id} // Forces React remount
  ref={imageRef}
  src={currentItem.img}
  style={{ opacity: 0 }} // Start invisible
  onLoad={() => setLoadedIndex(currentIndex)}
/>
```

## Data Flow

### Opening Gallery

```
User clicks image
  ↓
Masonry.handleItemClick()
  ↓
Check item.type
  ↓
  ├─ 'album' → openAlbum(items, name)
  │              ↓
  │         Push to navigation stack
  │              ↓
  │         Render album in Masonry
  │
  └─ 'image' → openGallery(items, index)
                 ↓
            GalleryProvider updates state
                 ↓
            Preload images (3-tier)
                 ↓
            Gallery renders
```

### Upload Flow

```
User drops/selects files
  ↓
UploadModal validates files
  ↓
addUploadedImages(files)
  ↓
UploadProvider processes files
  ↓
uploadedItems state updated
  ↓
Masonry renders new items
```

### Album Navigation

```
navigationStack: [
  [homeItems],        // Level 0 - Home
  [album1Items],      // Level 1 - First album
  [album2Items]       // Level 2 - Nested album
]

navigateBack() → pop stack → render previous level
```

## Performance Optimizations

### 1. Instant Preloading

```javascript
const openGallery = async (items, startIndex) => {
  await preloadImages([items[startIndex].img]); // Wait first
  setIsOpen(true); // Then open
};
```

### 2. Cache-Aware Rendering

```javascript
const isCached = isImageCached(currentItem.img);
const duration = isCached ? 0.15 : 0.25;
```

### 3. GSAP Animation Performance

```jsx
style={{
  willChange: 'transform, width, height, opacity',
  backfaceVisibility: 'hidden'
}}
```

## Provider Composition

### Gallery-Only Page (e.g., main page)

```tsx
<GalleryWrapper>
  <InfiniteCanvasView />
</GalleryWrapper>
```

### Upload Page (needs both providers)

```tsx
<UploadProvider>
  <GalleryWrapper>
    <UploadPageContent />
  </GalleryWrapper>
</UploadProvider>
```

## TypeScript Types

```typescript
// Gallery Context
interface GalleryContextType {
  items: MediaItem[];
  currentIndex: number;
  isOpen: boolean;
  imagesPreloaded: boolean;
  navigationStack: MediaItem[][];
  currentAlbumName: string | null;
  openGallery: (items: MediaItem[], startIndex: number) => void;
  closeGallery: () => void;
  navigateToIndex: (index: number) => void;
  openAlbum: (albumItems: MediaItem[], albumName: string) => void;
  navigateBack: () => void;
}

// Upload Context
interface UploadContextType {
  uploadedItems: MediaItem[];
  isUploading: boolean;
  uploadError: string | null;
  addUploadedImages: (files: File[]) => Promise<void>;
  deleteUploadedImage: (id: string) => void;
  clearUploadedImages: () => void;
}
```

## Best Practices

### 1. Always Set Type

```javascript
{ id: "1", img: "url.jpg", type: "image", height: 400 }
{ id: "2", img: "cover.jpg", type: "album", albumItems: [...] }
```

### 2. Use Unique IDs

```javascript
{ id: "album-1-photo-5", ... }
{ id: "unique-uuid-here", ... }
```

### 3. Provider Composition

Only wrap with `UploadProvider` when upload functionality is needed.

## Common Issues

### Issue: Gallery flickers on navigation

**Solution:** Ensure `key={currentItem.id}` is on the img element

### Issue: Albums don't open

**Solution:** Check that `type: "album"` is set and `albumItems` exists

### Issue: Upload not working

**Solution:** Ensure component is wrapped with `UploadProvider`

### Issue: Images appear stacked on the left during initial load

**Solution:** Set initial positions immediately in CSS instead of waiting for GSAP

### Issue: Photos disappearing when returning from photo viewer in albums

**Solution:** Use `currentAlbumName` check instead of `navigationStack.length` for item display

## Future Enhancements

- Virtual scrolling for large galleries
- Lazy loading with intersection observer
- LRU cache eviction
- Offline cache persistence (IndexedDB)
- Video support
- Progressive image loading
