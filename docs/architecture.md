# Architecture Documentation

## System Overview

Momentarium is an AI-powered image gallery service that automatically organizes photos into thematic albums. The system is built with a serverless-first architecture optimized for scalability and cost-efficiency.

## Core Principles

1. **Asynchronous Processing**: Long-running AI tasks are handled in the background
2. **Single AI Request**: Batch processing minimizes API calls
3. **Direct Uploads**: Client uploads directly to S3, bypassing the API server
4. **Serverless Native**: Designed for platforms like Vercel with stateless functions

## Architecture Diagram

```
┌──────────────┐
│   Client     │
│  (Browser)   │
└───────┬──────┘
        │
        │ 1. Request upload URLs
        ▼
┌──────────────────┐
│  Next.js API     │
│  /api/uploads/   │
│  generate-urls   │
└───────┬──────────┘
        │
        │ 2. Return pre-signed URLs
        ▼
┌──────────────────┐
│   Client         │
│                  │
│ 3. Upload files  │
│    directly      │
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│   AWS S3         │
│  (Storage)       │
└──────────────────┘

┌──────────────┐
│   Client     │
└───────┬──────┘
        │
        │ 4. Trigger processing
        ▼
┌──────────────────┐       ┌──────────────────┐
│  Next.js API     │──────▶│   PostgreSQL     │
│  /api/galleries/ │ 5.    │   (Database)     │
│  process         │ Create│                  │
└───────┬──────────┘  Job  └──────────────────┘
        │
        │ 6. Enqueue job
        ▼
┌──────────────────┐
│  Upstash QStash  │
│  (Job Queue)     │
└───────┬──────────┘
        │
        │ 7. Call webhook
        ▼
┌──────────────────┐
│  Next.js API     │
│  /api/jobs/      │───┐
│  process         │   │ 8. Fetch images
└───────┬──────────┘   │
        │              ▼
        │         ┌──────────┐
        │         │  AWS S3  │
        │         └──────────┘
        │
        │ 9. Send images + prompt
        ▼
┌──────────────────┐
│  Google Gemini   │
│  AI Model        │
└───────┬──────────┘
        │
        │ 10. Return albums JSON
        ▼
┌──────────────────┐
│  Next.js API     │
│  /api/jobs/      │───┐
│  process         │   │ 11. Save albums
└──────────────────┘   │
                       ▼
                ┌──────────────────┐
                │   PostgreSQL     │
                │   (Database)     │
                └──────────────────┘

┌──────────────┐
│   Client     │
└───────┬──────┘
        │
        │ 12. Poll status
        ▼
┌──────────────────┐       ┌──────────────────┐
│  Next.js API     │──────▶│   PostgreSQL     │
│  /api/jobs/      │ 13.   │                  │
│  [id]/status     │ Check └──────────────────┘
└──────────────────┘

┌──────────────┐
│   Client     │
└───────┬──────┘
        │
        │ 14. Fetch results
        ▼
┌──────────────────┐       ┌──────────────────┐
│  Next.js API     │──────▶│   PostgreSQL     │
│  /api/galleries/ │ 15.   │   + AWS S3       │
│  [id]            │ Get   │                  │
└──────────────────┘       └──────────────────┘
```

## Data Flow

### Upload Flow

1. **Client** requests upload URLs from API
2. **API** generates N pre-signed S3 URLs (valid for 5 minutes)
3. **Client** uploads each file directly to S3 using PUT requests
4. **Client** collects all storage keys for the uploaded files

### Processing Flow

1. **Client** sends storage keys to `/api/galleries/process`
2. **API** creates image records in database
3. **API** creates a processing job record (status: pending)
4. **API** enqueues job to QStash with webhook target
5. **API** returns job ID to client immediately (202 Accepted)

### Background Processing

1. **QStash** calls `/api/jobs/process` webhook with job data
2. **API** verifies request authenticity (API secret or signature)
3. **API** updates job status to "processing"
4. **API** fetches images from S3 and generates download URLs
5. **API** constructs prompt with all images
6. **API** makes single call to Gemini AI with images + prompt
7. **AI** analyzes images and returns JSON with albums
8. **API** parses response and creates album records
9. **API** links images to albums in join table
10. **API** updates job status to "completed"

### Retrieval Flow

1. **Client** polls `/api/jobs/{id}/status` every 3-5 seconds
2. **API** returns current job status from database
3. When status is "completed", client stops polling
4. **Client** fetches gallery data from `/api/galleries/{userId}`
5. **API** queries database for albums + images
6. **API** generates temporary download URLs for each image
7. **API** returns complete gallery with image URLs

## Component Details

### Next.js API Routes

| Route | Method | Purpose | Complexity |
|-------|--------|---------|------------|
| `/api/uploads/generate-urls` | POST | Generate pre-signed URLs | Simple |
| `/api/galleries/process` | POST | Initiate processing | Medium |
| `/api/jobs/process` | POST | Background worker (webhook) | Complex |
| `/api/jobs/[id]/status` | GET | Check job status | Simple |
| `/api/galleries/[id]` | GET | Fetch gallery | Medium |
| `/api/health` | GET | Health check | Simple |

### Database Schema

**Users**
- Primary table for user accounts
- Referenced by all other tables

**Images**
- Stores metadata for each uploaded image
- `storage_key`: S3 object key (unique)
- References user who uploaded

**Albums**
- AI-generated albums
- `title`: Creative album name from AI
- `theme_description`: Artistic description from AI

**Album_Images**
- Many-to-many join table
- Links images to albums
- `display_order`: Position within album

**Processing_Jobs**
- Tracks background job status
- `image_keys`: Array of S3 keys to process
- `result_data`: JSON response from AI
- Status: pending → processing → completed/failed

### External Services

**AWS S3**
- Object storage for images
- Pre-signed URLs for secure, direct uploads
- Private bucket with temporary signed URLs for downloads

**Google Gemini AI**
- Multimodal model (Gemini 1.5 Pro)
- Accepts images + text prompt
- Returns structured JSON response

**Upstash QStash**
- HTTP-based job queue
- Calls webhooks with retry logic
- Signature verification for security

**PostgreSQL**
- Relational database
- JSONB support for flexible data
- Connection pooling for serverless

## Security Model

### Upload Security

1. Pre-signed URLs expire after 5 minutes
2. URLs are restricted to PUT operations only
3. Content-Type is locked to image formats
4. Each URL is single-use (effectively)

### Webhook Security

1. API secret header verification
2. Optional QStash signature verification
3. Job ID validation (UUID format)
4. User ownership checks

### Database Security

1. Parameterized queries (SQL injection prevention)
2. Row-level user isolation via foreign keys
3. No direct user input in queries

### Image Access

1. S3 bucket is private by default
2. Images accessed via temporary signed URLs
3. URLs expire after 1 hour

## Scalability Considerations

### Horizontal Scaling

- **Next.js API Routes**: Auto-scale on Vercel
- **QStash**: Serverless queue, no scaling needed
- **PostgreSQL**: Connection pooling handles concurrent requests
- **S3**: Unlimited scalability

### Vertical Scaling

- **Database**: Upgrade instance size as needed
- **AI API**: Rate limits handled by queueing
- **Memory**: Serverless functions auto-allocate

### Cost Optimization

1. **Single AI Call**: Process all images in one request
2. **Direct Uploads**: Avoid bandwidth through API
3. **Temporary URLs**: Reduce storage access costs
4. **Connection Pooling**: Efficient database usage

## Performance Characteristics

### Expected Latency

| Operation | Latency |
|-----------|---------|
| Generate URLs | 100-300ms |
| Upload to S3 | 500ms-5s per image |
| Enqueue job | 200-500ms |
| AI processing | 10-60s (depends on batch size) |
| Status check | 50-150ms |
| Fetch gallery | 200-500ms |

### Bottlenecks

1. **AI Processing**: Longest step, 10-60s
2. **S3 Upload**: Network-dependent, parallel uploads help
3. **Database Queries**: Optimized with indexes

### Optimization Strategies

1. **Parallel Uploads**: Client uploads multiple files simultaneously
2. **Batch Processing**: Single AI call for entire batch
3. **Database Indexes**: Fast lookups on foreign keys
4. **CDN**: Serve images through CloudFront
5. **Caching**: Cache gallery responses (optional)

## Error Handling

### Graceful Degradation

1. **AI Failure**: Use fallback album (all images in one album)
2. **Partial Upload**: Process successfully uploaded images
3. **Timeout**: Mark job as failed, allow retry

### Retry Strategy

- **QStash**: Automatic retries with exponential backoff
- **S3 Uploads**: Client-side retry logic
- **Database**: Connection pool auto-reconnects

## Future Extensions

### Generative UI

After albums are created, trigger a second job:
1. Take album title + theme + images
2. Send to text-to-HTML AI model
3. Generate custom webpage for album
4. Store HTML and serve via custom URL

### Real-time Updates

Replace polling with WebSocket or Server-Sent Events:
1. Client establishes persistent connection
2. Server pushes status updates
3. No need for polling

### Multi-user Albums

Allow collaborative albums:
1. Add `album_permissions` table
2. Implement sharing logic
3. Add invitation system

### Advanced Filters

Add search and filter capabilities:
1. EXIF data extraction
2. Location-based grouping
3. Date range filtering
4. Face detection integration


