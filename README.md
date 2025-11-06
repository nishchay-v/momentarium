# Momentarium - Gallery & Album System

A high-performance, animated masonry gallery with nested album support and cloud-based image uploads.

## Features

✅ **Responsive Masonry Grid** - Animated layout (1-5 columns)  
✅ **Fullscreen Gallery** - Keyboard, touch, and swipe navigation  
✅ **Album Support** - Nested collections with breadcrumb navigation  
✅ **Smart Image Caching** - Preload current and adjacent images  
✅ **Smooth Animations** - GSAP-powered transitions  
✅ **Cloud Upload System** - Upload images to Cloudinary via Next.js API  
✅ **Upload Modal** - Drag & drop interface with previews  
✅ **Type-Safe** - Full TypeScript support  

## Development Setup

### Frontend & Backend Architecture

This project runs with separated frontend and backend:
- **Frontend**: Runs on port 3000 (Next.js app)
- **Backend**: Runs on port 3001 (Next.js API routes)

### Running the Application

1. **Start both servers simultaneously:**
   ```bash
   npm run dev:full
   ```

2. **Start servers separately:**
   ```bash
   # Terminal 1 - Backend (port 3001)
   npm run dev:backend
   
   # Terminal 2 - Frontend (port 3000)  
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api/*

## Quick Start

### Basic Setup

```jsx
import Masonry from '@/components/MasonryWrapper';
import GalleryWrapper from '@/components/GalleryWrapper';
import Breadcrumb from '@/components/Breadcrumb';

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

### Backend Setup (for uploads)

1. **Create Cloudinary Account** - Sign up at [cloudinary.com](https://cloudinary.com)
2. **Configure Environment** - Add to `.env.local`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_FOLDER=momentarium-temp

# Frontend runs on 3000, Backend API on 3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

3. **Install Dependencies**:
```bash
npm install cloudinary multer @types/multer
```

4. **Start Development**:
```bash
# Option 1: Start both servers together
npm run dev:full

# Option 2: Start separately
npm run dev:backend  # Backend on port 3001
npm run dev          # Frontend on port 3000
```

### API Endpoints

- **Health Check**: `GET http://localhost:3001/api/health`
- **Upload Image**: `POST http://localhost:3001/api/upload`
- **Upload Response**:
```json
{
  "success": true,
  "data": {
    "public_id": "momentarium-temp/upload_123456789_abc123",
    "url": "https://res.cloudinary.com/...png",
    "width": 1248,
    "height": 832,
    "format": "png",
    "size": 617864,
    "created_at": "2025-11-06T15:24:48Z"
  }
}
```

### CORS Configuration

The backend includes CORS headers to allow cross-origin requests from the frontend:
- Frontend origin: `http://localhost:3000`
- Allowed methods: `GET, POST, OPTIONS`
- Supported content types: `Content-Type`

## Data Structure

### MediaItem Interface

```typescript
interface MediaItem {
  id: string;              // Unique identifier
  img: string;             // Image URL (local file or Cloudinary URL)
  type?: 'image' | 'album'; // Content type
  height: number;          // For masonry layout
  
  // Album-specific
  albumName?: string;      // Album title
  albumItems?: MediaItem[]; // Nested items
  
  // Upload-specific
  isUploaded?: boolean;    // Marks user-uploaded images
  file?: File;             // Original file reference
  
  // Optional
  url?: string;            // External link
}
```

## Components

### Masonry
Responsive grid layout with animations.

```jsx
<Masonry
  items={items}                  // MediaItem[]
  ease="power3.out"              // GSAP easing
  duration={0.6}                 // Animation duration
  stagger={0.05}                 // Delay between items
  animateFrom="bottom"           // Entry animation
  scaleOnHover={true}            // Hover effect
  hoverScale={0.95}              // Scale amount
  blurToFocus={true}             // Blur animation
  colorShiftOnHover={false}      // Color overlay
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

### UploadModal
Drag & drop image upload interface.

```jsx
import UploadModal from '@/components/UploadModal';

<UploadModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
```

**Features:**
- Drag & drop support
- Multiple file selection
- File validation (type & size)
- Preview thumbnails
- Progress feedback
- Auto-upload to Cloudinary

### Breadcrumb
Navigation for albums. Automatically shows when inside an album.

## API

### useGallery Hook

```typescript
const {
  items,              // Current MediaItem[]
  currentIndex,       // Active item index
  isOpen,             // Gallery open state
  imagesPreloaded,    // Current image loaded
  navigationStack,    // Album navigation history
  currentAlbumName,   // Current album name
  
  // Upload state
  uploadedItems,      // User-uploaded MediaItem[]
  isUploading,        // Upload in progress
  uploadError,        // Upload error message
  
  // Gallery actions
  openGallery,        // (items, index) => void
  closeGallery,       // () => void
  navigateToIndex,    // (index) => void
  openAlbum,          // (items, name) => void
  navigateBack,       // () => void
  
  // Upload actions
  addUploadedImages,  // (files) => Promise<void>
  deleteUploadedImage, // (id) => void
  clearUploadedImages, // () => void
} = useGallery();
```

### Upload API

```typescript
import { uploadImage } from '@/lib/api/upload';

// Upload single image
const result = await uploadImage(file);
if (result.success) {
  console.log('Cloudinary URL:', result.data?.url);
}

// Validate before upload
import { validateImageFile } from '@/lib/api/upload';
const validation = validateImageFile(file);
if (!validation.valid) {
  console.error(validation.error);
}
```

### Image Cache

```typescript
import { preloadImages, isImageCached } from '@/lib/imageCache';

// Preload images
await preloadImages(['url1.jpg', 'url2.jpg']);

// Check if cached
if (isImageCached('url1.jpg')) {
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
│   ├── imageCache.ts          # Centralized image cache
│   ├── imageStore.ts          # Upload processing & validation
│   ├── cloudinary/
│   │   └── config.ts          # Cloudinary configuration
│   └── api/
│       └── upload.ts          # Frontend upload utilities
├── components/
│   ├── GalleryProvider.tsx    # State management + preloading
│   ├── GalleryWrapper.tsx     # Provider wrapper
│   ├── Gallery.tsx            # Fullscreen viewer
│   ├── UploadModal.tsx        # Upload interface
│   ├── Masonry.jsx            # Grid layout
│   ├── MasonryWrapper.tsx     # SSR-safe wrapper
│   └── Breadcrumb.tsx         # Album navigation
├── app/
│   ├── api/
│   │   ├── upload/route.ts    # Upload API endpoint
│   │   └── health/route.ts    # Health check
│   └── page.tsx               # Main page
└── .env.local                 # Environment variables
```

## Backend API

### Endpoints

- **`POST /api/upload`** - Upload image to Cloudinary
- **`GET /api/health`** - API health check

### Upload Flow

1. **File Selection** - User picks images in UploadModal
2. **Validation** - Files checked for type/size limits
3. **Preview** - Thumbnails shown using base64
4. **Upload** - Files sent to `/api/upload` endpoint
5. **Cloudinary** - Images stored in cloud with optimization
6. **Gallery** - Images added to gallery with Cloudinary URLs

### File Restrictions

- **Types:** JPEG, PNG, WebP, GIF
- **Size:** Max 10MB per file
- **Storage:** Cloudinary free tier (25GB, 25k transformations/month)

## Performance

- **Instant display** - Images preloaded BEFORE gallery opens (zero delay!)
- **Zero flicker** on transitions
- **Single request** per image URL
- **Smart preloading** - Current image loads synchronously, adjacent images in parallel

## Examples

### Programmatic Control

```jsx
import { useGallery } from '@/components/GalleryProvider';

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

### Mixed Content with Uploads

```jsx
import { useGallery } from '@/components/GalleryProvider';
import UploadModal from '@/components/UploadModal';

function MyGallery() {
  const { uploadedItems, openGallery } = useGallery();
  const [showUpload, setShowUpload] = useState(false);
  
  const items = [
    // Static album
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
    // User uploads
    ...uploadedItems,
  ];

  return (
    <>
      <button onClick={() => setShowUpload(true)}>
        Upload Images
      </button>
      <Masonry items={items} />
      <UploadModal 
        isOpen={showUpload} 
        onClose={() => setShowUpload(false)} 
      />
    </>
  );
}
```

### AI Integration Example

```typescript
// After uploading to Cloudinary, send URL to AI service
const processWithAI = async (imageUrl: string) => {
  const response = await fetch('https://ai-service.com/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl })
  });
  
  return response.json();
};

// Use with uploaded images
const { uploadedItems } = useGallery();
uploadedItems.forEach(async (item) => {
  if (item.img && item.isUploaded) {
    const analysis = await processWithAI(item.img);
    console.log('AI Analysis:', analysis);
  }
});
```

## Troubleshooting

### Images not loading?
- Check network tab for errors
- Verify image URLs are accessible
- Check CORS headers
- For Cloudinary: verify credentials in `.env.local`

### Upload failing?
- Check Cloudinary credentials
- Verify file size (max 10MB)
- Check file type (JPEG, PNG, WebP, GIF only)
- Check browser console for API errors

### Gallery flickers?
- Should be fixed with `key={currentItem.id}`
- Check browser console for errors

### Albums not opening?
- Ensure `type: "album"` is set
- Verify `albumItems` array exists
- Check `openAlbum` is imported

### Backend API issues?
- Check `/api/health` endpoint
- Verify Next.js server is running
- Check server console for errors
- Verify environment variables are loaded

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile Safari (iOS 12+)
- Chrome Mobile (Android 8+)

## Tech Stack

- **Next.js 15+** - React framework with App Router
- **React 19+** - UI library
- **TypeScript** - Type safety
- **GSAP** - Animations
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Cloudinary** - Image storage & optimization
- **Multer** - File upload handling

## Additional Documentation

- **[BACKEND.md](./BACKEND.md)** - Detailed backend setup and API documentation
- **[TECHNICAL.md](./TECHNICAL.md)** - Technical implementation details

## License

[Your License Here]
