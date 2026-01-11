# Technical Documentation

## System Architecture

### Overview

Momentarium uses a centralized state management system with smart image caching for optimal performance.

```
App
 └─ GalleryWrapper (Provider)
     └─ GalleryProvider (Context + State)
         ├─ Breadcrumb (Album navigation)
         ├─ Masonry (Grid layout)
         └─ Gallery (Fullscreen viewer)
```

### Core Components

#### 1. Image Cache (`src/lib/imageCache.ts`)

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

**Benefits:**

- Shared across all components
- Prevents duplicate loads
- Promise-based for async operations

#### 2. Gallery Provider (`src/components/GalleryProvider.tsx`)

Central state management with smart preloading.

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

#### 3. Masonry (`src/components/Masonry.jsx`)

Responsive grid with animated positioning.

**Layout Algorithm:**

```javascript
// Calculate column positions
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

**Item Detection:**

```javascript
if (item.type === "album" && item.albumItems) {
  openAlbum(item.albumItems, item.albumName);
} else {
  openGallery(items, index);
}
```

#### 4. Gallery (`src/components/Gallery.tsx`)

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

**Animation:**

```javascript
useEffect(() => {
  if (loadedIndex !== currentIndex) return;

  const duration = isCached ? 0.15 : 0.25;
  gsap.fromTo(
    imageRef.current,
    { opacity: 0, scale: 0.95 },
    { opacity: 1, scale: 1, duration },
  );
}, [loadedIndex, currentIndex, isCached]);
```

#### 5. Breadcrumb (`src/components/Breadcrumb.tsx`)

Simple navigation component for albums.

```jsx
if (navigationStack.length === 0) return null;

return (
  <button onClick={navigateBack}>
    Back to {navigationStack.length > 1 ? "Previous Album" : "Gallery"}
  </button>
);
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
                 ↓
            Show image (cached = fast, uncached = spinner)
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

Images are preloaded **BEFORE** state changes for instant display:

```javascript
// In openGallery - preload BEFORE opening
const openGallery = async (items, startIndex) => {
  // Wait for current image to load before opening
  await preloadImages([items[startIndex].img]);

  setIsOpen(true); // Now open with image ready!
  setImagesPreloaded(true);

  // Preload adjacent immediately
  preloadImages(adjacentImages);
};

// In navigateToIndex - preload BEFORE navigating
const navigateToIndex = async (index) => {
  // Wait for next image to load before changing
  await preloadImages([items[index].img]);

  setCurrentIndex(index); // Change with image ready!
};
```

**Result:** Zero delay, instant display!

### 2. Cache-Aware Rendering

```javascript
const isCached = isImageCached(currentItem.img);

// Faster animation for cached images
const duration = isCached ? 0.15 : 0.25;

// Skip loading spinner for cached
{
  !isCached && loadedIndex !== currentIndex && <div>Loading...</div>;
}
```

### 3. GSAP Animation Performance

```jsx
style={{
  willChange: 'transform, width, height, opacity',
  backfaceVisibility: 'hidden'
}}
```

## State Management

### Context API Pattern

```typescript
// Provider
export const GalleryProvider = ({ children }) => {
  const [state, setState] = useState(...);

  const value = { state, actions };

  return (
    <GalleryContext.Provider value={value}>
      {children}
    </GalleryContext.Provider>
  );
};

// Consumer
export const useGallery = () => {
  const context = useContext(GalleryContext);
  if (!context) throw new Error('...');
  return context;
};
```

### Navigation Stack Pattern

```javascript
// Push
setNavigationStack([...navigationStack, currentItems]);

// Pop
const previousItems = navigationStack[navigationStack.length - 1];
setNavigationStack(navigationStack.slice(0, -1));
setItems(previousItems);
```

## Event Handling

### Click Handler

```javascript
const handleItemClick = (item) => {
  if (item.type === "album" && item.albumItems) {
    openAlbum(item.albumItems, item.albumName || "Album");
  } else {
    const index = items.findIndex((i) => i.id === item.id);
    openGallery(items, index);
  }
};
```

### Keyboard Navigation

```javascript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape': onClose(); break;
      case 'ArrowLeft': handlePrevious(); break;
      case 'ArrowRight': handleNext(); break;
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isOpen]);
```

### Touch/Swipe

```javascript
const handleTouchStart = (e) => {
  setTouchStart(e.targetTouches[0].clientX);
};

const handleTouchEnd = () => {
  const distance = touchStart - touchEnd;
  if (distance > 50) handleNext();
  if (distance < -50) handlePrevious();
};
```

## TypeScript Types

```typescript
// Core type
export interface MediaItem {
  id: string;
  img: string;
  url?: string;
  height: number;
  type?: "image" | "album";
  albumItems?: MediaItem[];
  albumName?: string;
}

// Context type
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
```

## Best Practices

### 1. Always Set Type

```javascript
// Good
{ id: "1", img: "url.jpg", type: "image", height: 400 }
{ id: "2", img: "cover.jpg", type: "album", albumItems: [...] }

// Bad (ambiguous)
{ id: "1", img: "url.jpg", height: 400 }
```

### 2. Use Unique IDs

```javascript
// Good
{ id: "album-1-photo-5", ... }
{ id: "unique-uuid-here", ... }

// Bad (potential collisions)
{ id: "1", ... }
{ id: "photo", ... }
```

### 3. Preload Strategically

```javascript
// Good - preload on mount
useEffect(() => {
  preloadImages(items.map(i => i.img));
}, []);

// Good - preload on hover
<div onMouseEnter={() => preloadImage(item.img)}>
```

### 4. Clean Up State

```javascript
const closeGallery = () => {
  setIsOpen(false);
  setTimeout(() => {
    setItems([]);
    setCurrentIndex(0);
    setImagesPreloaded(false);
  }, 300); // Wait for exit animation
};
```

## Debugging

### Enable Cache Logging

```javascript
// In imageCache.ts
export const preloadImage = async (url: string) => {
  console.log('[Cache] Preloading:', url);
  // ... rest
};
```

### Monitor State

```javascript
useEffect(() => {
  console.log("[Gallery State]", {
    itemCount: items.length,
    currentIndex,
    isOpen,
    stackDepth: navigationStack.length,
  });
}, [items, currentIndex, isOpen, navigationStack]);
```

### Check Performance

```javascript
// Measure preload time
const start = performance.now();
await preloadImages(urls);
console.log(
  `Preloaded ${urls.length} images in ${performance.now() - start}ms`,
);
```

## Common Issues

### Issue: Gallery flickers on navigation

**Solution:** Ensure `key={currentItem.id}` is on the img element

### Issue: Albums don't open

**Solution:** Check that `type: "album"` is set and `albumItems` exists

### Issue: Back button doesn't show

**Solution:** Breadcrumb only renders when `navigationStack.length > 0`

### Issue: Images load slowly

**Solution:** Check network throttling and cache status with `isImageCached()`

### Issue: Images appear stacked on the left during initial load (Fixed in v1.1)

**Problem:** Masonry items were rendering with default positioning before GSAP animations applied proper grid positions.

**Root Cause:** Race condition between container width measurement and grid calculation causing elements to render at `left: 0, top: 0`.

**Solution:** Set initial positions immediately in CSS instead of waiting for GSAP:

```jsx
style={{
  willChange: 'transform, width, height, opacity',
  transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
  width: `${item.w}px`,
  height: `${item.h}px`,
  opacity: hasMounted.current ? 1 : 0
}}
```

### Issue: Photos disappearing when returning from photo viewer in albums (Fixed in v1.1)

**Problem:** When users opened a photo from an album and closed the viewer, they would be taken out of the album context.

**Root Cause 1:** Demo page was using `navigationStack.length > 0` to determine item display, but this remained true after gallery closed while `contextItems` got cleared.

**Root Cause 2:** `closeGallery()` was clearing all items regardless of album context.

**Solutions:**

1. **Updated item selection logic** in demo page:

```tsx
// Before: Used navigationStack presence
const displayItems = navigationStack.length > 0 ? contextItems : demoItems;

// After: Use album context and item validity
const displayItems =
  currentAlbumName && contextItems.length > 0 ? contextItems : demoItems;
```

2. **Conditional item clearing** in `closeGallery()`:

```tsx
setTimeout(() => {
  if (!currentAlbumName) {
    // Only clear if we're not viewing an album
    setItems([]);
    setCurrentIndex(0);
    setImagesPreloaded(false);
  } else {
    // If in album, keep items but reset state
    setCurrentIndex(0);
    setImagesPreloaded(false);
  }
}, 300);
```

**Result:** Users can now navigate from album → photo viewer → back to album seamlessly.

## Future Enhancements

- Virtual scrolling for large galleries
- Lazy loading with intersection observer
- LRU cache eviction
- Offline cache persistence
- Video support
- Progressive image loading
- Image optimization pipeline
