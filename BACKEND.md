# Momentarium Backend Architecture

## Overview
This is a separated frontend/backend architecture for Momentarium, featuring dedicated API endpoints for image uploads to Cloudinary. The backend runs independently on port 3001 while the frontend runs on port 3000.

## Architecture Components

### 1. Server Configuration
- **Frontend**: Next.js app running on port 3000
- **Backend**: Next.js API routes running on port 3001
- **CORS**: Configured to allow cross-origin requests between frontend and backend
- **Environment**: Separate configurations for frontend and backend

### 2. API Routes (`/src/app/api/`)
- **`/api/health`** - Health check endpoint for backend status
- **`/api/upload`** - Main upload endpoint that handles image uploads to Cloudinary

### 3. Cloudinary Integration (`/src/lib/cloudinary/`)
- **`config.ts`** - Cloudinary configuration and utilities
- Uses base64 upload method for reliable file processing
- Handles image uploads, deletions, and URL generation
- Supports image transformations and optimizations

### 4. Frontend Utilities (`/src/lib/api/`)
- **`upload.ts`** - Client-side utilities for interacting with the upload API
- Automatically routes requests to backend on port 3001
- File validation and error handling
- Support for single and multiple file uploads

### 5. Integration with Existing Components
- **`UploadModal.tsx`** - Uses the backend API for uploads
- **`GalleryProvider.tsx`** - Handles Cloudinary URLs from backend responses
- **`imageStore.ts`** - Modified to upload to Cloudinary via the backend API

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
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_FOLDER=momentarium-temp

# Frontend runs on 3000, Backend API on 3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Install Dependencies
```bash
npm install cloudinary multer @types/multer
```

### 4. Development Scripts
```bash
# Start both frontend and backend together
npm run dev:full

# Start backend only (port 3001)
npm run dev:backend

# Start frontend only (port 3000)
npm run dev

# Alternative: Use the shell script
./start-servers.sh
```

### 5. Test the Setup
1. Start both servers: `npm run dev:full`
2. Frontend: http://localhost:3000
3. Backend health check: http://localhost:3001/api/health
4. Use the upload modal in the gallery to test uploads
5. Check your Cloudinary dashboard to see uploaded images
2. Use your existing upload modal in the gallery to test uploads
3. Check your Cloudinary dashboard to see uploaded images

## API Usage

### Health Check
**GET** `/api/health`

**Response:**
```json
{
  "status": "healthy",
  "message": "Momentarium API is running",
  "timestamp": "2025-11-06T15:24:48.000Z",
  "version": "1.0.0",
  "endpoints": {
    "health": "/api/health",
    "upload": "/api/upload"
  }
}
```

### Upload Image
**POST** `/api/upload`

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `image` field containing the file
- CORS: Supports cross-origin requests from `http://localhost:3000`

**Response:**
```json
{
  "success": true,
  "data": {
    "public_id": "momentarium-temp/upload_1762442683738_5h0aps7l3cv",
    "url": "https://res.cloudinary.com/dz2rdtwzs/image/upload/v1762442688/momentarium-temp/upload_1762442683738_5h0aps7l3cv.png",
    "width": 1248,
    "height": 832,
    "format": "png",
    "size": 617864,
    "created_at": "2025-11-06T15:24:48Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "File size too large. Maximum 10MB allowed."
}
```

### Frontend Usage
Your existing `UploadModal` component automatically uses the backend now. The upload flow is:

1. **File Selection** - User selects images in the UploadModal
2. **Preview** - Files are shown as previews (base64)
3. **Upload** - When "Add to Gallery" is clicked, files are uploaded to Cloudinary
4. **Gallery Integration** - Uploaded images appear in your gallery with Cloudinary URLs

The upload process is seamless and integrated with your existing UI.

## Features
- ✅ Separated frontend/backend architecture
- ✅ Cross-origin resource sharing (CORS) support
- ✅ Health check endpoint for monitoring
- ✅ Image upload to Cloudinary via base64 method
- ✅ File validation (type and size)
- ✅ Automatic image optimization
- ✅ Unique file naming with timestamps
- ✅ TypeScript support throughout
- ✅ Comprehensive error handling
- ✅ Environment-based configuration
- ✅ Multiple server startup options

## CORS Configuration
The backend includes proper CORS headers to support cross-origin requests:
- **Allowed Origin**: `http://localhost:3000` (frontend)
- **Allowed Methods**: `GET, POST, OPTIONS`
- **Allowed Headers**: `Content-Type`
- **Preflight Support**: OPTIONS requests handled automatically

## Server Management
- **Frontend Port**: 3000 (Next.js app)
- **Backend Port**: 3001 (API routes)
- **Concurrent Running**: Both servers can run simultaneously
- **Health Monitoring**: `/api/health` endpoint for backend status
- **Environment Variables**: Separate configs for frontend and backend

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
You can now use the uploaded image URLs with any AI service by making API calls with the returned `url` from the upload response. The separated architecture allows for:

1. **Scalability**: Backend can be deployed independently
2. **Development**: Frontend and backend can be developed separately
3. **Testing**: API endpoints can be tested independently
4. **Integration**: Easy integration with external services and AI APIs
5. **Monitoring**: Health checks and logging for backend services

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure backend is running on port 3001 and frontend on 3000
2. **Environment Variables**: Restart servers after changing `.env.local`
3. **Cloudinary Errors**: Verify credentials and API limits
4. **Port Conflicts**: Check if ports 3000/3001 are available

### Debugging
- Check backend logs in the terminal running `npm run dev:backend`
- Use browser dev tools to inspect network requests
- Test API directly: `curl http://localhost:3001/api/health`
- Verify environment variables are loaded correctly