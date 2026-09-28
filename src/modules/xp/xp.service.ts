import { XpAction } from "../../domain/enums.js";
import { prisma } from "../../database/prisma.js";
import { AppError } from "../../utils/errors.js";

export async function getXpAmount(action: XpAction): Promise<number> {
  const rule = await prisma.xpRule.findUnique({ where: { action } });
  if (!rule || !rule.isActive) {
    throw new AppError(500, `XP rule missing or inactive: ${action}`);
  }
  return rule.xp;
}

export async function listXpRules() {
  return prisma.xpRule.findMany({ orderBy: { action: "asc" } });
}

export async function updateXpRule(action: XpAction, xp: number, isActive?: boolean) {
  return prisma.xpRule.update({
    where: { action },
    data: {
      xp,
      ...(isActive === undefined ? {} : { isActive }),
    },
  });
}
