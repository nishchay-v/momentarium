# Momentarium

An AI-powered image gallery service that automatically organizes your photos into thematic albums with creative titles and descriptions. Built with Next.js, PostgreSQL, AWS S3, and Google Gemini AI.

## 🌟 Features

- **Direct-to-S3 Uploads**: Client uploads images directly to S3 using pre-signed URLs, reducing server load
- **AI-Powered Organization**: Google Gemini analyzes your images and groups them into logical, thematic albums
- **Asynchronous Processing**: Background job processing ensures the UI stays responsive
- **Single AI Request**: Efficient batching minimizes API calls and costs
- **Scalable Architecture**: Serverless-native design using Next.js API Routes and Upstash QStash

## 🏗️ Architecture Overview

```mermaid
sequenceDiagram
    participant Client (Next.js)
    participant Backend API (Next.js)
    participant Object Storage (S3)
    participant Job Queue (QStash)
    participant Processing API (Next.js)
    participant AI Model (Gemini)
    participant Database (PostgreSQL)

    Client->>+Backend API: 1. POST /api/uploads/generate-urls
    Backend API-->>-Client: 2. Return N signed URLs

    loop For Each Image
        Client->>+Object Storage: 3. Upload image file directly
    end

    Client->>+Backend API: 4. POST /api/galleries/process
    Backend API->>+Database: 5. Create Job record
    Backend API->>+Job Queue: 6. Enqueue Job
    Backend API-->>-Client: 7. Return jobId

    Job Queue->>+Processing API: 8. Call /api/jobs/process
    Processing API->>+AI Model: 9. Analyze all images
    AI Model-->>-Processing API: 10. Return albums JSON

    Processing API->>+Database: 11. Create albums/images
    Processing API->>Database: 12. Update job status

    Client->>+Backend API: 13. Poll /api/jobs/{jobId}/status
    Backend API-->>-Client: 14. Return status/results
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- AWS account with S3 bucket
- Google Gemini API key
- Upstash QStash account (for job queue)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd momentarium
npm install
```

2. **Set up environment variables**

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/momentarium

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET_NAME=momentarium-images

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Upstash QStash
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_qstash_token
QSTASH_CURRENT_SIGNING_KEY=your_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key

# Next.js App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Security
API_SECRET_KEY=your_random_secret_key_here
```

3. **Set up the database**

Run the database migration:

```bash
npm run db:migrate
```

To also seed test data:

```bash
RUN_SEED=true npm run db:migrate
```

4. **Start the development server**

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 📚 API Documentation

### 1. Generate Upload URLs

**POST** `/api/uploads/generate-urls`

Request pre-signed URLs for uploading images directly to S3.

**Request Body:**
```json
{
  "filenames": ["photo1.jpg", "photo2.png"],
  "userId": 1,
  "contentTypes": ["image/jpeg", "image/png"]
}
```

**Response:**
```json
{
  "urls": [
    {
      "uploadUrl": "https://s3.amazonaws.com/...",
      "storageKey": "users/1/1234567890-photo1.jpg",
      "filename": "photo1.jpg"
    }
  ]
}
```

### 2. Process Gallery

**POST** `/api/galleries/process`

Initiate background processing to organize images into albums.

**Request Body:**
```json
{
  "imageKeys": ["users/1/1234567890-photo1.jpg", "users/1/1234567891-photo2.png"],
  "userId": 1
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 3. Check Job Status

**GET** `/api/jobs/{jobId}/status`

Poll this endpoint to check if processing is complete.

**Response:**
```json
{
  "status": "completed",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2025-10-26T10:00:00.000Z",
  "completedAt": "2025-10-26T10:00:45.000Z",
  "resultUrl": "/api/galleries/1"
}
```

Status values: `pending`, `processing`, `completed`, `failed`

### 4. Get Gallery

**GET** `/api/galleries/{userId}`

Retrieve all albums and images for a user.

**Response:**
```json
{
  "albums": [
    {
      "id": 1,
      "user_id": 1,
      "title": "Summer Adventures",
      "theme_description": "Vibrant memories of sunny days and outdoor exploration",
      "created_at": "2025-10-26T10:00:45.000Z",
      "updated_at": "2025-10-26T10:00:45.000Z",
      "images": [
        {
          "id": 1,
          "storage_key": "users/1/1234567890-photo1.jpg",
          "url": "https://s3.amazonaws.com/...",
          "original_filename": "photo1.jpg",
          "content_type": "image/jpeg"
        }
      ]
    }
  ]
}
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- **users**: User accounts
- **images**: Image metadata and S3 storage keys
- **albums**: Generated albums with AI-created titles and themes
- **album_images**: Many-to-many relationship between albums and images
- **processing_jobs**: Background job tracking

See `database/schema.sql` for the complete schema.

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| Object Storage | AWS S3 |
| AI Model | Google Gemini Pro Vision |
| Job Queue | Upstash QStash |
| ORM | Native pg (PostgreSQL client) |
| Validation | Zod |

## 🔧 Configuration

### Upload Limits

Edit `src/config/index.ts` to adjust:

```typescript
upload: {
  maxFileSize: 10 * 1024 * 1024, // 10MB per file
  maxBatchSize: 50, // Max images per batch
  allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  presignedUrlExpiry: 300, // 5 minutes
}
```

### AI Prompt Customization

Modify the prompt in `src/lib/ai.ts` to adjust how albums are generated:

```typescript
function generateAlbumCreationPrompt(imageKeys: string[]): string {
  // Customize the AI instructions here
}
```

## 🔐 Security Considerations

1. **API Secret**: The webhook endpoint (`/api/jobs/process`) is protected by an API secret header
2. **QStash Signature Verification**: Optionally verify QStash signatures for additional security
3. **Pre-signed URLs**: S3 upload URLs expire after 5 minutes
4. **User Authentication**: Add authentication middleware to protect user-specific routes (not implemented in this base version)

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

**Important**: Set `NEXT_PUBLIC_APP_URL` to your production URL so QStash can reach your webhook.

### Database Hosting Options

- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Supabase](https://supabase.com/)
- [Neon](https://neon.tech/)

## 🔄 Workflow Example

```typescript
// 1. Client requests upload URLs
const { urls } = await fetch('/api/uploads/generate-urls', {
  method: 'POST',
  body: JSON.stringify({
    filenames: ['photo1.jpg', 'photo2.jpg'],
    userId: 1,
    contentTypes: ['image/jpeg', 'image/jpeg']
  })
}).then(r => r.json());

// 2. Client uploads each file to S3
for (const { uploadUrl, storageKey } of urls) {
  await fetch(uploadUrl, {
    method: 'PUT',
    body: imageFile,
    headers: { 'Content-Type': 'image/jpeg' }
  });
}

// 3. Request processing
const imageKeys = urls.map(u => u.storageKey);
const { jobId } = await fetch('/api/galleries/process', {
  method: 'POST',
  body: JSON.stringify({ imageKeys, userId: 1 })
}).then(r => r.json());

// 4. Poll for completion
const pollStatus = setInterval(async () => {
  const { status, resultUrl } = await fetch(`/api/jobs/${jobId}/status`)
    .then(r => r.json());
  
  if (status === 'completed') {
    clearInterval(pollStatus);
    // 5. Fetch results
    const gallery = await fetch(resultUrl).then(r => r.json());
    console.log('Albums created:', gallery.albums);
  }
}, 3000);
```

## 📈 Future Enhancements

- **Generative UI**: Use album titles/themes to generate custom webpage layouts
- **Advanced Filtering**: Search and filter albums by date, location, or content
- **Sharing**: Share albums with custom links
- **Collaborative Albums**: Allow multiple users to contribute to albums
- **Video Support**: Extend to support video files
- **Face Recognition**: Group photos by people detected in images

## 🐛 Troubleshooting

### Database Connection Issues

Ensure your `DATABASE_URL` is correct and the database is accessible:

```bash
psql $DATABASE_URL -c "SELECT 1"
```

### QStash Webhook Issues

- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Ensure your webhook endpoint is publicly accessible (use ngrok for local testing)
- Check QStash logs in the Upstash dashboard

### AI Model Errors

- Verify `GEMINI_API_KEY` is valid
- Check API quota limits
- Review prompt structure in `src/lib/ai.ts`

## 📝 License

MIT License - feel free to use this project for your own applications.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

Built with ❤️ using Next.js and AI
