// Database client and utilities
import { Pool, QueryResult } from 'pg';
import { config } from '@/config';

// Create a connection pool
const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Generic query function
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Database operations for users
export const userDb = {
  async findById(id: number) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByEmail(email: string) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async create(email: string) {
    const result = await query(
      'INSERT INTO users (email) VALUES ($1) RETURNING *',
      [email]
    );
    return result.rows[0];
  },
};

// Database operations for images
export const imageDb = {
  async create(
    userId: number,
    storageKey: string,
    metadata?: {
      originalFilename?: string;
      contentType?: string;
      fileSizeBytes?: number;
      width?: number;
      height?: number;
    }
  ) {
    const result = await query(
      `INSERT INTO images (user_id, storage_key, original_filename, content_type, file_size_bytes, width, height)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        storageKey,
        metadata?.originalFilename || null,
        metadata?.contentType || null,
        metadata?.fileSizeBytes || null,
        metadata?.width || null,
        metadata?.height || null,
      ]
    );
    return result.rows[0];
  },

  async findByStorageKeys(storageKeys: string[]) {
    const result = await query(
      'SELECT * FROM images WHERE storage_key = ANY($1)',
      [storageKeys]
    );
    return result.rows;
  },

  async findById(id: number) {
    const result = await query('SELECT * FROM images WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByUserId(userId: number) {
    const result = await query(
      'SELECT * FROM images WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },
};

// Database operations for albums
export const albumDb = {
  async create(userId: number, title: string, themeDescription?: string) {
    const result = await query(
      `INSERT INTO albums (user_id, title, theme_description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, title, themeDescription || null]
    );
    return result.rows[0];
  },

  async findById(id: number) {
    const result = await query('SELECT * FROM albums WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByUserId(userId: number) {
    const result = await query(
      'SELECT * FROM albums WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  async addImages(albumId: number, imageIds: number[]) {
    const values = imageIds
      .map((imageId, index) => `(${albumId}, ${imageId}, ${index})`)
      .join(',');

    await query(
      `INSERT INTO album_images (album_id, image_id, display_order)
       VALUES ${values}
       ON CONFLICT (album_id, image_id) DO NOTHING`
    );
  },

  async getImagesForAlbum(albumId: number) {
    const result = await query(
      `SELECT i.*, ai.display_order
       FROM images i
       INNER JOIN album_images ai ON i.id = ai.image_id
       WHERE ai.album_id = $1
       ORDER BY ai.display_order`,
      [albumId]
    );
    return result.rows;
  },

  async getAlbumsWithImagesByUserId(userId: number) {
    const result = await query(
      `SELECT 
        a.*,
        json_agg(
          json_build_object(
            'id', i.id,
            'storage_key', i.storage_key,
            'original_filename', i.original_filename,
            'content_type', i.content_type,
            'display_order', ai.display_order
          ) ORDER BY ai.display_order
        ) as images
       FROM albums a
       LEFT JOIN album_images ai ON a.id = ai.album_id
       LEFT JOIN images i ON ai.image_id = i.id
       WHERE a.user_id = $1
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [userId]
    );
    return result.rows;
  },
};

// Database operations for processing jobs
export const jobDb = {
  async create(userId: number, imageKeys: string[]) {
    const result = await query(
      `INSERT INTO processing_jobs (user_id, image_keys)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, imageKeys]
    );
    return result.rows[0];
  },

  async findById(id: string) {
    const result = await query('SELECT * FROM processing_jobs WHERE id = $1', [
      id,
    ]);
    return result.rows[0] || null;
  },

  async updateStatus(
    id: string,
    status: string,
    resultData?: any,
    errorMessage?: string
  ) {
    const now = new Date();
    let query_text = '';
    let params: any[] = [];

    if (status === 'processing') {
      query_text = `UPDATE processing_jobs 
                    SET status = $1, started_at = $2 
                    WHERE id = $3 
                    RETURNING *`;
      params = [status, now, id];
    } else if (status === 'completed') {
      query_text = `UPDATE processing_jobs 
                    SET status = $1, completed_at = $2, result_data = $3 
                    WHERE id = $4 
                    RETURNING *`;
      params = [status, now, JSON.stringify(resultData), id];
    } else if (status === 'failed') {
      query_text = `UPDATE processing_jobs 
                    SET status = $1, completed_at = $2, error_message = $3 
                    WHERE id = $4 
                    RETURNING *`;
      params = [status, now, errorMessage, id];
    } else {
      query_text = `UPDATE processing_jobs 
                    SET status = $1 
                    WHERE id = $2 
                    RETURNING *`;
      params = [status, id];
    }

    const result = await query(query_text, params);
    return result.rows[0];
  },
};

export default pool;


