# Deployment Guide

This guide covers deploying Momentarium to production.

## Vercel Deployment (Recommended)

Vercel is the recommended platform for deploying Next.js applications.

### Step 1: Prepare Your Repository

1. Ensure all code is committed to Git
2. Push to GitHub, GitLab, or Bitbucket

### Step 2: Create a Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Configure Environment Variables

Add all variables from `.env.example`:

```env
DATABASE_URL=postgresql://user:password@host:5432/momentarium
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET_NAME=xxx
GEMINI_API_KEY=xxx
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=xxx
QSTASH_CURRENT_SIGNING_KEY=xxx
QSTASH_NEXT_SIGNING_KEY=xxx
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
API_SECRET_KEY=xxx
```

**Important**: Set `NEXT_PUBLIC_APP_URL` to your actual Vercel URL.

### Step 4: Deploy

Click "Deploy" and wait for the build to complete.

### Step 5: Set Up Database

Use one of these PostgreSQL hosting options:

#### Option A: Vercel Postgres

1. In your Vercel project, go to Storage → Create Database
2. Select Postgres
3. Copy the connection string
4. Update `DATABASE_URL` in environment variables
5. Run migrations (see below)

#### Option B: Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Get connection string from Settings → Database
3. Update `DATABASE_URL` in environment variables

#### Option C: Neon

1. Create project at [neon.tech](https://neon.tech)
2. Get connection string
3. Update `DATABASE_URL` in environment variables

### Step 6: Run Database Migrations

You can run migrations in several ways:

**Method 1: Local migration (if you have access to production DB)**
```bash
DATABASE_URL="your-production-url" npm run db:migrate
```

**Method 2: Create a temporary deployment script**
Create `pages/api/migrate.ts`:
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Add authentication here!
  const secret = req.headers['x-migration-secret'];
  if (secret !== process.env.API_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { stdout, stderr } = await execAsync('npm run db:migrate');
    res.status(200).json({ success: true, stdout, stderr });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

Then call it once:
```bash
curl -X POST https://your-app.vercel.app/api/migrate \
  -H "X-Migration-Secret: your-secret"
```

**Delete this file after running!**

## AWS Elastic Beanstalk

### Prerequisites
- AWS CLI installed and configured
- Elastic Beanstalk CLI installed

### Steps

1. Initialize EB:
```bash
eb init -p node.js momentarium
```

2. Create environment:
```bash
eb create momentarium-prod
```

3. Set environment variables:
```bash
eb setenv DATABASE_URL=xxx AWS_ACCESS_KEY_ID=xxx ...
```

4. Deploy:
```bash
eb deploy
```

## Docker Deployment

### Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

### Build and run:

```bash
docker build -t momentarium .
docker run -p 3000:3000 --env-file .env momentarium
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/momentarium
      - AWS_REGION=${AWS_REGION}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_S3_BUCKET_NAME=${AWS_S3_BUCKET_NAME}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - QSTASH_TOKEN=${QSTASH_TOKEN}
      - QSTASH_CURRENT_SIGNING_KEY=${QSTASH_CURRENT_SIGNING_KEY}
      - QSTASH_NEXT_SIGNING_KEY=${QSTASH_NEXT_SIGNING_KEY}
      - NEXT_PUBLIC_APP_URL=http://localhost:3000
      - API_SECRET_KEY=${API_SECRET_KEY}
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=momentarium
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up -d
```

## Post-Deployment Checklist

- [ ] Test health endpoint: `curl https://your-app.com/api/health`
- [ ] Verify database connection
- [ ] Test file upload flow
- [ ] Check QStash webhook is reachable
- [ ] Verify S3 bucket permissions
- [ ] Test AI processing with sample images
- [ ] Set up monitoring/logging
- [ ] Configure domain name (if applicable)
- [ ] Enable HTTPS
- [ ] Set up backup strategy for database

## Monitoring

### Vercel

Vercel provides built-in analytics and logs. Check:
- Runtime Logs
- Build Logs
- Analytics

### External Monitoring

Consider adding:
- **Sentry** for error tracking
- **Datadog** or **New Relic** for APM
- **Better Stack** (formerly Logtail) for log management

### Health Checks

Set up automated health checks:
```bash
# Cron job to ping health endpoint
*/5 * * * * curl -f https://your-app.com/api/health || alert
```

## Scaling Considerations

### Database
- Use connection pooling (included with `pg` client)
- Consider read replicas for heavy traffic
- Set appropriate pool size in production

### Object Storage
- Enable S3 Transfer Acceleration for faster uploads
- Use CloudFront CDN for serving images

### Job Queue
- QStash automatically scales
- Consider splitting large batches if hitting timeouts

### Next.js
- Vercel automatically scales
- For self-hosted: Use load balancer + multiple instances

## Troubleshooting

### QStash can't reach webhook

- Ensure `NEXT_PUBLIC_APP_URL` is correct
- Verify endpoint is publicly accessible
- Check firewall rules
- For local testing, use ngrok:
  ```bash
  ngrok http 3000
  # Use ngrok URL as NEXT_PUBLIC_APP_URL
  ```

### Database connection issues

- Check connection string format
- Verify network access rules
- Ensure SSL is enabled if required
- Check connection pool limits

### Timeout errors

- Increase serverless function timeout (Vercel: 60s max on Pro)
- Consider breaking large image batches into smaller chunks
- Optimize AI prompt to reduce processing time


