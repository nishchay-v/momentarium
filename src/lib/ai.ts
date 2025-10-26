// Google Gemini AI Client for image analysis and album generation
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@/config';
import type { AlbumGenerationResult } from '@/types';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

/**
 * Generate the prompt for album creation
 */
function generateAlbumCreationPrompt(imageKeys: string[]): string {
  const imageList = imageKeys
    .map((key) => `  - Image "${key}"`)
    .join('\n');

  return `You are an expert photo gallery curator. I will provide you with a list of images. Your task is to analyze all images and group them into logical, thematic albums.

For each album you create, you must provide a creative title, a short and artistic theme description, and the list of image keys that belong to it.

**RULES:**
1. Analyze the content, mood, color palette, and subjects across ALL images to make the best groupings.
2. An image can only belong to one album.
3. Create between 1 and ${Math.min(Math.ceil(imageKeys.length / 3), 10)} albums depending on how diverse the images are.
4. Each album should contain at least 2 images (unless there's only 1 image total).
5. You **MUST** return your response as a single, valid JSON object. Do not include any text, markdown formatting, or code fences before or after the JSON object.
6. The JSON object must conform to this schema:

{
  "albums": [
    {
      "title": "A Creative Album Title",
      "theme": "A short, artistic description of the album's mood and story.",
      "image_keys": ["key_of_image_1.jpg", "key_of_image_5.jpg"]
    }
  ]
}

Here are the images to process:
${imageList}

Remember: Return ONLY valid JSON, nothing else.`;
}

/**
 * Process a batch of images and generate albums using Gemini AI
 */
export async function generateAlbums(
  imageUrls: Array<{ key: string; url: string }>
): Promise<AlbumGenerationResult> {
  try {
    // Use Gemini Pro Vision model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Prepare the content parts with images
    const imageParts = await Promise.all(
      imageUrls.map(async ({ url }) => {
        // Fetch image data
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        
        // Determine mime type from URL or default
        let mimeType = 'image/jpeg';
        if (url.includes('.png')) mimeType = 'image/png';
        else if (url.includes('.webp')) mimeType = 'image/webp';
        else if (url.includes('.gif')) mimeType = 'image/gif';

        return {
          inlineData: {
            data: base64,
            mimeType,
          },
        };
      })
    );

    // Generate the prompt
    const imageKeys = imageUrls.map(({ key }) => key);
    const prompt = generateAlbumCreationPrompt(imageKeys);

    // Make the API call
    const result = await model.generateContent([
      prompt,
      ...imageParts,
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    // Remove any potential markdown code fences
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    const albumData: AlbumGenerationResult = JSON.parse(cleanedText);

    // Validate the response structure
    if (!albumData.albums || !Array.isArray(albumData.albums)) {
      throw new Error('Invalid response structure from AI model');
    }

    // Validate each album has required fields
    for (const album of albumData.albums) {
      if (!album.title || !album.theme || !Array.isArray(album.image_keys)) {
        throw new Error('Invalid album structure in AI response');
      }
    }

    return albumData;
  } catch (error) {
    console.error('Error generating albums with Gemini:', error);
    throw new Error(`Failed to generate albums: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fallback function: Create a simple single album if AI fails
 */
export function createFallbackAlbum(imageKeys: string[]): AlbumGenerationResult {
  return {
    albums: [
      {
        title: 'My Photo Collection',
        theme: 'A collection of memorable moments and beautiful scenes.',
        image_keys: imageKeys,
      },
    ],
  };
}


