import { z } from "zod";

export const createVisitSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().positive().optional(),
  media: z
    .object({
      cloudinary_url: z.string().url(),
      public_id: z.string().min(1),
      thumbnail_url: z.string().url().optional(),
      media_type: z.enum(["IMAGE", "VIDEO"]).optional(),
    })
    .optional(),
});
