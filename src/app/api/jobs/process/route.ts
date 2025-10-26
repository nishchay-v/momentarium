// API Route: POST /api/jobs/process
// Webhook endpoint called by QStash to process images in the background

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { jobDb, imageDb, albumDb } from '@/lib/db';
import { generateDownloadUrl } from '@/lib/s3';
import { generateAlbums, createFallbackAlbum } from '@/lib/ai';
import { verifyApiSecret } from '@/lib/queue';
import type { JobQueuePayload } from '@/types';

// Request validation schema
const requestSchema = z.object({
  jobId: z.string().uuid(),
  userId: z.number().int().positive(),
  imageKeys: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from QStash or has valid API secret
    const apiSecret = request.headers.get('X-API-Secret');
    
    if (!apiSecret || !verifyApiSecret(apiSecret)) {
      // Could also verify QStash signature here
      console.error('Unauthorized job processing request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body: JobQueuePayload = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { jobId, userId, imageKeys } = validation.data;

    // Update job status to processing
    await jobDb.updateStatus(jobId, 'processing');

    console.log(`Processing job ${jobId} with ${imageKeys.length} images`);

    try {
      // Get image records from database
      const images = await imageDb.findByStorageKeys(imageKeys);

      if (images.length === 0) {
        throw new Error('No images found for the provided keys');
      }

      // Generate download URLs for the AI model
      const imageUrls = await Promise.all(
        images.map(async (image) => ({
          key: image.storage_key,
          url: await generateDownloadUrl(image.storage_key),
        }))
      );

      // Call AI model to generate albums
      let albumsResult;
      try {
        albumsResult = await generateAlbums(imageUrls);
      } catch (aiError) {
        console.error('AI generation failed, using fallback:', aiError);
        // Use fallback if AI fails
        albumsResult = createFallbackAlbum(imageKeys);
      }

      // Create albums and link images in the database
      for (const albumData of albumsResult.albums) {
        // Create the album
        const album = await albumDb.create(
          userId,
          albumData.title,
          albumData.theme
        );

        // Find image IDs for the keys in this album
        const albumImages = images.filter((img) =>
          albumData.image_keys.includes(img.storage_key)
        );
        const imageIds = albumImages.map((img) => img.id);

        // Link images to the album
        if (imageIds.length > 0) {
          await albumDb.addImages(album.id, imageIds);
        }

        console.log(`Created album "${album.title}" with ${imageIds.length} images`);
      }

      // Update job status to completed
      await jobDb.updateStatus(jobId, 'completed', albumsResult);

      console.log(`Job ${jobId} completed successfully`);

      return NextResponse.json(
        { success: true, jobId, albumsCreated: albumsResult.albums.length },
        { status: 200 }
      );
    } catch (processingError) {
      // Update job status to failed
      const errorMessage = processingError instanceof Error 
        ? processingError.message 
        : 'Unknown processing error';
      
      await jobDb.updateStatus(jobId, 'failed', undefined, errorMessage);

      console.error(`Job ${jobId} failed:`, processingError);

      return NextResponse.json(
        { error: 'Processing failed', details: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in job processing endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Add GET endpoint for debugging
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: 'Job processing webhook endpoint is active' },
    { status: 200 }
  );
}


