// Client SDK for interacting with Momentarium API
// Can be used in frontend or other services

export interface MomentariumClientConfig {
  baseUrl: string;
  userId: number;
}

export class MomentariumClient {
  private baseUrl: string;
  private userId: number;

  constructor(config: MomentariumClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.userId = config.userId;
  }

  /**
   * Step 1: Get pre-signed URLs for uploading images
   */
  async generateUploadUrls(
    files: File[]
  ): Promise<Array<{ uploadUrl: string; storageKey: string; filename: string }>> {
    const filenames = files.map((f) => f.name);
    const contentTypes = files.map((f) => f.type);

    const response = await fetch(`${this.baseUrl}/api/uploads/generate-urls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filenames,
        contentTypes,
        userId: this.userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate upload URLs');
    }

    const data = await response.json();
    return data.urls;
  }

  /**
   * Step 2: Upload files to S3 using pre-signed URLs
   */
  async uploadFiles(
    files: File[],
    urls: Array<{ uploadUrl: string; storageKey: string; filename: string }>,
    onProgress?: (progress: number) => void
  ): Promise<string[]> {
    let completed = 0;

    const storageKeys = await Promise.all(
      files.map(async (file, index) => {
        const { uploadUrl, storageKey } = urls[index];

        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        completed++;
        if (onProgress) {
          onProgress(Math.round((completed / files.length) * 100));
        }

        return storageKey;
      })
    );

    return storageKeys;
  }

  /**
   * Step 3: Request processing of uploaded images
   */
  async processGallery(imageKeys: string[]): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/galleries/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageKeys,
        userId: this.userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to process gallery');
    }

    const data = await response.json();
    return data.jobId;
  }

  /**
   * Step 4: Poll job status until completion
   */
  async waitForJobCompletion(
    jobId: string,
    onStatusChange?: (status: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(
            `${this.baseUrl}/api/jobs/${jobId}/status`
          );

          if (!response.ok) {
            clearInterval(pollInterval);
            reject(new Error('Failed to fetch job status'));
            return;
          }

          const data = await response.json();

          if (onStatusChange) {
            onStatusChange(data.status);
          }

          if (data.status === 'completed') {
            clearInterval(pollInterval);
            resolve();
          } else if (data.status === 'failed') {
            clearInterval(pollInterval);
            reject(new Error(data.error || 'Job failed'));
          }
        } catch (error) {
          clearInterval(pollInterval);
          reject(error);
        }
      }, 3000); // Poll every 3 seconds
    });
  }

  /**
   * Step 5: Fetch the generated gallery
   */
  async getGallery() {
    const response = await fetch(
      `${this.baseUrl}/api/galleries/${this.userId}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch gallery');
    }

    return await response.json();
  }

  /**
   * Complete workflow: Upload images and wait for processing
   */
  async uploadAndProcess(
    files: File[],
    callbacks?: {
      onUploadProgress?: (progress: number) => void;
      onProcessingStatus?: (status: string) => void;
    }
  ) {
    // Step 1 & 2: Upload files
    const urls = await this.generateUploadUrls(files);
    const imageKeys = await this.uploadFiles(
      files,
      urls,
      callbacks?.onUploadProgress
    );

    // Step 3: Request processing
    const jobId = await this.processGallery(imageKeys);

    // Step 4: Wait for completion
    await this.waitForJobCompletion(jobId, callbacks?.onProcessingStatus);

    // Step 5: Return the gallery
    return await this.getGallery();
  }
}


