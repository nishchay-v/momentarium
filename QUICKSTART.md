# Quick Reference Guide

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Clone and install
git clone <repo-url> momentarium
cd momentarium
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your credentials

# 3. Setup database
npm run db:migrate

# 4. Start development server
npm run dev
```

Visit: http://localhost:3000

## 🔑 Environment Variables (Required)

```env
DATABASE_URL=postgresql://user:pass@host:5432/momentarium
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=your-bucket
GEMINI_API_KEY=AIza...
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=...
API_SECRET_KEY=random-secret-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📡 API Quick Reference

### Generate Upload URLs
```bash
curl -X POST http://localhost:3000/api/uploads/generate-urls \
  -H "Content-Type: application/json" \
  -d '{"filenames":["img.jpg"],"userId":1}'
```

### Process Gallery
```bash
curl -X POST http://localhost:3000/api/galleries/process \
  -H "Content-Type: application/json" \
  -d '{"imageKeys":["users/1/123-img.jpg"],"userId":1}'
```

### Check Status
```bash
curl http://localhost:3000/api/jobs/{jobId}/status
```

### Get Gallery
```bash
curl http://localhost:3000/api/galleries/1
```

## 💻 Client SDK Usage

```typescript
import { MomentariumClient } from '@/lib/client';

const client = new MomentariumClient({
  baseUrl: 'http://localhost:3000',
  userId: 1
});

// Complete workflow
const gallery = await client.uploadAndProcess(files);
```

## 📂 Key Files

| File | Purpose |
|------|---------|
| `src/app/api/uploads/generate-urls/route.ts` | Generate S3 URLs |
| `src/app/api/galleries/process/route.ts` | Trigger processing |
| `src/app/api/jobs/process/route.ts` | Background worker |
| `src/app/api/jobs/[jobId]/status/route.ts` | Job status |
| `src/app/api/galleries/[galleryId]/route.ts` | Get results |
| `src/lib/db.ts` | Database operations |
| `src/lib/s3.ts` | S3 operations |
| `src/lib/ai.ts` | Gemini AI integration |
| `src/lib/queue.ts` | QStash integration |
| `database/schema.sql` | Database schema |

## 🗄️ Database Tables

- **users** - User accounts
- **images** - Image metadata + S3 keys
- **albums** - AI-generated albums
- **album_images** - Image-album relationships
- **processing_jobs** - Background job status

## 🔄 Workflow

```
1. Request URLs  →  2. Upload to S3  →  3. Trigger Process
    ↓
4. Get Job ID  →  5. Poll Status  →  6. Fetch Gallery
```

## 🧪 Testing

```bash
# Health check
curl http://localhost:3000/api/health

# Full test
./scripts/test.sh  # See docs/testing.md
```

## 🚀 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Run migrations against production database
```

## 🐛 Common Issues

**"Database connection failed"**
- Check DATABASE_URL format
- Verify database is running
- Check network access

**"QStash webhook not receiving"**
- Ensure NEXT_PUBLIC_APP_URL is publicly accessible
- Use ngrok for local testing
- Verify API_SECRET_KEY matches

**"AI request failed"**
- Check GEMINI_API_KEY is valid
- Verify API quota
- Check image URLs are accessible

**"Pre-signed URL expired"**
- URLs expire in 5 minutes
- Generate new URLs if needed

## 📚 Documentation

- **README.md** - Complete guide
- **docs/architecture.md** - System design
- **docs/deployment.md** - Deployment guide
- **docs/testing.md** - Testing examples
- **docs/structure.md** - Project structure
- **IMPLEMENTATION.md** - Implementation summary

## 🔧 NPM Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
npm run db:migrate   # Run database migrations
```

## 🌐 Default URLs

- **Development**: http://localhost:3000
- **Health Check**: /api/health
- **API Base**: /api

## 🎯 Key Features

✅ Asynchronous processing
✅ Direct S3 uploads
✅ Single AI request per batch
✅ Automatic album generation
✅ Pre-signed URLs
✅ Job status tracking
✅ Error handling
✅ Type safety (TypeScript)

## 📦 Dependencies

```json
{
  "@google/generative-ai": "^0.21.0",
  "@upstash/qstash": "^2.7.32",
  "@aws-sdk/client-s3": "^3.621.0",
  "pg": "^8.12.0",
  "next": "^14.2.0",
  "zod": "^3.23.0"
}
```

## 🎓 Architecture Pattern

```
Client → API → S3 (upload)
Client → API → QStash → Webhook → AI → Database
Client → API → Database (fetch)
```

## 💡 Best Practices

1. **Upload**: Use parallel uploads for multiple images
2. **Polling**: Poll every 3-5 seconds for status
3. **Errors**: Always handle API errors gracefully
4. **URLs**: Regenerate if expired
5. **Batch Size**: Keep under 50 images per batch
6. **Environment**: Never commit .env file

## 🔐 Security Checklist

- [ ] Use HTTPS in production
- [ ] Rotate API keys regularly
- [ ] Enable S3 bucket encryption
- [ ] Use strong API_SECRET_KEY
- [ ] Implement user authentication
- [ ] Add rate limiting
- [ ] Monitor logs for suspicious activity

## 📊 Performance Tips

1. Upload images in parallel
2. Use appropriate image formats (WebP)
3. Enable CloudFront for S3
4. Use connection pooling (already configured)
5. Cache gallery responses (optional)

## 🎉 Success Indicators

✅ Health endpoint returns "healthy"
✅ Can generate upload URLs
✅ Files upload to S3 successfully
✅ Jobs complete without errors
✅ Albums are created correctly
✅ Gallery fetches complete data

## 📞 Support

- Check documentation in `docs/`
- Review examples in `examples/`
- Test with scripts in `scripts/`
- Read inline code comments

## 🚦 Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 202 | Accepted (job queued) |
| 400 | Bad request (validation error) |
| 401 | Unauthorized |
| 404 | Not found |
| 500 | Server error |
| 503 | Service unavailable |

## 🎨 Customization

**Change AI Prompt**: Edit `src/lib/ai.ts`
**Adjust Limits**: Edit `src/config/index.ts`
**Add Routes**: Create in `src/app/api/`
**Modify Schema**: Update `database/schema.sql`

---

**Ready to build?** Start with `npm run dev` and follow the README!


