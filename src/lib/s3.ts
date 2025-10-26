// AWS S3 Client for image storage
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '@/config';

// Initialize S3 client
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

/**
 * Generate a unique storage key for an image
 */
export function generateStorageKey(userId: number, filename: string): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `users/${userId}/${timestamp}-${sanitizedFilename}`;
}

/**
 * Generate a pre-signed URL for uploading an image
 */
export async function generateUploadUrl(
  storageKey: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: config.aws.s3BucketName,
    Key: storageKey,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: config.upload.presignedUrlExpiry,
  });

  return url;
}

/**
 * Generate a pre-signed URL for downloading/viewing an image
 */
export async function generateDownloadUrl(storageKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: config.aws.s3BucketName,
    Key: storageKey,
  });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: 3600, // 1 hour
  });

  return url;
}

/**
 * Get public URL for an image (if bucket is public)
 * For private buckets, use generateDownloadUrl instead
 */
export function getPublicUrl(storageKey: string): string {
  return `https://${config.aws.s3BucketName}.s3.${config.aws.region}.amazonaws.com/${storageKey}`;
}

/**
 * Delete an image from S3
 */
export async function deleteImage(storageKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: config.aws.s3BucketName,
    Key: storageKey,
  });

  await s3Client.send(command);
}

/**
 * Generate multiple upload URLs for batch upload
 */
export async function generateBatchUploadUrls(
  userId: number,
  filenames: string[],
  contentTypes: string[]
): Promise<Array<{ uploadUrl: string; storageKey: string; filename: string }>> {
  const urls = await Promise.all(
    filenames.map(async (filename, index) => {
      const storageKey = generateStorageKey(userId, filename);
      const contentType = contentTypes[index] || 'image/jpeg';
      const uploadUrl = await generateUploadUrl(storageKey, contentType);

      return {
        uploadUrl,
        storageKey,
        filename,
      };
    })
  );

  return urls;
}

export { s3Client };


