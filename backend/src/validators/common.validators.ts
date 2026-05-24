import { z } from 'zod';

export const idParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(100).default(20).optional(),
  }),
});
