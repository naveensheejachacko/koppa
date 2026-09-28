import { prisma } from "../../database/prisma.js";
import { paginationMeta } from "../../utils/pagination.js";
import { haversineKm } from "../../utils/geo.js";
import { serializeCafe } from "../cafes/cafes.service.js";
import { CafeStatus } from "@prisma/client";

const publicInclude = {
  categories: { include: { category: true } },
  media: { orderBy: { createdAt: "asc" as const } },
};

export async function recommend(
  userId: string,
  input: { page: number; limit: number; latitude?: number; longitude?: number },
) {
  const prefs = await prisma.userPreference.findUnique({ where: { userId } });
  const cafes = await prisma.cafe.findMany({
    where: { deletedAt: null, isActive: true, status: CafeStatus.ACTIVE },
    include: publicInclude,
  });

  const categorySet = new Set(prefs?.categorySlugs ?? []);
  const featureSet = new Set(prefs?.features ?? []);
  const maxKm = prefs?.maxDistanceKm ?? null;
  const price = prefs?.priceRange ?? null;

  const scored = cafes
    .map((cafe) => {
      const slugs = cafe.categories.map((c) => c.category.slug);
      const categoryHits = slugs.filter((s) => categorySet.has(s));
      const featureHits = cafe.features.filter((f) => featureSet.has(f));
      const distance_km =
        input.latitude !== undefined && input.longitude !== undefined
          ? Math.round(haversineKm(input.latitude, input.longitude, cafe.latitude, cafe.longitude) * 10) / 10
          : undefined;
      if (maxKm !== null && distance_km !== undefined && distance_km > maxKm) {
        return null;
      }
      let score = categoryHits.length * 3 + featureHits.length * 2;
      if (price && cafe.priceRange === price) score += 2;
      const match_reasons: string[] = [];
      for (const hit of categoryHits) {
        match_reasons.push(`Great for ${hit.replaceAll("-", " ")}`);
      }
      for (const hit of featureHits) {
        match_reasons.push(humanizeFeature(hit));
      }
      if (price && cafe.priceRange === price) {
        match_reasons.push("Matches your price range");
      }
      return { cafe, score, distance_km, match_reasons };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.score - a.score || (a.distance_km ?? 0) - (b.distance_km ?? 0));

  const total = scored.length;
  const slice = scored.slice((input.page - 1) * input.limit, input.page * input.limit);
  return {
    data: slice.map((row) => ({
      ...serializeCafe(row.cafe, {
        distance_km: row.distance_km,
        match_reasons: row.match_reasons,
      }),
      cafe_id: row.cafe.id,
    })),
    meta: paginationMeta(input.page, input.limit, total),
  };
}

function humanizeFeature(value: string): string {
  const labels: Record<string, string> = {
    wifi: "WiFi available",
    quiet: "Quiet environment",
    parking: "Parking",
    outdoor: "Outdoor seating",
    pet_friendly: "Pet friendly",
    desserts: "Good desserts",
    coffee: "Good coffee",
    affordable: "Affordable",
    power_outlets: "Power outlets",
    seating: "Comfortable seating",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}
