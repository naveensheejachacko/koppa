import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination.js";

export const listCafesQuerySchema = paginationQuerySchema.extend({
  q: z.string().optional(),
  category: z.string().optional(),
  place: z.string().optional(),
  feature: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

export const nearbyQuerySchema = paginationQuerySchema.extend({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  radius_km: z.coerce.number().positive().max(50).default(5),
});
