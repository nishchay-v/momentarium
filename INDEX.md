# Momentarium - Project Index

## 📋 Quick Navigation

This index provides a complete overview of all files in the Momentarium project and their purposes.

## 🗂️ File Tree

```
momentarium/
├── 📄 Configuration Files
│   ├── package.json                      # Dependencies & scripts
│   ├── package-lock.json                 # Locked dependency versions
│   ├── tsconfig.json                     # TypeScript configuration
│   ├── next.config.js                    # Next.js configuration
│   ├── components.json                   # UI components config
│   └── .env.example                      # Environment variables template
│
├── 📚 Documentation
│   ├── README.md                         # Main documentation (start here!)
│   ├── QUICKSTART.md                     # 5-minute quick reference
│   ├── IMPLEMENTATION.md                 # Implementation summary
│   ├── PROJECT_SUMMARY.md                # Complete project overview
│   ├── TECHNICAL.md                      # Technical specifications
│   └── docs/
│       ├── architecture.md               # System architecture details
│       ├── deployment.md                 # Deployment guide
│       ├── diagrams.md                   # Visual architecture diagrams
│       ├── structure.md                  # Project structure explanation
│       └── testing.md                    # API testing guide
│
├── 🗄️ Database
│   ├── database/
│   │   ├── schema.sql                    # PostgreSQL schema (5 tables)
│   │   └── seed.sql                      # Test data
│   └── scripts/
│       └── migrate.ts                    # Database migration runner
│
├── 🛠️ Scripts
│   └── scripts/
│       ├── setup.sh                      # Automated setup script
│       └── migrate.ts                    # Database migration
│
├── 📝 Examples
│   └── examples/
│       └── usage.ts                      # Client SDK usage examples
│
└── 💻 Source Code
    └── src/
        ├── 🌐 API Routes (Next.js)
        │   └── app/api/
        │       ├── uploads/
        │       │   └── generate-urls/
        │       │       └── route.ts      # POST: Generate S3 upload URLs
        │       ├── galleries/
        │       │   ├── process/
        │       │   │   └── route.ts      # POST: Trigger AI processing
        │       │   └── [galleryId]/
        │       │       └── route.ts      # GET: Fetch gallery results
        │       ├── jobs/
        │       │   ├── process/
        │       │   │   └── route.ts      # POST: Background job webhook
        │       │   └── [jobId]/
        │       │       └── status/
        │       │           └── route.ts  # GET: Check job status
        │       └── health/
        │           └── route.ts          # GET: Health check
        │
        ├── 📦 Core Libraries
        │   └── lib/
        │       ├── db.ts                 # PostgreSQL client & operations
        │       ├── s3.ts                 # AWS S3 client & pre-signed URLs
        │       ├── ai.ts                 # Google Gemini AI integration
        │       ├── queue.ts              # Upstash QStash job queue
        │       ├── client.ts             # Frontend SDK
        │       ├── api-utils.ts          # API error handling
        │       ├── imageStore.ts         # Image state management
        │       ├── imageCache.ts         # Image caching
        │       └── demoData.ts           # Demo data utilities
        │
        ├── ⚙️ Configuration
        │   └── config/
        │       └── index.ts              # App configuration & env vars
        │
        ├── 📘 Type Definitions
        │   └── types/
        │       └── index.ts              # All TypeScript types
        │
        ├── 🎨 UI Components
        │   └── components/
        │       ├── Gallery.tsx           # Gallery display component
        │       ├── GalleryWrapper.tsx    # Gallery wrapper
        │       ├── GalleryProvider.tsx   # Gallery context provider
        │       ├── UploadModal.tsx       # Upload UI modal
        │       ├── Breadcrumb.tsx        # Navigation breadcrumb
        │       └── MasonryWrapper.tsx    # Masonry layout wrapper
        │
        ├── 🎣 React Hooks
        │   └── hooks/
        │       └── useIsClient.ts        # Client-side detection hook
        │
        └── 🖼️ App Pages
            └── app/
                ├── layout.tsx            # Root layout
                ├── page.tsx              # Homepage
                ├── globals.css           # Global styles
                ├── favicon.ico           # Favicon
                └── demo/
                    └── page.tsx          # Demo page
```

## 🎯 File Purposes

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Node.js dependencies, scripts, and project metadata |
| `tsconfig.json` | TypeScript compiler configuration and path aliases |
| `next.config.js` | Next.js framework configuration |
| `.env.example` | Template for environment variables (copy to `.env`) |

### Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| `README.md` | Complete project documentation | Everyone (start here!) |
| `QUICKSTART.md` | Quick reference guide | Developers |
| `IMPLEMENTATION.md` | Implementation summary | Technical leads |
| `PROJECT_SUMMARY.md` | Complete overview | Project managers |
| `docs/architecture.md` | System architecture | Architects |
| `docs/deployment.md` | Deployment guide | DevOps |
| `docs/testing.md` | Testing guide | QA/Developers |
| `docs/structure.md` | Project structure | Developers |
| `docs/diagrams.md` | Visual diagrams | Everyone |

### Database Files

| File | Purpose |
|------|---------|
| `database/schema.sql` | PostgreSQL schema (5 tables, indexes, triggers) |
| `database/seed.sql` | Test data for development |
| `scripts/migrate.ts` | Runs database migrations |

### API Routes

| Route | File | Method | Purpose |
|-------|------|--------|---------|
| `/api/uploads/generate-urls` | `src/app/api/uploads/generate-urls/route.ts` | POST | Generate pre-signed S3 URLs |
| `/api/galleries/process` | `src/app/api/galleries/process/route.ts` | POST | Initiate AI processing |
| `/api/jobs/process` | `src/app/api/jobs/process/route.ts` | POST | Background job webhook |
| `/api/jobs/[id]/status` | `src/app/api/jobs/[jobId]/status/route.ts` | GET | Check job status |
| `/api/galleries/[id]` | `src/app/api/galleries/[galleryId]/route.ts` | GET | Fetch gallery |
| `/api/health` | `src/app/api/health/route.ts` | GET | Health check |

### Core Libraries

| File | Purpose | Key Functions |
|------|---------|---------------|
| `src/lib/db.ts` | Database client | `query()`, `transaction()`, `userDb`, `imageDb`, `albumDb`, `jobDb` |
| `src/lib/s3.ts` | S3 operations | `generateUploadUrl()`, `generateDownloadUrl()`, `generateBatchUploadUrls()` |
| `src/lib/ai.ts` | AI integration | `generateAlbums()`, `createFallbackAlbum()` |
| `src/lib/queue.ts` | Job queue | `enqueueProcessingJob()`, `verifyQStashSignature()` |
| `src/lib/client.ts` | Frontend SDK | `MomentariumClient` class with `uploadAndProcess()` |
| `src/lib/api-utils.ts` | API utilities | `ApiError`, `handleApiError()`, `asyncHandler()` |

### Type Definitions

| File | Purpose |
|------|---------|
| `src/types/index.ts` | All TypeScript types, interfaces, and enums |

### UI Components

| File | Purpose |
|------|---------|
| `src/components/Gallery.tsx` | Gallery display component |
| `src/components/UploadModal.tsx` | File upload UI |
| `src/components/GalleryProvider.tsx` | State management context |

## 📊 File Statistics

| Category | Count | Lines of Code (approx) |
|----------|-------|------------------------|
| API Routes | 6 | ~800 |
| Core Libraries | 9 | ~1,500 |
| Type Definitions | 1 | ~200 |
| Database Files | 2 | ~150 |
| Documentation | 9 | ~3,500 |
| Configuration | 4 | ~150 |
| UI Components | 6 | ~500 |
| Examples | 1 | ~100 |
| **Total** | **38** | **~7,000** |

## 🔍 Where to Find...

### ...Configuration?
- Environment variables: `.env.example`
- TypeScript config: `tsconfig.json`
- Next.js config: `next.config.js`
- App config: `src/config/index.ts`

### ...API Implementation?
- All routes: `src/app/api/`
- Database operations: `src/lib/db.ts`
- S3 operations: `src/lib/s3.ts`
- AI integration: `src/lib/ai.ts`

### ...Documentation?
- Getting started: `README.md`
- Quick reference: `QUICKSTART.md`
- Architecture: `docs/architecture.md`
- Deployment: `docs/deployment.md`
- Testing: `docs/testing.md`

### ...Database Schema?
- Schema definition: `database/schema.sql`
- Migration script: `scripts/migrate.ts`
- Seed data: `database/seed.sql`

### ...Examples?
- Usage examples: `examples/usage.ts`
- Testing examples: `docs/testing.md`
- Client SDK: `src/lib/client.ts`

### ...Types?
- All types: `src/types/index.ts`
- Request/response types
- Database model types
- Internal types

## 🚀 Getting Started Flow

1. Read `README.md` for overview
2. Check `QUICKSTART.md` for quick setup
3. Copy `.env.example` to `.env` and configure
4. Run `scripts/setup.sh` or manual setup
5. Use `examples/usage.ts` for integration
6. Refer to `docs/` for detailed guides

## 🛠️ Development Flow

1. **Setup**: `npm install` + `npm run db:migrate`
2. **Develop**: Edit files in `src/`
3. **Test**: Use examples from `docs/testing.md`
4. **Deploy**: Follow `docs/deployment.md`

## 📚 Documentation Hierarchy

```
README.md (Start here!)
├── QUICKSTART.md (Quick reference)
├── IMPLEMENTATION.md (What was built)
├── PROJECT_SUMMARY.md (Complete overview)
└── docs/
    ├── architecture.md (How it works)
    ├── deployment.md (How to deploy)
    ├── testing.md (How to test)
    ├── structure.md (How it's organized)
    └── diagrams.md (Visual guides)
```

## 🎯 Key Entry Points

### For Users
- Start: `README.md`
- Quick start: `QUICKSTART.md`
- API docs: `README.md` → API Documentation section

### For Developers
- Setup: `scripts/setup.sh`
- Code structure: `docs/structure.md`
- Examples: `examples/usage.ts`
- API implementation: `src/app/api/`

### For DevOps
- Deployment: `docs/deployment.md`
- Configuration: `.env.example`
- Database: `database/schema.sql`
- Health check: `/api/health`

### For Architects
- Architecture: `docs/architecture.md`
- Diagrams: `docs/diagrams.md`
- Technical summary: `IMPLEMENTATION.md`

## 🔗 Related Files

### Upload Flow
1. `src/app/api/uploads/generate-urls/route.ts` - Generate URLs
2. `src/lib/s3.ts` - S3 operations
3. `src/app/api/galleries/process/route.ts` - Trigger processing

### Processing Flow
1. `src/app/api/galleries/process/route.ts` - Initiate
2. `src/lib/queue.ts` - Queue job
3. `src/app/api/jobs/process/route.ts` - Process
4. `src/lib/ai.ts` - AI integration
5. `src/lib/db.ts` - Save results

### Retrieval Flow
1. `src/app/api/jobs/[jobId]/status/route.ts` - Check status
2. `src/app/api/galleries/[galleryId]/route.ts` - Fetch gallery
3. `src/lib/db.ts` - Database queries
4. `src/lib/s3.ts` - Generate image URLs

## 🎓 Learning Path

1. **Understand**: Read `README.md` and `docs/architecture.md`
2. **Setup**: Follow `QUICKSTART.md`
3. **Explore**: Look at `examples/usage.ts`
4. **Code**: Study files in `src/app/api/`
5. **Extend**: Use `docs/structure.md` as guide

---

**Index Version**: 1.0
**Last Updated**: Project completion
**Total Files**: 38


