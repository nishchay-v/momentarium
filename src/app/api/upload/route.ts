import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToCloudinary } from '@/lib/cloudinary/config';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    // Check if the request contains form data
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { 
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { 
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 10MB allowed.' },
        { 
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await uploadImageToCloudinary(buffer, {
      // Generate a unique public_id with timestamp
      public_id: `upload_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      // Apply quality optimization
      quality: 'auto'
    });

    // Return the upload result
    return NextResponse.json({
      success: true,
      data: {
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        size: uploadResult.bytes,
        created_at: uploadResult.created_at
      }
    }, { 
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Upload API Error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to upload image. Please try again.' 
      },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// GET method to check API health
export async function GET() {
  return NextResponse.json({
    message: 'Upload API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: '/api/upload - Upload an image file'
    }
  }, {
    headers: corsHeaders,
  });
}