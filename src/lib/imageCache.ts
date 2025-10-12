/**
 * Simple image cache utility for preloading and caching images
 * Similar to the Masonry preloading approach but with better reusability
 */

const cache = new Map<string, boolean>();

/**
 * Preload a single image and cache the result
 */
export const preloadImage = async (url: string): Promise<void> => {
  // Return immediately if already cached
  if (cache.has(url)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      cache.set(url, true);
      resolve();
    };
    img.onerror = () => {
      // Cache even on error to avoid repeated failed attempts
      cache.set(url, false);
      resolve();
    };
    img.src = url;
  });
};

/**
 * Preload multiple images in parallel
 */
export const preloadImages = async (urls: string[]): Promise<void> => {
  await Promise.all(urls.map((url) => preloadImage(url)));
};

/**
 * Check if an image is cached
 */
export const isImageCached = (url: string): boolean => {
  return cache.has(url);
};

/**
 * Clear the entire cache (useful for memory management)
 */
export const clearCache = (): void => {
  cache.clear();
};

/**
 * Get cache size
 */
export const getCacheSize = (): number => {
  return cache.size;
};

