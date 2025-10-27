import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Momentarium API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      'POST /api/upload': 'Upload an image file to Cloudinary',
      'GET /api/health': 'API health check',
    },
    version: '1.0.0'
  });
}