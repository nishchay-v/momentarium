# Momentarium API Testing Guide

This guide provides examples for testing the Momentarium API using curl and other tools.

## Prerequisites

- Server running at `http://localhost:3000`
- Test user with ID = 1
- Sample images ready for upload

## Testing Workflow

### 1. Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-26T10:00:00.000Z",
  "services": {
    "database": "connected"
  }
}
```

### 2. Generate Upload URLs

```bash
curl -X POST http://localhost:3000/api/uploads/generate-urls \
  -H "Content-Type: application/json" \
  -d '{
    "filenames": ["test1.jpg", "test2.jpg"],
    "userId": 1,
    "contentTypes": ["image/jpeg", "image/jpeg"]
  }'
```

Save the response - you'll need the `uploadUrl` and `storageKey` values.

### 3. Upload Images to S3

For each URL from step 2:

```bash
curl -X PUT "<uploadUrl>" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@/path/to/your/image.jpg"
```

### 4. Request Processing

Use the `storageKey` values from step 2:

```bash
curl -X POST http://localhost:3000/api/galleries/process \
  -H "Content-Type: application/json" \
  -d '{
    "imageKeys": [
      "users/1/1234567890-test1.jpg",
      "users/1/1234567891-test2.jpg"
    ],
    "userId": 1
  }'
```

Save the `jobId` from the response.

### 5. Check Job Status

```bash
curl http://localhost:3000/api/jobs/<jobId>/status
```

Poll this endpoint every few seconds until status is "completed".

### 6. Fetch Gallery

```bash
curl http://localhost:3000/api/galleries/1
```

## Testing with HTTPie

If you prefer HTTPie (https://httpie.io/):

```bash
# Generate URLs
http POST localhost:3000/api/uploads/generate-urls \
  filenames:='["test1.jpg"]' \
  userId:=1 \
  contentTypes:='["image/jpeg"]'

# Request processing
http POST localhost:3000/api/galleries/process \
  imageKeys:='["users/1/123-test1.jpg"]' \
  userId:=1

# Check status
http GET localhost:3000/api/jobs/{jobId}/status

# Get gallery
http GET localhost:3000/api/galleries/1
```

## Testing with Postman

1. Import the collection (create `postman_collection.json` with endpoints)
2. Set environment variables:
   - `base_url`: `http://localhost:3000`
   - `user_id`: `1`
3. Run requests in sequence

## Automated Testing Script

Create a test script (`test.sh`):

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
USER_ID=1
IMAGE_PATH="./test-images/sample.jpg"

# Step 1: Generate URL
echo "Generating upload URL..."
RESPONSE=$(curl -s -X POST $BASE_URL/api/uploads/generate-urls \
  -H "Content-Type: application/json" \
  -d "{\"filenames\":[\"sample.jpg\"],\"userId\":$USER_ID,\"contentTypes\":[\"image/jpeg\"]}")

UPLOAD_URL=$(echo $RESPONSE | jq -r '.urls[0].uploadUrl')
STORAGE_KEY=$(echo $RESPONSE | jq -r '.urls[0].storageKey')

echo "Upload URL: $UPLOAD_URL"
echo "Storage Key: $STORAGE_KEY"

# Step 2: Upload image
echo "Uploading image..."
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@$IMAGE_PATH"

# Step 3: Request processing
echo "Requesting processing..."
JOB_RESPONSE=$(curl -s -X POST $BASE_URL/api/galleries/process \
  -H "Content-Type: application/json" \
  -d "{\"imageKeys\":[\"$STORAGE_KEY\"],\"userId\":$USER_ID}")

JOB_ID=$(echo $JOB_RESPONSE | jq -r '.jobId')
echo "Job ID: $JOB_ID"

# Step 4: Poll status
echo "Waiting for completion..."
while true; do
  STATUS_RESPONSE=$(curl -s $BASE_URL/api/jobs/$JOB_ID/status)
  STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
  echo "Status: $STATUS"
  
  if [ "$STATUS" = "completed" ]; then
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "Processing failed!"
    exit 1
  fi
  
  sleep 3
done

# Step 5: Get gallery
echo "Fetching gallery..."
curl -s $BASE_URL/api/galleries/$USER_ID | jq

echo "Test completed!"
```

Make it executable:
```bash
chmod +x test.sh
./test.sh
```

## Common Issues

### "Unauthorized" when calling /api/jobs/process

This endpoint should only be called by QStash. If testing manually, add the header:
```bash
-H "X-API-Secret: your_api_secret_from_env"
```

### Pre-signed URL expired

URLs expire after 5 minutes. Generate new ones if needed.

### Images not found

Ensure the storage keys match exactly what was returned from the generate-urls endpoint.


