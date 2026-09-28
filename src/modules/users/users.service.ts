import { Prisma, type User } from "@prisma/client";
import { PriceRange } from "../../domain/enums.js";
import { prisma } from "../../database/prisma.js";
import { NotFoundError } from "../../utils/errors.js";
import { paginationMeta, skipTake } from "../../utils/pagination.js";
import { startOfUtcWeek } from "../../utils/week.js";

export async function getMe(user: User) {
  const [weekly, uniqueCafes, totalVisits, reviewCount, suggestionCount, rank] =
    await Promise.all([
      weeklyXp(user.id),
      prisma.visit.findMany({
        where: { userId: user.id, verificationStatus: "VERIFIED" },
        distinct: ["cafeId"],
        select: { cafeId: true },
      }),
      prisma.visit.count({
        where: { userId: user.id, verificationStatus: "VERIFIED" },
      }),
      prisma.review.count({ where: { userId: user.id, deletedAt: null } }),
      prisma.cafeSuggestion.count({ where: { userId: user.id } }),
      weeklyRank(user.id),
    ]);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    profile_image_url: user.profileImageUrl,
    total_xp: user.totalXp,
    weekly_xp: weekly,
    leaderboard_rank: rank,
    total_visits: totalVisits,
    unique_cafes_visited: uniqueCafes.length,
    reviews_count: reviewCount,
    suggestions_count: suggestionCount,
  };
}

export async function updateMe(
  userId: string,
  input: { name?: string; username?: string; profile_image_url?: string | null },
) {
  const data: Prisma.UserUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.username !== undefined) data.username = input.username.toLowerCase();
  if (input.profile_image_url !== undefined) data.profileImageUrl = input.profile_image_url;
  const user = await prisma.user.update({ where: { id: userId }, data });
  return getMe(user);
}

export async function weeklyXp(userId: string, now = new Date()): Promise<number> {
  const start = startOfUtcWeek(now);
  const agg = await prisma.xpTransaction.aggregate({
    where: { userId, createdAt: { gte: start } },
    _sum: { xp: true },
  });
  return agg._sum.xp ?? 0;
}

export async function weeklyRank(userId: string, now = new Date()): Promise<number | null> {
  const start = startOfUtcWeek(now);
  const totals = await prisma.xpTransaction.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: start } },
    _sum: { xp: true },
  });
  if (totals.length === 0) {
    return null;
  }
  const sorted = [...totals].sort((a, b) => (b._sum.xp ?? 0) - (a._sum.xp ?? 0));
  const index = sorted.findIndex((row) => row.userId === userId);
  return index === -1 ? null : index + 1;
}

export async function listMyXpHistory(userId: string, page: number, limit: number) {
  const where = { userId };
  const [total, rows] = await Promise.all([
    prisma.xpTransaction.count({ where }),
    prisma.xpTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...skipTake(page, limit),
    }),
  ]);
  return {
    data: rows.map((tx) => ({
      id: tx.id,
      action: tx.action,
      xp: tx.xp,
      reference_type: tx.referenceType,
      reference_id: tx.referenceId,
      created_at: tx.createdAt,
    })),
    meta: paginationMeta(page, limit, total),
  };
}

export async function getMyXp(user: User) {
  return {
    total_xp: user.totalXp,
    weekly_xp: await weeklyXp(user.id),
    leaderboard_rank: await weeklyRank(user.id),
  };
}

export async function listMyVisits(userId: string, page: number, limit: number) {
  const where = { userId };
  const [total, rows] = await Promise.all([
    prisma.visit.count({ where }),
    prisma.visit.findMany({
      where,
      include: { cafe: { select: { id: true, name: true, place: true } }, media: true },
      orderBy: { createdAt: "desc" },
      ...skipTake(page, limit),
    }),
  ]);
  return { data: rows, meta: paginationMeta(page, limit, total) };
}

export async function listMyReviews(userId: string, page: number, limit: number) {
  const where = { userId, deletedAt: null };
  const [total, rows] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: { cafe: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      ...skipTake(page, limit),
    }),
  ]);
  return { data: rows, meta: paginationMeta(page, limit, total) };
}

export async function getPreferences(userId: string) {
  const prefs = await prisma.userPreference.findUnique({ where: { userId } });
  if (!prefs) {
    return {
      category_slugs: [] as string[],
      features: [] as string[],
      price_range: null,
      max_distance_km: null,
    };
  }
  return {
    category_slugs: prefs.categorySlugs,
    features: prefs.features,
    price_range: prefs.priceRange,
    max_distance_km: prefs.maxDistanceKm,
  };
}

export async function updatePreferences(
  userId: string,
  input: {
    category_slugs?: string[];
    features?: string[];
    price_range?: PriceRange | null;
    max_distance_km?: number | null;
  },
) {
  const existing = await prisma.userPreference.findUnique({ where: { userId } });
  const prefs = await prisma.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      categorySlugs: input.category_slugs ?? [],
      features: input.features ?? [],
      priceRange: input.price_range ?? null,
      maxDistanceKm: input.max_distance_km ?? null,
    },
    update: {
      ...(input.category_slugs !== undefined ? { categorySlugs: input.category_slugs } : {}),
      ...(input.features !== undefined ? { features: input.features } : {}),
      ...(input.price_range !== undefined ? { priceRange: input.price_range } : {}),
      ...(input.max_distance_km !== undefined ? { maxDistanceKm: input.max_distance_km } : {}),
    },
  });
  void existing;
  return getPreferences(userId);
}

export async function requireUser(userId: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
}
