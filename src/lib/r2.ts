import {
  S3Client,
  PutObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";

// R2 Configuration - uses S3-compatible API
// Required environment variables:
// - R2_ACCOUNT_ID: Cloudflare account ID
// - R2_ACCESS_KEY_ID: R2 access key
// - R2_SECRET_ACCESS_KEY: R2 secret key
// - R2_BUCKET_NAME: R2 bucket name
// - R2_PUBLIC_URL: Public URL prefix for the bucket (optional, for public access)

const getR2Client = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing R2 credentials. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables."
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

export interface R2UploadResult {
  key: string;
  bucket: string;
  publicUrl?: string;
}

/**
 * Upload a buffer to R2
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<R2UploadResult> {
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!bucketName) {
    throw new Error("Missing R2_BUCKET_NAME environment variable.");
  }

  const client = getR2Client();

  const params: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  };

  await client.send(new PutObjectCommand(params));

  return {
    key,
    bucket: bucketName,
    publicUrl: publicUrl ? `${publicUrl}/${key}` : undefined,
  };
}

/**
 * Upload multiple files to R2 in parallel
 */
export async function uploadMultipleToR2(
  files: Array<{ buffer: Buffer; key: string; contentType: string }>
): Promise<R2UploadResult[]> {
  const results = await Promise.all(
    files.map((file) => uploadToR2(file.buffer, file.key, file.contentType))
  );
  return results;
}

/**
 * Generate R2 keys for different image versions
 */
export function generateR2Keys(
  imageId: string,
  extension: string = "webp"
): { thumb: string; gallery: string } {
  return {
    thumb: `thumbs/${imageId}.${extension}`,
    gallery: `gallery/${imageId}.${extension}`,
  };
}
