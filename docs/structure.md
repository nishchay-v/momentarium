# Project Structure

```
momentarium/
├── database/                    # Database schema and migrations
│   ├── schema.sql              # PostgreSQL schema definition
│   └── seed.sql                # Seed data for testing
│
├── docs/                        # Documentation
│   ├── architecture.md         # Detailed architecture documentation
│   ├── deployment.md           # Deployment guide
│   └── testing.md              # API testing guide
│
├── examples/                    # Example usage code
│   └── usage.ts                # Client SDK usage examples
│
├── scripts/                     # Utility scripts
│   ├── migrate.ts              # Database migration runner
│   └── setup.sh                # Development setup script
│
├── src/                         # Application source code
│   ├── app/                    # Next.js 14 App Router
│   │   ├── api/                # API Routes
│   │   │   ├── galleries/
│   │   │   │   ├── [galleryId]/
│   │   │   │   │   └── route.ts          # GET /api/galleries/[id]
│   │   │   │   └── process/
│   │   │   │       └── route.ts          # POST /api/galleries/process
│   │   │   ├── health/
│   │   │   │   └── route.ts              # GET /api/health
│   │   │   ├── jobs/
│   │   │   │   ├── [jobId]/
│   │   │   │   │   └── status/
│   │   │   │   │       └── route.ts      # GET /api/jobs/[id]/status
│   │   │   │   └── process/
│   │   │   │       └── route.ts          # POST /api/jobs/process (webhook)
│   │   │   └── uploads/
│   │   │       └── generate-urls/
│   │   │           └── route.ts          # POST /api/uploads/generate-urls
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Homepage
│   │
│   ├── config/                 # Configuration
│   │   └── index.ts            # Environment variables and app config
│   │
│   ├── lib/                    # Core libraries and utilities
│   │   ├── ai.ts               # Google Gemini AI client
│   │   ├── api-utils.ts        # API error handling utilities
│   │   ├── client.ts           # Frontend SDK for API
│   │   ├── db.ts               # PostgreSQL database client
│   │   ├── queue.ts            # Upstash QStash client
│   │   └── s3.ts               # AWS S3 client
│   │
│   └── types/                  # TypeScript type definitions
│       └── index.ts            # All type definitions
│
├── .env.example                # Example environment variables
├── .gitignore                  # Git ignore rules
├── next.config.js              # Next.js configuration
├── package.json                # Node.js dependencies and scripts
├── README.md                   # Main documentation
└── tsconfig.json               # TypeScript configuration
```

## Key Files Explained

### Configuration Files

**`package.json`**
- Dependencies: Next.js, PostgreSQL, AWS SDK, Gemini AI, QStash
- Scripts: dev, build, start, db:migrate
- All production-ready packages with specific versions

**`tsconfig.json`**
- TypeScript configuration for Next.js
- Path aliases (@/* points to src/*)
- Strict type checking enabled

**`next.config.js`**
- Next.js configuration
- Image domain allowlist
- Body size limit for uploads

**`.env.example`**
- Template for environment variables
- Documents all required configuration
- Copy to `.env` and fill in actual values

### Database

**`database/schema.sql`**
- Complete PostgreSQL schema
- Tables: users, images, albums, album_images, processing_jobs
- Indexes for performance
- Triggers for automatic timestamp updates

**`database/seed.sql`**
- Test data for development
- Sample users

**`scripts/migrate.ts`**
- Migration runner script
- Connects to database and executes schema.sql
- Optional seed data execution

### API Routes

**`src/app/api/uploads/generate-urls/route.ts`**
- Generates pre-signed S3 URLs
- Validates file types and batch size
- Returns array of upload URLs and storage keys

**`src/app/api/galleries/process/route.ts`**
- Creates image records in database
- Creates processing job
- Enqueues job to QStash
- Returns job ID immediately

**`src/app/api/jobs/process/route.ts`**
- Webhook endpoint called by QStash
- Fetches images from S3
- Calls Gemini AI
- Creates albums in database
- Updates job status

**`src/app/api/jobs/[jobId]/status/route.ts`**
- Returns current job status
- Provides completion timestamp
- Includes result URL when complete

**`src/app/api/galleries/[galleryId]/route.ts`**
- Fetches all albums for a user
- Includes images with temporary URLs
- Returns complete gallery structure

**`src/app/api/health/route.ts`**
- Health check endpoint
- Tests database connectivity
- Returns service status

### Core Libraries

**`src/lib/db.ts`**
- PostgreSQL connection pool
- Database query functions
- CRUD operations for all tables
- Transaction support

**`src/lib/s3.ts`**
- AWS S3 client initialization
- Pre-signed URL generation for uploads
- Pre-signed URL generation for downloads
- Batch operations
- File deletion

**`src/lib/ai.ts`**
- Google Gemini AI integration
- Prompt generation for album creation
- Image processing and base64 encoding
- Response parsing and validation
- Fallback album generation

**`src/lib/queue.ts`**
- Upstash QStash client
- Job enqueueing
- Signature verification
- API secret validation

**`src/lib/client.ts`**
- Frontend SDK for API consumption
- Simplified workflow methods
- Progress tracking
- Polling logic
- Complete upload-and-process workflow

**`src/lib/api-utils.ts`**
- Error handling utilities
- Custom ApiError class
- Async handler wrapper

### Type Definitions

**`src/types/index.ts`**
- Database model types
- API request/response types
- Internal payload types
- Complete type safety for entire application

### Configuration

**`src/config/index.ts`**
- Central configuration object
- Environment variable access
- Validation of required variables
- Default values and constants

### Frontend

**`src/app/layout.tsx`**
- Root layout component
- Metadata configuration
- HTML structure

**`src/app/page.tsx`**
- Homepage component
- API documentation links
- Quick start guide

### Documentation

**`README.md`**
- Complete project documentation
- Quick start guide
- API documentation
- Technology stack
- Deployment instructions

**`docs/architecture.md`**
- Detailed system architecture
- Data flow diagrams
- Component details
- Security model
- Performance characteristics

**`docs/deployment.md`**
- Step-by-step deployment guide
- Multiple platform options (Vercel, AWS, Docker)
- Database setup
- Post-deployment checklist
- Monitoring setup

**`docs/testing.md`**
- API testing examples
- curl commands
- HTTPie examples
- Automated testing script
- Common issues and solutions

### Examples

**`examples/usage.ts`**
- Complete workflow example
- Step-by-step example
- SDK usage patterns
- Best practices

### Scripts

**`scripts/setup.sh`**
- Automated setup script
- Checks prerequisites
- Creates .env file
- Installs dependencies
- Runs migrations

## Import Patterns

The project uses TypeScript path aliases for clean imports:

```typescript
// Instead of relative imports:
import { query } from '../../../lib/db';

// Use absolute imports:
import { query } from '@/lib/db';
```

## Development Workflow

1. **Setup**: Run `scripts/setup.sh` or follow manual steps in README
2. **Development**: `npm run dev` starts the development server
3. **Migration**: `npm run db:migrate` updates database schema
4. **Testing**: Use examples in `docs/testing.md`
5. **Building**: `npm run build` creates production build
6. **Deployment**: Follow `docs/deployment.md`

## Code Organization Principles

1. **Separation of Concerns**: Each file has a single, clear purpose
2. **Type Safety**: All types defined in central location
3. **Reusability**: Common utilities extracted to lib/
4. **API Routes**: One route per file following Next.js conventions
5. **Documentation**: Comprehensive docs for all aspects
6. **Examples**: Working code examples for common use cases

## Adding New Features

To add a new API endpoint:

1. Create route file in `src/app/api/[feature]/route.ts`
2. Add types to `src/types/index.ts`
3. Add database operations to `src/lib/db.ts` (if needed)
4. Update documentation in README and docs/
5. Add tests/examples

To add a new external service:

1. Create client in `src/lib/[service].ts`
2. Add configuration to `src/config/index.ts`
3. Add environment variables to `.env.example`
4. Update documentation

## File Naming Conventions

- **API Routes**: `route.ts` (Next.js convention)
- **Libraries**: kebab-case, e.g., `api-utils.ts`
- **Components**: PascalCase, e.g., `Button.tsx`
- **Types**: `index.ts` in types folder
- **Configuration**: `index.ts` in config folder
- **Documentation**: kebab-case, e.g., `deployment.md`


