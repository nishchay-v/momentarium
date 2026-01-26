/**
 * Simple image preload utility.
 * Relies on browser cache rather than internal state.
 */

/**
 * Preload a single image.
 * Returns a promise that resolves when the image is loaded or errors.
 */
export const preloadImage = (url: string): Promise<void> => {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Resolve on error to avoid blocking
    img.src = url;
  });
};

/**
 * Preload multiple images in parallel.
 */
export const preloadImages = async (urls: string[]): Promise<void> => {
  await Promise.all(urls.map((url) => preloadImage(url)));
};

/**
 * Check if an image is cached (load completed).
 * Note: This is a best-guess based on the browser's ability to load it immediately.
 * For true accuracy, checking `img.complete` on an actual DOM element is better.
 */
export const isImageCached = (url: string): boolean => {
  if (typeof window === "undefined") return false;
  // We can't synchronously check browser cache without an Image element.
  // This function is kept for API compatibility but always returns false
  // to encourage components to handle loading states gracefully.
  return false;
};

// Deprecated/No-op functions kept for compatibility during refactor
export const isImageLoading = (url: string): boolean => false;
export const clearCache = (): void => {};
export const getCacheSize = (): number => 0;