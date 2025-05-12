// This file ensures all required dependencies are loaded upfront
// to avoid Vite chunk loading issues
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

export const deps = {
  zod: z,
  createInsertSchema,
  zodResolver,
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
  useForm
};

export default deps;