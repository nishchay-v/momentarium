// API Route: GET /api/jobs/[jobId]/status
// Check the status of a processing job

import { NextRequest, NextResponse } from 'next/server';
import { jobDb } from '@/lib/db';
import type { JobStatusResponse } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      );
    }

    // Fetch job from database
    const job = await jobDb.findById(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Build response
    const response: JobStatusResponse = {
      status: job.status,
      jobId: job.id,
      createdAt: job.created_at,
      completedAt: job.completed_at || undefined,
      error: job.error_message || undefined,
    };

    // If completed, provide URL to fetch results
    if (job.status === 'completed') {
      response.resultUrl = `/api/galleries/${job.user_id}`;
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}


