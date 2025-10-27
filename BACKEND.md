# Momentarium Backend Architecture

## Overview
This is a simple Next.js backend architecture for personal use, featuring a single API endpoint for uploading images to Cloudinary (a free and easy-to-use cloud service).

## Architecture Components

### 1. API Routes (`/src/app/api/`)
- **`/api/upload`** - Main upload endpoint that handles image uploads to Cloudinary

### 2. Cloudinary Integration (`/src/lib/cloudinary/`)
- **`config.ts`** - Cloudinary configuration and utilities
- Handles image uploads, deletions, and URL generation
- Supports image transformations and optimizations

### 3. Frontend Utilities (`/src/lib/api/`)
- **`upload.ts`** - Client-side utilities for interacting with the upload API
- File validation and error handling

### 4. Test Components (`/src/components/`)
- **`ImageUploadTest.tsx`** - Demo component for testing uploads

## Setup Instructions

### 1. Cloudinary Setup
1. Go to [Cloudinary](https://cloudinary.com/) and create a free account
2. From your dashboard, copy:
   - Cloud Name
   - API Key 
   - API Secret

### 2. Environment Configuration
Update your `.env.local` file with your Cloudinary credentials:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_FOLDER=momentarium-temp
```

### 3. Install Dependencies
```bash
npm install cloudinary multer @types/multer
```

### 4. Test the Setup
1. Start your development server: `npm run dev`
2. Visit `/upload-test` to test the upload functionality
3. Check your Cloudinary dashboard to see uploaded images

## API Usage

### Upload Image
**POST** `/api/upload`

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `image` field containing the file

**Response:**
```json
{
  "success": true,
  "data": {
    "public_id": "upload_1234567890_abc123",
    "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/upload_1234567890_abc123.jpg",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "size": 245760,
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### Frontend Usage
```typescript
import { uploadImage } from '@/lib/api/upload';

const handleUpload = async (file: File) => {
  const result = await uploadImage(file);
  if (result.success) {
    console.log('Image URL:', result.data?.url);
  }
};
```

## Features
- ✅ Image upload to Cloudinary
- ✅ File validation (type and size)
- ✅ Automatic image optimization
- ✅ Unique file naming
- ✅ TypeScript support
- ✅ Error handling
- ✅ Test interface

## File Restrictions
- **Allowed types:** JPEG, PNG, WebP, GIF
- **Max size:** 10MB
- **Storage:** Temporary folder in Cloudinary

## Why Cloudinary?
- **Free tier:** Generous limits for personal projects
- **Easy integration:** Simple API and SDK
- **Automatic optimization:** Smart compression and format conversion
- **CDN delivery:** Fast global image delivery
- **Transformations:** On-the-fly image processing
- **Temporary storage:** Perfect for AI processing workflows

## Next Steps
You can now use the uploaded image URLs with any AI service by making API calls with the returned `url` from the upload response.