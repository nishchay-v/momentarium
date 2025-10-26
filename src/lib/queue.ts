// QStash job queue client for background processing
import { Client } from '@upstash/qstash';
import { config } from '@/config';
import type { JobQueuePayload } from '@/types';

// Initialize QStash client
const qstashClient = new Client({
  token: config.qstash.token,
});

/**
 * Enqueue a job for processing images and generating albums
 */
export async function enqueueProcessingJob(
  jobId: string,
  userId: number,
  imageKeys: string[]
): Promise<string> {
  const payload: JobQueuePayload = {
    jobId,
    userId,
    imageKeys,
  };

  const targetUrl = `${config.app.url}/api/jobs/process`;

  try {
    const result = await qstashClient.publishJSON({
      url: targetUrl,
      body: payload,
      headers: {
        'X-API-Secret': config.app.apiSecretKey,
      },
      retries: 3,
    });

    console.log('Job enqueued successfully:', { jobId, messageId: result.messageId });
    return result.messageId;
  } catch (error) {
    console.error('Failed to enqueue job:', error);
    throw new Error('Failed to enqueue processing job');
  }
}

/**
 * Verify QStash signature to ensure request authenticity
 */
export async function verifyQStashSignature(
  signature: string,
  body: string
): Promise<boolean> {
  try {
    const { Receiver } = await import('@upstash/qstash');
    
    const receiver = new Receiver({
      currentSigningKey: config.qstash.currentSigningKey,
      nextSigningKey: config.qstash.nextSigningKey,
    });

    await receiver.verify({
      signature,
      body,
    });

    return true;
  } catch (error) {
    console.error('QStash signature verification failed:', error);
    return false;
  }
}

/**
 * Alternative simple verification using API secret
 */
export function verifyApiSecret(providedSecret: string): boolean {
  return providedSecret === config.app.apiSecretKey;
}


