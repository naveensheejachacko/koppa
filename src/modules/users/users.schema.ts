import { z } from "zod";
import { PriceRange } from "@prisma/client";

export const updateMeSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  profile_image_url: z.string().url().nullable().optional(),
});

export const updatePreferencesSchema = z.object({
  category_slugs: z.array(z.string().min(1)).optional(),
  features: z.array(z.string().min(1)).optional(),
  price_range: z.nativeEnum(PriceRange).nullable().optional(),
  max_distance_km: z.number().positive().max(100).nullable().optional(),
});
