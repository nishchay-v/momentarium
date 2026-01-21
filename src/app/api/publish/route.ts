import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { processImage } from "@/lib/imageProcessor";
import { uploadMultipleToR2, generateR2Keys } from "@/lib/r2";
import { addGalleryItems } from "@/lib/galleryDatabase";
import type { GalleryItem } from "@/types/media";

// SECURITY: Only allow in development mode
function checkDevelopmentMode(): NextResponse | null {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 404 }
    );
  }
  return null;
}

/**
 * POST /api/publish
 * Process and publish images to R2 and update gallery.json
 *
 * Request: FormData with 'images' field containing File[]
 * Response: { success: true, items: GalleryItem[] }
 */
export async function POST(request: NextRequest) {
  // Security check
  const devCheckResponse = checkDevelopmentMode();
  if (devCheckResponse) return devCheckResponse;

  try {
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    // Validate file types
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only images are allowed.` },
          { status: 400 }
        );
      }
    }

    const publishedItems: GalleryItem[] = [];

    // Process each image
    for (const file of files) {
      const imageId = uuidv4();
      const buffer = Buffer.from(await file.arrayBuffer());

      // Process image to generate thumbnail and gallery versions
      const processed = await processImage(buffer);

      // Generate R2 keys
      const r2Keys = generateR2Keys(imageId);

      // Upload both versions to R2
      await uploadMultipleToR2([
        {
          buffer: processed.thumbnail,
          key: r2Keys.thumb,
          contentType: "image/webp",
        },
        {
          buffer: processed.gallery,
          key: r2Keys.gallery,
          contentType: "image/webp",
        },
      ]);

      // Create gallery item entry
      const galleryItem: GalleryItem = {
        id: imageId,
        r2Keys,
        metadata: processed.exif,
        uploadDate: new Date().toISOString(),
        originalFilename: file.name,
      };

      publishedItems.push(galleryItem);
    }

    // Add all items to the gallery database
    await addGalleryItems(publishedItems);

    return NextResponse.json({
      success: true,
      items: publishedItems,
      message: `Successfully published ${publishedItems.length} image(s)`,
    });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      {
        error: "Failed to publish images",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/publish
 * Health check endpoint
 */
export async function GET() {
  const devCheckResponse = checkDevelopmentMode();
  if (devCheckResponse) return devCheckResponse;

  return NextResponse.json({
    status: "ok",
    message: "Publish API is available (development mode only)",
  });
}
