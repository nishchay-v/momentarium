// Configuration and environment variables

export const config = {
  database: {
    url: process.env.DATABASE_URL!,
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    s3BucketName: process.env.AWS_S3_BUCKET_NAME!,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY!,
  },
  qstash: {
    url: process.env.QSTASH_URL!,
    token: process.env.QSTASH_TOKEN!,
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    apiSecretKey: process.env.API_SECRET_KEY!,
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB per file
    maxBatchSize: 50, // Max images per batch
    allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    presignedUrlExpiry: 300, // 5 minutes
  },
};

// Validate required environment variables
export function validateEnv() {
  const required = [
    'DATABASE_URL',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET_NAME',
    'GEMINI_API_KEY',
    'QSTASH_TOKEN',
    'QSTASH_CURRENT_SIGNING_KEY',
    'API_SECRET_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}


