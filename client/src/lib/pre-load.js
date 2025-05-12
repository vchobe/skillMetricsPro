/**
 * This file explicitly pre-loads problematic dependencies
 * to prevent Vite chunk loading errors.
 * 
 * It's imported at the top of main.tsx to ensure these
 * dependencies are loaded before anything else.
 */

// Core dependencies that have been causing issues
import 'zod';
import '@hookform/resolvers/zod';
import '@tanstack/react-query';

// Force import of any drizzle-related modules
try {
  require('drizzle-zod');
} catch (e) {
  console.warn('Failed to preload drizzle-zod, but continuing anyway');
}

// Export a flag to indicate successful preloading
export const PRELOADED = true;