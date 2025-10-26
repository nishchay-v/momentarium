// API Route: GET /api/galleries/[galleryId]
// Fetch albums and images for a user (gallery)

import { NextRequest, NextResponse } from 'next/server';
import { albumDb } from '@/lib/db';
import { generateDownloadUrl } from '@/lib/s3';
import type { GalleryResponse, AlbumWithImages, ImageWithUrl } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { galleryId: string } }
) {
  try {
    const { galleryId } = params;
    const userId = parseInt(galleryId, 10);

    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { error: 'Invalid gallery/user ID' },
        { status: 400 }
      );
    }

    // Fetch all albums with their images for this user
    const albumsWithImages = await albumDb.getAlbumsWithImagesByUserId(userId);

    // Generate download URLs for all images
    const albumsWithUrls: AlbumWithImages[] = await Promise.all(
      albumsWithImages.map(async (album) => {
        const imagesWithUrls: ImageWithUrl[] = await Promise.all(
          (album.images || []).map(async (image: any) => {
            if (!image.id) return null; // Skip null images from left join
            
            const url = await generateDownloadUrl(image.storage_key);
            return {
              id: image.id,
              user_id: userId,
              storage_key: image.storage_key,
              original_filename: image.original_filename,
              content_type: image.content_type,
              file_size_bytes: image.file_size_bytes,
              width: image.width,
              height: image.height,
              created_at: image.created_at,
              url,
            };
          })
        );

        return {
          id: album.id,
          user_id: album.user_id,
          title: album.title,
          theme_description: album.theme_description,
          created_at: album.created_at,
          updated_at: album.updated_at,
          images: imagesWithUrls.filter((img): img is ImageWithUrl => img !== null),
        };
      })
    );

    const response: GalleryResponse = {
      albums: albumsWithUrls,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery' },
      { status: 500 }
    );
  }
}


