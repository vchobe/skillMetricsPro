/**
 * Preload essential dependencies to avoid Vite chunk loading issues
 * 
 * This directly imports all critical dependencies that might be causing
 * chunk loading errors when dynamically loaded. By eagerly importing them
 * here, we ensure they're included in the main bundle.
 */

// Core dependencies causing chunk loading errors
import 'zod';
import 'drizzle-zod';
import '@tanstack/react-query';
import 'react-hook-form';
import '@hookform/resolvers/zod';

// Force eager loading of common chunks
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';

// Create a dummy schema to trigger full dependency loading
const _dummySchema = z.object({
  id: z.number(),
  name: z.string()
});

// Also create a dummy insert schema to trigger that code path
const _dummyInsertSchema = createInsertSchema(_dummySchema);

// Export nothing, this file is just for preloading
export {};