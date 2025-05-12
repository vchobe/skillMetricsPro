/**
 * This file is used to fix the Vite chunk loading issue by forcing all dependencies 
 * to be loaded together without code splitting
 */

// Import the specific chunks that are causing issues
import 'zod';
import 'drizzle-zod';
import '@tanstack/react-query';
import '@hookform/resolvers/zod';

// Create a dummy export to ensure this gets included
export const IMPORT_FIX = true;