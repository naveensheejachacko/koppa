import { CafeStatus, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { NotFoundError, ValidationError } from "../../utils/errors.js";
import { paginationMeta, skipTake } from "../../utils/pagination.js";
import { haversineKm, isValidCoordinate } from "../../utils/geo.js";

const publicCafeInclude = {
  categories: { include: { category: true } },
  media: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.CafeInclude;

function publicWhere(): Prisma.CafeWhereInput {
  return { deletedAt: null, isActive: true, status: CafeStatus.ACTIVE };
}

export function serializeCafe(
  cafe: Prisma.CafeGetPayload<{ include: typeof publicCafeInclude }>,
  extra?: { distance_km?: number; match_reasons?: string[] },
) {
  return {
    id: cafe.id,
    name: cafe.name,
    description: cafe.description,
    latitude: cafe.latitude,
    longitude: cafe.longitude,
    address: cafe.address,
    place: cafe.place,
    status: cafe.status,
    source: cafe.source,
    owner_type: cafe.ownerType,
    price_range: cafe.priceRange,
    features: cafe.features,
    categories: cafe.categories.map((cc) => ({
      id: cc.category.id,
      slug: cc.category.slug,
      name: cc.category.name,
    })),
    media: cafe.media.map((m) => ({
      id: m.id,
      media_type: m.mediaType,
      cloudinary_url: m.cloudinaryUrl,
      public_id: m.publicId,
      thumbnail_url: m.thumbnailUrl,
    })),
    created_at: cafe.createdAt,
    ...extra,
  };
}

export async function listCafes(input: {
  page: number;
  limit: number;
  q?: string;
  category?: string;
  place?: string;
  feature?: string;
  lat?: number;
  lng?: number;
}) {
  const where: Prisma.CafeWhereInput = {
    ...publicWhere(),
    ...(input.q
      ? {
          OR: [
            { name: { contains: input.q, mode: "insensitive" } },
            { description: { contains: input.q, mode: "insensitive" } },
            { place: { contains: input.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(input.place ? { place: { contains: input.place, mode: "insensitive" } } : {}),
    ...(input.feature ? { features: { has: input.feature } } : {}),
    ...(input.category
      ? { categories: { some: { category: { slug: input.category } } } }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.cafe.count({ where }),
    prisma.cafe.findMany({
      where,
      include: publicCafeInclude,
      orderBy: { name: "asc" },
      ...skipTake(input.page, input.limit),
    }),
  ]);

  const data = rows.map((cafe) => {
    if (input.lat !== undefined && input.lng !== undefined) {
      return serializeCafe(cafe, {
        distance_km: roundKm(haversineKm(input.lat, input.lng, cafe.latitude, cafe.longitude)),
      });
    }
    return serializeCafe(cafe);
  });

  return { data, meta: paginationMeta(input.page, input.limit, total) };
}

export async function getCafe(id: string, lat?: number, lng?: number) {
  const cafe = await prisma.cafe.findFirst({
    where: { id, ...publicWhere() },
    include: publicCafeInclude,
  });
  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }
  const extra =
    lat !== undefined && lng !== undefined
      ? { distance_km: roundKm(haversineKm(lat, lng, cafe.latitude, cafe.longitude)) }
      : undefined;
  return serializeCafe(cafe, extra);
}

export async function nearbyCafes(input: {
  latitude: number;
  longitude: number;
  radius_km: number;
  page: number;
  limit: number;
}) {
  if (!isValidCoordinate(input.latitude, input.longitude)) {
    throw new ValidationError("Invalid coordinates");
  }
  const cafes = await prisma.cafe.findMany({
    where: publicWhere(),
    include: publicCafeInclude,
  });
  const withDistance = cafes
    .map((cafe) => ({
      cafe,
      distance_km: roundKm(haversineKm(input.latitude, input.longitude, cafe.latitude, cafe.longitude)),
    }))
    .filter((row) => row.distance_km <= input.radius_km)
    .sort((a, b) => a.distance_km - b.distance_km);

  const total = withDistance.length;
  const slice = withDistance.slice((input.page - 1) * input.limit, input.page * input.limit);
  return {
    data: slice.map((row) => serializeCafe(row.cafe, { distance_km: row.distance_km })),
    meta: paginationMeta(input.page, input.limit, total),
  };
}

export async function listCafesByCategory(categoryId: string, page: number, limit: number) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new NotFoundError("Category not found");
  }
  const where: Prisma.CafeWhereInput = {
    ...publicWhere(),
    categories: { some: { categoryId } },
  };
  const [total, rows] = await Promise.all([
    prisma.cafe.count({ where }),
    prisma.cafe.findMany({
      where,
      include: publicCafeInclude,
      orderBy: { name: "asc" },
      ...skipTake(page, limit),
    }),
  ]);
  return {
    category: { id: category.id, slug: category.slug, name: category.name },
    data: rows.map((c) => serializeCafe(c)),
    meta: paginationMeta(page, limit, total),
  };
}

function roundKm(km: number): number {
  return Math.round(km * 10) / 10;
}
