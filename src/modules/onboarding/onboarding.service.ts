import type { Prisma } from "@prisma/client";
import { PriceRange } from "../../domain/enums.js";
import { prisma } from "../../database/prisma.js";
import { ValidationError } from "../../utils/errors.js";

export async function listQuestions() {
  return prisma.onboardingQuestion.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function saveAnswers(
  userId: string,
  answers: Array<{ question_id: string; option_ids?: string[]; value?: string }>,
) {
  const questions = await prisma.onboardingQuestion.findMany({
    include: { options: true },
  });
  const byId = new Map(questions.map((q) => [q.id, q]));

  await prisma.$transaction(async (tx) => {
    await tx.userAnswer.deleteMany({ where: { userId } });
    const rows: Prisma.UserAnswerCreateManyInput[] = [];
    for (const answer of answers) {
      const question = byId.get(answer.question_id);
      if (!question) {
        throw new ValidationError("Unknown onboarding question");
      }
      if (question.type === "NUMBER") {
        if (!answer.value) {
          throw new ValidationError(`Value required for ${question.key}`);
        }
        rows.push({
          userId,
          questionId: question.id,
          value: answer.value,
        });
        continue;
      }
      const optionIds = answer.option_ids ?? [];
      if (question.type === "SINGLE" && optionIds.length !== 1) {
        throw new ValidationError(`Single option required for ${question.key}`);
      }
      if (question.type === "MULTI" && optionIds.length === 0) {
        throw new ValidationError(`At least one option required for ${question.key}`);
      }
      const allowed = new Set(question.options.map((o) => o.id));
      for (const optionId of optionIds) {
        if (!allowed.has(optionId)) {
          throw new ValidationError("Invalid option for question");
        }
        rows.push({ userId, questionId: question.id, optionId });
      }
    }
    if (rows.length > 0) {
      await tx.userAnswer.createMany({ data: rows });
    }
  });

  await syncPreferencesFromAnswers(userId);
  return { saved: true };
}

async function syncPreferencesFromAnswers(userId: string): Promise<void> {
  const answers = await prisma.userAnswer.findMany({
    where: { userId },
    include: { question: true, option: true },
  });
  const categorySlugs: string[] = [];
  const features: string[] = [];
  let priceRange: PriceRange | null = null;
  let maxDistanceKm: number | null = null;

  for (const answer of answers) {
    switch (answer.question.key) {
      case "categories":
        if (answer.option) categorySlugs.push(answer.option.value);
        break;
      case "features":
        if (answer.option) features.push(answer.option.value);
        break;
      case "price":
        if (answer.option && isPriceRange(answer.option.value)) {
          priceRange = answer.option.value;
        }
        break;
      case "distance_km":
        if (answer.value) {
          const n = Number(answer.value);
          if (!Number.isNaN(n)) maxDistanceKm = n;
        }
        break;
      default:
        break;
    }
  }

  await prisma.userPreference.upsert({
    where: { userId },
    create: { userId, categorySlugs, features, priceRange, maxDistanceKm },
    update: { categorySlugs, features, priceRange, maxDistanceKm },
  });
}

function isPriceRange(value: string): value is PriceRange {
  return value === "BUDGET" || value === "MODERATE" || value === "PREMIUM";
}
