import { z } from "zod";
import { CafeStatus, MediaType, PriceRange, SuggestionStatus, XpAction } from "@prisma/client";

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
  price_range: z.nativeEnum(PriceRange).optional(),
  features: z.array(z.string()).optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  status: z.nativeEnum(CafeStatus).optional(),
});

export const patchCafeSchema = createCafeSchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const cafeMediaSchema = z.object({
  media_type: z.nativeEnum(MediaType),
  cloudinary_url: z.string().url(),
  public_id: z.string().min(1),
  thumbnail_url: z.string().url().optional(),
});

export const suggestionReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  admin_note: z.string().max(500).optional(),
});

export const xpRulePatchSchema = z.object({
  action: z.nativeEnum(XpAction),
  xp: z.number().int().min(0),
  is_active: z.boolean().optional(),
});

export const suggestionListQuerySchema = z.object({
  status: z.nativeEnum(SuggestionStatus).optional(),
});
