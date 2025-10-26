// API Route: POST /api/galleries/process
// Initiates background processing of uploaded images

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { jobDb, imageDb } from '@/lib/db';
import { enqueueProcessingJob } from '@/lib/queue';
import { config } from '@/config';
import type { ProcessGalleryRequest, ProcessGalleryResponse } from '@/types';

// Request validation schema
const requestSchema = z.object({
  imageKeys: z.array(z.string()).min(1).max(config.upload.maxBatchSize),
  userId: z.number().int().positive(),
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

    const { imageKeys, userId } = validation.data;

    // Create image records in database for each storage key
    await Promise.all(
      imageKeys.map((storageKey) =>
        imageDb.create(userId, storageKey).catch((error) => {
          // If image already exists (duplicate key), that's okay
          if (error.code === '23505') {
            console.log('Image already exists:', storageKey);
          } else {
            throw error;
          }
        })
      )
    );

    // Create a processing job
    const job = await jobDb.create(userId, imageKeys);

    // Enqueue the job for background processing
    await enqueueProcessingJob(job.id, userId, imageKeys);

    const response: ProcessGalleryResponse = {
      jobId: job.id,
    };

    return NextResponse.json(response, { status: 202 }); // 202 Accepted
  } catch (error) {
    console.error('Error processing gallery request:', error);
    return NextResponse.json(
      { error: 'Failed to process gallery' },
      { status: 500 }
    );
  }
}


