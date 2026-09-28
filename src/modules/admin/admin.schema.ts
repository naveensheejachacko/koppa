import { z } from "zod";

export const categoryBodySchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(80),
  sort_order: z.number().int().optional(),
});

export const patchCategorySchema = categoryBodySchema.partial();

export const createCafeSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(4000).optional(),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().min(1),
  place: z.string().min(1),
  price_range: z.enum(["BUDGET", "MODERATE", "PREMIUM"]).optional(),
  features: z.array(z.string()).optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const patchCafeSchema = createCafeSchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const cafeMediaSchema = z.object({
  media_type: z.enum(["IMAGE", "VIDEO"]),
  cloudinary_url: z.string().url(),
  public_id: z.string().min(1),
  thumbnail_url: z.string().url().optional(),
});

export const suggestionReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  admin_note: z.string().max(500).optional(),
});

export const xpRulePatchSchema = z.object({
  action: z.enum(["NEW_CAFE_VISIT", "REVISIT", "CAFE_SUGGESTION"]),
  xp: z.number().int().min(0),
  is_active: z.boolean().optional(),
});

export const suggestionListQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});
