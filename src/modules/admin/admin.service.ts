import { prisma } from "../../database/prisma.js";
import { ConflictError, NotFoundError, ValidationError } from "../../utils/errors.js";
import { paginationMeta, skipTake } from "../../utils/pagination.js";
import { Prisma } from "@prisma/client";
import { CafeStatus, MediaType, PriceRange, XpAction } from "../../domain/enums.js";
import { serializeCafe, serializeCafeMedia } from "../cafes/cafes.service.js";
import { listXpRules, updateXpRule } from "../xp/xp.service.js";

const cafeInclude = {
  categories: { include: { category: true } },
  media: { orderBy: [{ isDefault: "desc" as const }, { createdAt: "asc" as const }] },
};

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function createCategory(input: { name: string; slug: string; sort_order?: number }) {
  return prisma.category.create({
    data: { name: input.name, slug: input.slug, sortOrder: input.sort_order ?? 0 },
  });
}

export async function updateCategory(
  id: string,
  input: { name?: string; slug?: string; sort_order?: number },
) {
  return prisma.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.sort_order !== undefined ? { sortOrder: input.sort_order } : {}),
    },
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await prisma.category.delete({ where: { id } });
}

export async function adminListCafes(page: number, limit: number, includeDeleted = false) {
  const where: Prisma.CafeWhereInput = includeDeleted ? {} : { deletedAt: null };
  const [total, rows] = await Promise.all([
    prisma.cafe.count({ where }),
    prisma.cafe.findMany({
      where,
      include: cafeInclude,
      orderBy: { createdAt: "desc" },
      ...skipTake(page, limit),
    }),
  ]);
  return {
    data: rows.map((c) => serializeCafe(c)),
    meta: paginationMeta(page, limit, total),
  };
}

export async function adminGetCafe(id: string) {
  const cafe = await prisma.cafe.findUnique({ where: { id }, include: cafeInclude });
  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }
  return serializeCafe(cafe);
}

export async function createCafe(input: {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address: string;
  place: string;
  price_range?: PriceRange;
  features?: string[];
  category_ids?: string[];
  status?: CafeStatus;
}) {
  const cafe = await prisma.cafe.create({
    data: {
      name: input.name,
      description: input.description ?? "",
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address,
      place: input.place,
      priceRange: input.price_range ?? PriceRange.MODERATE,
      features: input.features ?? [],
      status: input.status ?? CafeStatus.ACTIVE,
      categories: input.category_ids
        ? { create: input.category_ids.map((categoryId) => ({ categoryId })) }
        : undefined,
    },
    include: cafeInclude,
  });
  return serializeCafe(cafe);
}

type CafeMediaInput = {
  media_type: MediaType;
  cloudinary_url: string;
  public_id: string;
  thumbnail_url?: string;
  is_default?: boolean;
};

async function syncCafeMedia(
  tx: Prisma.TransactionClient,
  cafeId: string,
  uploadedById: string,
  input: {
    add_media?: CafeMediaInput[];
    remove_media_ids?: string[];
    default_media_id?: string;
  },
) {
  const removeIds = [...new Set(input.remove_media_ids ?? [])];
  if (input.default_media_id && removeIds.includes(input.default_media_id)) {
    throw new ValidationError("default_media_id is also marked for removal");
  }
  if (removeIds.length > 0) {
    const found = await tx.cafeMedia.findMany({
      where: { cafeId, id: { in: removeIds } },
      select: { id: true },
    });
    if (found.length !== removeIds.length) {
      throw new NotFoundError("Media not found");
    }
    await tx.cafeMedia.deleteMany({ where: { cafeId, id: { in: removeIds } } });
  }

  const addedDefaults: string[] = [];
  for (const item of input.add_media ?? []) {
    const row = await tx.cafeMedia.create({
      data: {
        cafeId,
        uploadedById,
        mediaType: item.media_type,
        cloudinaryUrl: item.cloudinary_url,
        publicId: item.public_id,
        thumbnailUrl: item.thumbnail_url,
        isDefault: false,
      },
    });
    if (item.is_default) {
      addedDefaults.push(row.id);
    }
  }

  const targetDefault = input.default_media_id ?? addedDefaults.at(-1);
  if (targetDefault) {
    const exists = await tx.cafeMedia.findFirst({ where: { id: targetDefault, cafeId } });
    if (!exists) {
      throw new NotFoundError("Media not found");
    }
    await tx.cafeMedia.updateMany({
      where: { cafeId, isDefault: true },
      data: { isDefault: false },
    });
    await tx.cafeMedia.update({ where: { id: targetDefault }, data: { isDefault: true } });
    return;
  }

  const currentDefault = await tx.cafeMedia.findFirst({ where: { cafeId, isDefault: true } });
  if (currentDefault) {
    return;
  }
  const next = await tx.cafeMedia.findFirst({
    where: { cafeId },
    orderBy: { createdAt: "asc" },
  });
  if (next) {
    await tx.cafeMedia.update({ where: { id: next.id }, data: { isDefault: true } });
  }
}

export async function updateCafe(
  id: string,
  input: {
    name?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    place?: string;
    price_range?: PriceRange;
    features?: string[];
    category_ids?: string[];
    status?: CafeStatus;
    is_active?: boolean;
    add_media?: CafeMediaInput[];
    remove_media_ids?: string[];
    default_media_id?: string;
  },
  uploadedById: string,
) {
  const existing = await prisma.cafe.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    throw new NotFoundError("Cafe not found");
  }
  const cafe = await prisma.$transaction(async (tx) => {
    if (input.category_ids) {
      await tx.cafeCategory.deleteMany({ where: { cafeId: id } });
      await tx.cafeCategory.createMany({
        data: input.category_ids.map((categoryId) => ({ cafeId: id, categoryId })),
      });
    }
    const touchesMedia =
      input.add_media !== undefined ||
      input.remove_media_ids !== undefined ||
      input.default_media_id !== undefined;
    if (touchesMedia) {
      await syncCafeMedia(tx, id, uploadedById, input);
    }
    return tx.cafe.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
        ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.place !== undefined ? { place: input.place } : {}),
        ...(input.price_range !== undefined ? { priceRange: input.price_range } : {}),
        ...(input.features !== undefined ? { features: input.features } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.is_active !== undefined ? { isActive: input.is_active } : {}),
      },
      include: cafeInclude,
    });
  });
  return serializeCafe(cafe);
}

export async function softDeleteCafe(id: string): Promise<void> {
  const existing = await prisma.cafe.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    throw new NotFoundError("Cafe not found");
  }
  await prisma.cafe.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false, status: CafeStatus.INACTIVE },
  });
}

export async function restoreCafe(id: string) {
  const existing = await prisma.cafe.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Cafe not found");
  }
  if (!existing.deletedAt) {
    throw new ConflictError("Cafe is not deleted");
  }
  const cafe = await prisma.cafe.update({
    where: { id },
    data: { deletedAt: null, isActive: true, status: CafeStatus.ACTIVE },
    include: cafeInclude,
  });
  return serializeCafe(cafe);
}

export async function addCafeMedia(
  cafeId: string,
  uploadedById: string,
  input: {
    media_type: MediaType;
    cloudinary_url: string;
    public_id: string;
    thumbnail_url?: string;
    is_default?: boolean;
  },
) {
  const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
  if (!cafe || cafe.deletedAt) {
    throw new NotFoundError("Cafe not found");
  }
  const media = await prisma.$transaction(async (tx) => {
    const existingCount = await tx.cafeMedia.count({ where: { cafeId } });
    const isDefault = input.is_default === true || existingCount === 0;
    if (isDefault) {
      await tx.cafeMedia.updateMany({
        where: { cafeId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.cafeMedia.create({
      data: {
        cafeId,
        uploadedById,
        mediaType: input.media_type,
        cloudinaryUrl: input.cloudinary_url,
        publicId: input.public_id,
        thumbnailUrl: input.thumbnail_url,
        isDefault,
      },
    });
  });
  return serializeCafeMedia(media);
}

export async function setCafeMediaDefault(cafeId: string, mediaId: string) {
  const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
  if (!cafe || cafe.deletedAt) {
    throw new NotFoundError("Cafe not found");
  }
  const media = await prisma.cafeMedia.findFirst({ where: { id: mediaId, cafeId } });
  if (!media) {
    throw new NotFoundError("Media not found");
  }
  const updated = await prisma.$transaction(async (tx) => {
    await tx.cafeMedia.updateMany({
      where: { cafeId, isDefault: true, NOT: { id: mediaId } },
      data: { isDefault: false },
    });
    return tx.cafeMedia.update({
      where: { id: mediaId },
      data: { isDefault: true },
    });
  });
  return serializeCafeMedia(updated);
}

export async function deleteCafeMedia(cafeId: string, mediaId: string): Promise<void> {
  const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
  if (!cafe || cafe.deletedAt) {
    throw new NotFoundError("Cafe not found");
  }
  const media = await prisma.cafeMedia.findFirst({ where: { id: mediaId, cafeId } });
  if (!media) {
    throw new NotFoundError("Media not found");
  }
  await prisma.$transaction(async (tx) => {
    await tx.cafeMedia.delete({ where: { id: mediaId } });
    if (!media.isDefault) {
      return;
    }
    const next = await tx.cafeMedia.findFirst({
      where: { cafeId },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await tx.cafeMedia.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  });
}

export async function dashboard() {
  const [
    totalUsers,
    totalCafes,
    activeCafes,
    verifiedVisits,
    reviews,
    suggestions,
    xpAwarded,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.cafe.count({ where: { deletedAt: null } }),
    prisma.cafe.count({ where: { deletedAt: null, isActive: true, status: CafeStatus.ACTIVE } }),
    prisma.visit.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.review.count({ where: { deletedAt: null } }),
    prisma.cafeSuggestion.count(),
    prisma.xpTransaction.aggregate({ _sum: { xp: true } }),
  ]);
  return {
    total_users: totalUsers,
    total_cafes: totalCafes,
    active_cafes: activeCafes,
    verified_visits: verifiedVisits,
    reviews,
    cafe_suggestions: suggestions,
    total_xp_awarded: xpAwarded._sum.xp ?? 0,
  };
}

export async function adminListUsers(page: number, limit: number) {
  const [total, rows] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      ...skipTake(page, limit),
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        totalXp: true,
        createdAt: true,
      },
    }),
  ]);
  return { data: rows, meta: paginationMeta(page, limit, total) };
}

export async function adminListVisits(page: number, limit: number) {
  const [total, rows] = await Promise.all([
    prisma.visit.count(),
    prisma.visit.findMany({
      include: {
        user: { select: { id: true, username: true, email: true } },
        cafe: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      ...skipTake(page, limit),
    }),
  ]);
  return { data: rows, meta: paginationMeta(page, limit, total) };
}

export { listXpRules, updateXpRule, XpAction };
