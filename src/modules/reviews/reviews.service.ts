import { VerificationStatus } from "../../domain/enums.js";
import { prisma } from "../../database/prisma.js";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../utils/errors.js";
import { paginationMeta, skipTake } from "../../utils/pagination.js";

export async function listCafeReviews(cafeId: string, page: number, limit: number) {
  const cafe = await prisma.cafe.findFirst({
    where: { id: cafeId, deletedAt: null, isActive: true },
  });
  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }
  const where = { cafeId, deletedAt: null, isHidden: false };
  const [total, rows] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, username: true, profileImageUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      ...skipTake(page, limit),
    }),
  ]);
  return {
    data: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      created_at: r.createdAt,
      user: {
        id: r.user.id,
        name: r.user.name,
        username: r.user.username,
        profile_image_url: r.user.profileImageUrl,
      },
    })),
    meta: paginationMeta(page, limit, total),
  };
}

export async function createReview(
  userId: string,
  cafeId: string,
  input: { rating: number; body: string },
) {
  const verified = await prisma.visit.findFirst({
    where: { userId, cafeId, verificationStatus: VerificationStatus.VERIFIED },
  });
  if (!verified) {
    throw new ValidationError("Verified visit required before reviewing");
  }
  try {
    const review = await prisma.review.create({
      data: { userId, cafeId, rating: input.rating, body: input.body },
    });
    return review;
  } catch {
    throw new ConflictError("Review already exists for this cafe");
  }
}

export async function updateReview(
  userId: string,
  reviewId: string,
  input: { rating?: number; body?: string },
) {
  const review = await prisma.review.findFirst({ where: { id: reviewId, deletedAt: null } });
  if (!review) {
    throw new NotFoundError("Review not found");
  }
  if (review.userId !== userId) {
    throw new ForbiddenError("Cannot edit another user's review");
  }
  return prisma.review.update({
    where: { id: reviewId },
    data: {
      ...(input.rating !== undefined ? { rating: input.rating } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
    },
  });
}

export async function deleteReview(userId: string, reviewId: string): Promise<void> {
  const review = await prisma.review.findFirst({ where: { id: reviewId, deletedAt: null } });
  if (!review) {
    throw new NotFoundError("Review not found");
  }
  if (review.userId !== userId) {
    throw new ForbiddenError("Cannot delete another user's review");
  }
  await prisma.review.update({
    where: { id: reviewId },
    data: { deletedAt: new Date() },
  });
}

export async function adminListReviews(page: number, limit: number) {
  const [total, rows] = await Promise.all([
    prisma.review.count(),
    prisma.review.findMany({
      include: {
        user: { select: { id: true, email: true, username: true } },
        cafe: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      ...skipTake(page, limit),
    }),
  ]);
  return { data: rows, meta: paginationMeta(page, limit, total) };
}

export async function adminHideReview(reviewId: string): Promise<void> {
  await prisma.review.update({
    where: { id: reviewId },
    data: { isHidden: true, deletedAt: new Date() },
  });
}
