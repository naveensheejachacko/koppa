import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function paginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit) || 0,
  };
}

export function skipTake(page: number, limit: number): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}
