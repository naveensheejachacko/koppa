import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(3).max(2000),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  body: z.string().min(3).max(2000).optional(),
});
