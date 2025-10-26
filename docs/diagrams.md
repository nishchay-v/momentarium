# Momentarium Architecture Diagrams

This document contains visual diagrams of the Momentarium architecture.

## System Architecture

```mermaid
graph TB
    subgraph Client["Client Application"]
        UI[User Interface]
        SDK[Momentarium SDK]
    end

    subgraph NextJS["Next.js Backend"]
        API1[Generate URLs API]
        API2[Process Gallery API]
        API3[Job Processor API]
        API4[Status Check API]
        API5[Gallery Fetch API]
    end

    subgraph Storage["AWS S3"]
        Bucket[Image Storage]
    end

    subgraph Queue["Upstash QStash"]
        JobQueue[Job Queue]
    end

    subgraph AI["Google Gemini"]
        Model[Vision Model]
    end

    subgraph Database["PostgreSQL"]
        Users[Users Table]
        Images[Images Table]
        Albums[Albums Table]
        AlbumImages[Album_Images Table]
        Jobs[Processing_Jobs Table]
    end

    UI --> SDK
    SDK --> API1
    API1 --> Bucket
    SDK --> Bucket
    SDK --> API2
    API2 --> Images
    API2 --> Jobs
    API2 --> JobQueue
    JobQueue --> API3
    API3 --> Bucket
    API3 --> Model
    API3 --> Albums
    API3 --> AlbumImages
    API3 --> Jobs
    SDK --> API4
    API4 --> Jobs
    SDK --> API5
    API5 --> Albums
    API5 --> AlbumImages
    API5 --> Images
    API5 --> Bucket

    style Client fill:#e1f5ff
    style NextJS fill:#fff3e0
    style Storage fill:#f3e5f5
    style Queue fill:#e8f5e9
    style AI fill:#fce4ec
    style Database fill:#fff9c4
```

## Sequence Diagram: Complete Upload Flow

```mermaid
sequenceDiagram
    actor User
    participant Client
    participant API as Next.js API
    participant S3 as AWS S3
    participant Queue as QStash
    participant Worker as Job Processor
    participant AI as Gemini AI
    participant DB as PostgreSQL

    Note over User,DB: Phase 1: Upload Preparation
    User->>Client: Select images
    Client->>API: POST /api/uploads/generate-urls
    API->>API: Generate pre-signed URLs
    API-->>Client: Return upload URLs + keys
    
    Note over User,DB: Phase 2: Direct Upload
    loop For each image
        Client->>S3: PUT image (direct upload)
        S3-->>Client: Upload complete
    end

    Note over User,DB: Phase 3: Processing Initiation
    Client->>API: POST /api/galleries/process
    API->>DB: Create image records
    API->>DB: Create job (status: pending)
    API->>Queue: Enqueue job
    API-->>Client: Return job ID (202 Accepted)

    Note over User,DB: Phase 4: Background Processing
    Queue->>Worker: POST /api/jobs/process (webhook)
    Worker->>DB: Update job (status: processing)
    Worker->>S3: Fetch images
    S3-->>Worker: Return images
    Worker->>AI: Send images + prompt
    AI-->>Worker: Return albums JSON
    Worker->>DB: Create albums
    Worker->>DB: Link images to albums
    Worker->>DB: Update job (status: completed)
    Worker-->>Queue: Success response

    Note over User,DB: Phase 5: Result Retrieval
    loop Poll every 3 seconds
        Client->>API: GET /api/jobs/{id}/status
        API->>DB: Check job status
        API-->>Client: Return status
    end

    Client->>API: GET /api/galleries/{userId}
    API->>DB: Fetch albums + images
    API->>S3: Generate download URLs
    API-->>Client: Return gallery with URLs
    Client-->>User: Display organized gallery
```

## Data Model Diagram

```mermaid
erDiagram
    USERS ||--o{ IMAGES : uploads
    USERS ||--o{ ALBUMS : owns
    USERS ||--o{ PROCESSING_JOBS : creates
    ALBUMS ||--o{ ALBUM_IMAGES : contains
    IMAGES ||--o{ ALBUM_IMAGES : belongs_to
    PROCESSING_JOBS ||--o{ ALBUMS : generates

    USERS {
        int id PK
        string email
        timestamp created_at
        timestamp updated_at
    }

    IMAGES {
        int id PK
        int user_id FK
        string storage_key UK
        string original_filename
        string content_type
        bigint file_size_bytes
        int width
        int height
        timestamp created_at
    }

    ALBUMS {
        int id PK
        int user_id FK
        string title
        text theme_description
        timestamp created_at
        timestamp updated_at
    }

    ALBUM_IMAGES {
        int album_id PK,FK
        int image_id PK,FK
        int display_order
        timestamp created_at
    }

    PROCESSING_JOBS {
        uuid id PK
        int user_id FK
        string status
        array image_keys
        jsonb result_data
        text error_message
        timestamp created_at
        timestamp started_at
        timestamp completed_at
    }
```

## State Diagram: Job Processing

```mermaid
stateDiagram-v2
    [*] --> Pending : Job Created
    Pending --> Processing : QStash triggers webhook
    Processing --> Completed : AI success + DB save
    Processing --> Failed : Error occurred
    Completed --> [*]
    Failed --> [*]

    note right of Pending
        Client polls for status
        Job enqueued in QStash
    end note

    note right of Processing
        Fetch images from S3
        Call Gemini AI
        Parse JSON response
        Create albums in DB
    end note

    note right of Completed
        Albums created
        Images linked
        Gallery ready
    end note

    note right of Failed
        Error logged
        Can retry manually
    end note
```

## Component Interaction Diagram

```mermaid
graph LR
    subgraph Frontend["Client SDK"]
        Upload[Upload Handler]
        Process[Process Handler]
        Poll[Status Poller]
        Fetch[Gallery Fetcher]
    end

    subgraph Backend["API Layer"]
        URLGen[URL Generator]
        JobInit[Job Initiator]
        Worker[Background Worker]
        Status[Status Checker]
        Gallery[Gallery Provider]
    end

    subgraph Services["External Services"]
        S3[AWS S3]
        Queue[QStash]
        AI[Gemini AI]
    end

    subgraph Data["Data Layer"]
        DB[PostgreSQL]
    end

    Upload --> URLGen
    URLGen --> S3
    Upload --> S3
    Process --> JobInit
    JobInit --> Queue
    JobInit --> DB
    Queue --> Worker
    Worker --> S3
    Worker --> AI
    Worker --> DB
    Poll --> Status
    Status --> DB
    Fetch --> Gallery
    Gallery --> DB
    Gallery --> S3

    style Frontend fill:#e3f2fd
    style Backend fill:#fff3e0
    style Services fill:#f3e5f5
    style Data fill:#e8f5e9
```

## Deployment Architecture

```mermaid
graph TB
    subgraph Internet["Internet"]
        Users[Users/Clients]
    end

    subgraph Vercel["Vercel Platform"]
        Edge[Edge Network]
        Functions[Serverless Functions]
        subgraph APIs["API Routes"]
            API1[/uploads/generate-urls]
            API2[/galleries/process]
            API3[/jobs/process]
            API4[/jobs/status]
            API5[/galleries/id]
        end
    end

    subgraph AWS["AWS"]
        S3[S3 Bucket]
        CloudFront[CloudFront CDN]
    end

    subgraph Upstash["Upstash"]
        QStash[QStash Queue]
    end

    subgraph Google["Google Cloud"]
        Gemini[Gemini AI API]
    end

    subgraph DBHost["Database Host"]
        Postgres[PostgreSQL]
    end

    Users --> Edge
    Edge --> Functions
    Functions --> APIs
    API1 --> S3
    API2 --> QStash
    API2 --> Postgres
    QStash --> API3
    API3 --> S3
    API3 --> Gemini
    API3 --> Postgres
    API4 --> Postgres
    API5 --> Postgres
    API5 --> S3
    S3 --> CloudFront
    CloudFront --> Users

    style Internet fill:#e1f5ff
    style Vercel fill:#000000,color:#ffffff
    style AWS fill:#ff9900
    style Upstash fill:#00e676
    style Google fill:#4285f4,color:#ffffff
    style DBHost fill:#336791,color:#ffffff
```

## Security Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant S3
    participant QStash
    participant Worker
    participant DB

    Note over Client,DB: Upload Security
    Client->>API: Request upload URL
    API->>API: Generate pre-signed URL<br/>(5 min expiry, PUT only)
    API-->>Client: Return signed URL
    Client->>S3: PUT image with signed URL
    S3->>S3: Verify signature
    S3-->>Client: Success/Failure

    Note over Client,DB: Webhook Security
    QStash->>Worker: POST /jobs/process
    Note over QStash,Worker: Include:<br/>X-API-Secret header<br/>QStash signature
    Worker->>Worker: Verify API secret
    Worker->>Worker: Verify QStash signature
    alt Unauthorized
        Worker-->>QStash: 401 Unauthorized
    else Authorized
        Worker->>DB: Process job
        Worker-->>QStash: 200 Success
    end

    Note over Client,DB: Data Access Security
    Client->>API: GET /galleries/{id}
    API->>DB: Query with user_id filter
    DB-->>API: Only user's data
    API->>S3: Generate temp URLs (1 hour)
    API-->>Client: Gallery with signed URLs
```

## Scaling Architecture

```mermaid
graph TB
    subgraph LoadBalancer["Load Balancer"]
        LB[Nginx/Vercel Edge]
    end

    subgraph APIInstances["API Instances"]
        API1[Instance 1]
        API2[Instance 2]
        API3[Instance N]
    end

    subgraph Database["Database Layer"]
        Primary[Primary DB]
        Replica1[Read Replica 1]
        Replica2[Read Replica 2]
        Pool[Connection Pool]
    end

    subgraph Cache["Caching Layer"]
        Redis[Redis Cache]
    end

    subgraph Storage["Storage Layer"]
        S3[S3 Multi-Region]
        CDN[CloudFront CDN]
    end

    subgraph Queue["Queue Layer"]
        QStash[QStash<br/>Auto-scaling]
    end

    LB --> API1
    LB --> API2
    LB --> API3

    API1 --> Pool
    API2 --> Pool
    API3 --> Pool

    Pool --> Primary
    Pool --> Replica1
    Pool --> Replica2

    API1 --> Redis
    API2 --> Redis
    API3 --> Redis

    API1 --> S3
    API2 --> S3
    API3 --> S3

    S3 --> CDN

    API1 --> QStash
    API2 --> QStash
    API3 --> QStash

    QStash --> API1
    QStash --> API2
    QStash --> API3

    style LoadBalancer fill:#e3f2fd
    style APIInstances fill:#fff3e0
    style Database fill:#e8f5e9
    style Cache fill:#fce4ec
    style Storage fill:#f3e5f5
    style Queue fill:#fff9c4
```

## Error Handling Flow

```mermaid
flowchart TD
    Start[API Request] --> Validate{Valid Request?}
    Validate -->|No| Error400[Return 400<br/>Bad Request]
    Validate -->|Yes| Process[Process Request]
    
    Process --> DBQuery{Database<br/>Operation}
    DBQuery -->|Error| Rollback[Rollback Transaction]
    Rollback --> Error500[Return 500<br/>Internal Error]
    DBQuery -->|Success| ExternalAPI{External API<br/>Call Needed?}
    
    ExternalAPI -->|No| Success[Return Success]
    ExternalAPI -->|Yes| CallAPI[Call External API]
    
    CallAPI --> APIResult{API Success?}
    APIResult -->|Error| Fallback{Fallback<br/>Available?}
    Fallback -->|Yes| UseFallback[Use Fallback]
    Fallback -->|No| Error500
    UseFallback --> Success
    APIResult -->|Success| Success
    
    Error400 --> Log[Log Error]
    Error500 --> Log
    Success --> End[Response Sent]
    Log --> End

    style Start fill:#e3f2fd
    style Success fill:#e8f5e9
    style Error400 fill:#ffebee
    style Error500 fill:#ffebee
    style End fill:#f3e5f5
```

---

These diagrams can be viewed in any Markdown renderer that supports Mermaid (GitHub, GitLab, VS Code with extensions, etc.)


