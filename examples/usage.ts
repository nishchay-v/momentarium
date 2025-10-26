// Example usage of the Momentarium API
// This demonstrates how to use the client SDK

import { MomentariumClient } from '@/lib/client';

async function example() {
  // Initialize the client
  const client = new MomentariumClient({
    baseUrl: 'http://localhost:3000',
    userId: 1, // Replace with actual user ID
  });

  // Get files from user input (in a real app, this would come from a file input)
  const files: File[] = []; // Your File objects here

  try {
    console.log('Starting upload and processing...');

    // Upload and process in one go
    const gallery = await client.uploadAndProcess(files, {
      onUploadProgress: (progress) => {
        console.log(`Upload progress: ${progress}%`);
      },
      onProcessingStatus: (status) => {
        console.log(`Processing status: ${status}`);
      },
    });

    console.log('Gallery created successfully!');
    console.log(`Created ${gallery.albums.length} albums:`);

    for (const album of gallery.albums) {
      console.log(`\n📁 ${album.title}`);
      console.log(`   ${album.theme_description}`);
      console.log(`   ${album.images.length} images`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Step-by-step usage example
async function stepByStepExample() {
  const client = new MomentariumClient({
    baseUrl: 'http://localhost:3000',
    userId: 1,
  });

  const files: File[] = []; // Your File objects

  try {
    // Step 1: Generate upload URLs
    console.log('Generating upload URLs...');
    const urls = await client.generateUploadUrls(files);

    // Step 2: Upload files to S3
    console.log('Uploading files...');
    const imageKeys = await client.uploadFiles(files, urls, (progress) => {
      console.log(`Progress: ${progress}%`);
    });

    // Step 3: Request processing
    console.log('Requesting AI processing...');
    const jobId = await client.processGallery(imageKeys);
    console.log(`Job ID: ${jobId}`);

    // Step 4: Wait for completion
    console.log('Waiting for processing to complete...');
    await client.waitForJobCompletion(jobId, (status) => {
      console.log(`Status: ${status}`);
    });

    // Step 5: Fetch results
    console.log('Fetching results...');
    const gallery = await client.getGallery();
    console.log('Gallery:', gallery);
  } catch (error) {
    console.error('Error:', error);
  }
}

export { example, stepByStepExample };


