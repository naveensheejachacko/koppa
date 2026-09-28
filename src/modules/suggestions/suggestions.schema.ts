import { z } from "zod";

export const createSuggestionSchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().min(1).max(255),
  place: z.string().min(1).max(120),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  description: z.string().max(2000).optional(),
  image_url: z.string().url().optional(),
});
