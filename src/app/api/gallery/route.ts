import { NextResponse } from "next/server";
import { getGalleryItems } from "@/lib/galleryDatabase";
import type { MediaItem, GalleryItem } from "@/types/media";

/**
 * Transform a GalleryItem from the database to a MediaItem for the frontend
 */
function galleryItemToMediaItem(item: GalleryItem): MediaItem {
  const publicUrl = process.env.R2_PUBLIC_URL;
  
  if (!publicUrl) {
    throw new Error("R2_PUBLIC_URL environment variable is not set");
  }

  // Use thumbnail for the masonry/grid display
  const thumbUrl = `${publicUrl}/${item.r2Keys.thumb}`;
  // Use gallery version for full view
  const galleryUrl = `${publicUrl}/${item.r2Keys.gallery}`;

  return {
    id: item.id,
    img: thumbUrl,
    url: galleryUrl,
    height: item.metadata.height || 400,
    width: item.metadata.width || 400,
    type: "image",
    isPublished: true,
    r2Keys: item.r2Keys,
    exifMetadata: item.metadata,
  };
}

/**
 * GET /api/gallery
 * Fetch all gallery items with resolved R2 public URLs
 * 
 * Response: { items: MediaItem[], count: number }
 */
export async function GET() {
  try {
    const galleryItems = await getGalleryItems();
    
    const mediaItems: MediaItem[] = galleryItems.map(galleryItemToMediaItem);

    return NextResponse.json({
      items: mediaItems,
      count: mediaItems.length,
    });
  } catch (error) {
    console.error("Gallery fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch gallery items",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
