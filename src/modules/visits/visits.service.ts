import { MediaType, Prisma, VerificationStatus, XpAction } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { ConflictError, NotFoundError } from "../../utils/errors.js";
import { utcVisitDay } from "../../utils/week.js";
import { getXpAmount } from "../xp/xp.service.js";
import { weeklyXp } from "../users/users.service.js";
import { evaluateVisitLocation } from "../verification/verification.service.js";

export type CreateVisitInput = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  media?: {
    cloudinary_url: string;
    public_id: string;
    thumbnail_url?: string;
    media_type?: MediaType;
  };
};

export async function createVisit(userId: string, cafeId: string, input: CreateVisitInput) {
  const cafe = await prisma.cafe.findFirst({
    where: { id: cafeId, deletedAt: null, isActive: true, status: "ACTIVE" },
  });
  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }

  const verdict = evaluateVisitLocation({
    userLat: input.latitude,
    userLng: input.longitude,
    cafeLat: cafe.latitude,
    cafeLng: cafe.longitude,
    accuracy: input.accuracy,
  });
  const distanceMeters = verdict.distanceMeters;
  const visitDay = utcVisitDay();

  const status = verdict.verified ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED;
  const rejectionReason = verdict.verified ? undefined : verdict.reason;

  const existingVerified = await prisma.visit.findFirst({
    where: {
      userId,
      cafeId,
      visitDay,
      verificationStatus: VerificationStatus.VERIFIED,
    },
  });
  if (existingVerified && status === VerificationStatus.VERIFIED) {
    throw new ConflictError("One verified visit per cafe per day");
  }

  if (status !== VerificationStatus.VERIFIED) {
    const visit = await prisma.visit.create({
      data: {
        userId,
        cafeId,
        latitude: input.latitude,
        longitude: input.longitude,
        gpsAccuracy: input.accuracy,
        distanceFromCafe: distanceMeters,
        verificationStatus: status,
        rejectionReason,
        visitDay,
        media: input.media
          ? {
              create: {
                userId,
                cafeId,
                cloudinaryUrl: input.media.cloudinary_url,
                publicId: input.media.public_id,
                thumbnailUrl: input.media.thumbnail_url,
                mediaType: input.media.media_type ?? MediaType.IMAGE,
              },
            }
          : undefined,
      },
      include: { media: true, cafe: { select: { id: true, name: true } } },
    });
    return {
      visit,
      xp_earned: 0,
      total_xp: (await prisma.user.findUniqueOrThrow({ where: { id: userId } })).totalXp,
      weekly_xp: await weeklyXp(userId),
      unique_cafes_visited: await uniqueCafeCount(userId),
      total_visits: await verifiedVisitCount(userId),
    };
  }

  const priorVerified = await prisma.visit.findFirst({
    where: { userId, cafeId, verificationStatus: VerificationStatus.VERIFIED },
  });
  const action = priorVerified ? XpAction.REVISIT : XpAction.NEW_CAFE_VISIT;
  const xp = await getXpAmount(action);

  const result = await prisma.$transaction(async (tx) => {
    const visit = await tx.visit.create({
      data: {
        userId,
        cafeId,
        latitude: input.latitude,
        longitude: input.longitude,
        gpsAccuracy: input.accuracy,
        distanceFromCafe: distanceMeters,
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        visitDay,
        media: input.media
          ? {
              create: {
                userId,
                cafeId,
                cloudinaryUrl: input.media.cloudinary_url,
                publicId: input.media.public_id,
                thumbnailUrl: input.media.thumbnail_url,
                mediaType: input.media.media_type ?? MediaType.IMAGE,
              },
            }
          : undefined,
      },
      include: { media: true, cafe: { select: { id: true, name: true } } },
    });

    try {
      await tx.xpTransaction.create({
        data: {
          userId,
          action,
          xp,
          referenceType: "VISIT",
          referenceId: visit.id,
          visitId: visit.id,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("XP already awarded for this visit");
      }
      throw error;
    }

    const user = await tx.user.update({
      where: { id: userId },
      data: { totalXp: { increment: xp } },
    });

    return { visit, user };
  });

  return {
    visit: result.visit,
    xp_earned: xp,
    total_xp: result.user.totalXp,
    weekly_xp: await weeklyXp(userId),
    unique_cafes_visited: await uniqueCafeCount(userId),
    total_visits: await verifiedVisitCount(userId),
  };
}

async function uniqueCafeCount(userId: string): Promise<number> {
  const rows = await prisma.visit.findMany({
    where: { userId, verificationStatus: VerificationStatus.VERIFIED },
    distinct: ["cafeId"],
    select: { cafeId: true },
  });
  return rows.length;
}

async function verifiedVisitCount(userId: string): Promise<number> {
  return prisma.visit.count({
    where: { userId, verificationStatus: VerificationStatus.VERIFIED },
  });
}
