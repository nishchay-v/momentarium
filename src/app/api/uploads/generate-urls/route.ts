// API Route: POST /api/uploads/generate-urls
// Generates pre-signed URLs for direct client-to-S3 uploads

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateBatchUploadUrls } from '@/lib/s3';
import { config } from '@/config';
import type { GenerateUploadUrlsRequest, GenerateUploadUrlsResponse } from '@/types';

// Request validation schema
const requestSchema = z.object({
  filenames: z.array(z.string()).min(1).max(config.upload.maxBatchSize),
  userId: z.number().int().positive(),
  contentTypes: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { filenames, userId, contentTypes } = validation.data;

    // Validate content types if provided
    const types = contentTypes || filenames.map(() => 'image/jpeg');
    for (const type of types) {
      if (!config.upload.allowedContentTypes.includes(type)) {
        return NextResponse.json(
          { error: `Content type ${type} is not allowed` },
          { status: 400 }
        );
      }
    }

    // Generate upload URLs
    const urls = await generateBatchUploadUrls(userId, filenames, types);

    const response: GenerateUploadUrlsResponse = {
      urls,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error generating upload URLs:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URLs' },
      { status: 500 }
    );
  }
}


