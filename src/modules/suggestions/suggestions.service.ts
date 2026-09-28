import { SuggestionStatus, XpAction } from "../../domain/enums.js";
import { prisma } from "../../database/prisma.js";
import { ConflictError, NotFoundError, ValidationError } from "../../utils/errors.js";
import { paginationMeta, skipTake } from "../../utils/pagination.js";
import { getXpAmount } from "../xp/xp.service.js";

export async function listMySuggestions(userId: string, page: number, limit: number) {
  const where = { userId };
  const [total, rows] = await Promise.all([
    prisma.cafeSuggestion.count({ where }),
    prisma.cafeSuggestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...skipTake(page, limit),
    }),
  ]);
  return { data: rows, meta: paginationMeta(page, limit, total) };
}

export async function createSuggestion(
  userId: string,
  input: {
    name: string;
    address: string;
    place: string;
    latitude?: number;
    longitude?: number;
    description?: string;
    image_url?: string;
  },
) {
  return prisma.cafeSuggestion.create({
    data: {
      userId,
      name: input.name,
      address: input.address,
      place: input.place,
      latitude: input.latitude,
      longitude: input.longitude,
      description: input.description ?? "",
      imageUrl: input.image_url,
    },
  });
}

export async function adminListSuggestions(page: number, limit: number, status?: SuggestionStatus) {
  const where = status ? { status } : {};
  const [total, rows] = await Promise.all([
    prisma.cafeSuggestion.count({ where }),
    prisma.cafeSuggestion.findMany({
      where,
      include: { user: { select: { id: true, username: true, email: true } } },
      orderBy: { createdAt: "desc" },
      ...skipTake(page, limit),
    }),
  ]);
  return { data: rows, meta: paginationMeta(page, limit, total) };
}

export async function adminReviewSuggestion(
  suggestionId: string,
  input: { status: "APPROVED" | "REJECTED"; admin_note?: string },
) {
  const suggestion = await prisma.cafeSuggestion.findUnique({ where: { id: suggestionId } });
  if (!suggestion) {
    throw new NotFoundError("Suggestion not found");
  }
  if (suggestion.status !== "PENDING") {
    throw new ConflictError("Suggestion already reviewed");
  }
  if (input.status === "REJECTED") {
    return prisma.cafeSuggestion.update({
      where: { id: suggestionId },
      data: { status: "REJECTED", adminNote: input.admin_note },
    });
  }
  if (suggestion.latitude === null || suggestion.longitude === null) {
    throw new ValidationError("Latitude and longitude required to approve");
  }

  const xp = await getXpAmount(XpAction.CAFE_SUGGESTION);

  return prisma.$transaction(async (tx) => {
    const cafe = await tx.cafe.create({
      data: {
        name: suggestion.name,
        description: suggestion.description,
        latitude: suggestion.latitude!,
        longitude: suggestion.longitude!,
        address: suggestion.address,
        place: suggestion.place,
        source: "SUGGESTION",
        ownerType: "PLATFORM",
      },
    });
    const updated = await tx.cafeSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: "APPROVED",
        cafeId: cafe.id,
        adminNote: input.admin_note,
      },
    });
    await tx.xpTransaction.create({
      data: {
        userId: suggestion.userId,
        action: XpAction.CAFE_SUGGESTION,
        xp,
        referenceType: "CAFE_SUGGESTION",
        referenceId: suggestion.id,
      },
    });
    await tx.user.update({
      where: { id: suggestion.userId },
      data: { totalXp: { increment: xp } },
    });
    return { suggestion: updated, cafe, xp_awarded: xp };
  });
}
