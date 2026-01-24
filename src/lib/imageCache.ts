/**
 * Simple image cache utility for preloading and caching images
 * Tracks both completed loads and in-flight requests to avoid duplicates
 */

// Cache of completed image loads (url -> success/failure)
const cache = new Map<string, boolean>();

// Track in-flight requests to avoid duplicate network calls
const inFlightRequests = new Map<string, Promise<void>>();

/**
 * Preload a single image and cache the result
 * Returns immediately for cached images and dedupes in-flight requests
 */
export const preloadImage = (url: string): Promise<void> => {
  // Return immediately if already cached
  if (cache.has(url)) {
    return Promise.resolve();
  }

  // Return existing in-flight request if one exists
  const existingRequest = inFlightRequests.get(url);
  if (existingRequest) {
    return existingRequest;
  }

  // Create new preload request
  const request = new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      cache.set(url, true);
      inFlightRequests.delete(url);
      resolve();
    };
    img.onerror = () => {
      // Cache even on error to avoid repeated failed attempts
      cache.set(url, false);
      inFlightRequests.delete(url);
      resolve();
    };
    img.src = url;
  });

  inFlightRequests.set(url, request);
  return request;
};

/**
 * Preload multiple images in parallel
 * Filters out already-cached images automatically
 */
export const preloadImages = async (urls: string[]): Promise<void> => {
  const uncachedUrls = urls.filter(url => !cache.has(url));
  if (uncachedUrls.length > 0) {
    await Promise.all(uncachedUrls.map((url) => preloadImage(url)));
  }
};

/**
 * Check if an image is cached (load completed)
 */
export const isImageCached = (url: string): boolean => {
  return cache.has(url);
};

/**
 * Check if an image is currently being loaded
 */
export const isImageLoading = (url: string): boolean => {
  return inFlightRequests.has(url);
};

/**
 * Clear the entire cache (useful for memory management)
 */
export const clearCache = (): void => {
  cache.clear();
  inFlightRequests.clear();
};

/**
 * Get cache size
 */
export const getCacheSize = (): number => {
  return cache.size;
};
