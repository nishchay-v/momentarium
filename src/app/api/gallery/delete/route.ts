import { NextRequest, NextResponse } from "next/server";
import { deleteMultipleFromR2 } from "@/lib/r2";
import {
  readGalleryDatabase,
  writeGalleryDatabase,
} from "@/lib/galleryDatabase";

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
 * POST /api/gallery/delete
 * Delete images from R2 and gallery.json
 *
 * Request: { ids: string[] }
 * Response: { success: boolean, deleted: number }
 */
export async function POST(request: NextRequest) {
  // Security check
  const devCheckResponse = checkDevelopmentMode();
  if (devCheckResponse) return devCheckResponse;

  try {
    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No image IDs provided" },
        { status: 400 }
      );
    }

    // Read current database
    const database = await readGalleryDatabase();

    // Find items to delete
    const itemsToDelete = database.items.filter((item) => ids.includes(item.id));

    if (itemsToDelete.length === 0) {
      return NextResponse.json(
        { error: "No matching images found" },
        { status: 404 }
      );
    }

    // Collect all R2 keys to delete (both thumb and gallery versions)
    const keysToDelete: string[] = [];
    for (const item of itemsToDelete) {
      keysToDelete.push(item.r2Keys.thumb);
      keysToDelete.push(item.r2Keys.gallery);
    }

    // Delete from R2
    await deleteMultipleFromR2(keysToDelete);

    // Remove items from database
    database.items = database.items.filter((item) => !ids.includes(item.id));

    // Write updated database
    await writeGalleryDatabase(database);

    return NextResponse.json({
      success: true,
      deleted: itemsToDelete.length,
      message: `Successfully deleted ${itemsToDelete.length} image(s)`,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete images",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
