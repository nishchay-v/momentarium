import { promises as fs } from "fs";
import path from "path";
import type { GalleryDatabase, GalleryItem } from "@/types/media";

// Path to the gallery database file
const GALLERY_DB_PATH = path.join(process.cwd(), "data", "gallery.json");

/**
 * Read the gallery database
 */
export async function readGalleryDatabase(): Promise<GalleryDatabase> {
  try {
    const data = await fs.readFile(GALLERY_DB_PATH, "utf-8");
    return JSON.parse(data) as GalleryDatabase;
  } catch (error) {
    // If file doesn't exist, return empty database
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        version: 1,
        lastUpdated: null,
        items: [],
      };
    }
    throw error;
  }
}

/**
 * Write the gallery database
 */
export async function writeGalleryDatabase(
  database: GalleryDatabase
): Promise<void> {
  // Ensure the data directory exists
  const dataDir = path.dirname(GALLERY_DB_PATH);
  await fs.mkdir(dataDir, { recursive: true });

  // Update lastUpdated timestamp
  database.lastUpdated = new Date().toISOString();

  // Write with pretty formatting for git-friendliness
  const data = JSON.stringify(database, null, 2);
  await fs.writeFile(GALLERY_DB_PATH, data, "utf-8");
}

/**
 * Add items to the gallery database
 */
export async function addGalleryItems(
  newItems: GalleryItem[]
): Promise<GalleryDatabase> {
  const database = await readGalleryDatabase();

  // Add new items
  database.items.push(...newItems);

  // Write updated database
  await writeGalleryDatabase(database);

  return database;
}

/**
 * Get all gallery items
 */
export async function getGalleryItems(): Promise<GalleryItem[]> {
  const database = await readGalleryDatabase();
  return database.items;
}

/**
 * Find a gallery item by ID
 */
export async function findGalleryItem(
  id: string
): Promise<GalleryItem | undefined> {
  const database = await readGalleryDatabase();
  return database.items.find((item) => item.id === id);
}

/**
 * Delete a gallery item by ID
 */
export async function deleteGalleryItem(id: string): Promise<boolean> {
  const database = await readGalleryDatabase();
  const initialLength = database.items.length;
  database.items = database.items.filter((item) => item.id !== id);

  if (database.items.length < initialLength) {
    await writeGalleryDatabase(database);
    return true;
  }

  return false;
}
