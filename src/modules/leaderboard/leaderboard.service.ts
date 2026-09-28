import { prisma } from "../../database/prisma.js";
import { paginationMeta, skipTake } from "../../utils/pagination.js";
import { startOfUtcWeek } from "../../utils/week.js";
import { weeklyRank, weeklyXp } from "../users/users.service.js";

export async function weeklyLeaderboard(page: number, limit: number, now = new Date()) {
  const start = startOfUtcWeek(now);
  const grouped = await prisma.xpTransaction.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: start } },
    _sum: { xp: true },
  });
  const sorted = [...grouped].sort((a, b) => (b._sum.xp ?? 0) - (a._sum.xp ?? 0));
  const total = sorted.length;
  const slice = sorted.slice((page - 1) * limit, page * limit);
  const users = await prisma.user.findMany({
    where: { id: { in: slice.map((row) => row.userId) } },
    select: { id: true, name: true, username: true, profileImageUrl: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));
  const data = slice.map((row, index) => {
    const user = byId.get(row.userId);
    return {
      rank: (page - 1) * limit + index + 1,
      user_id: row.userId,
      display_name: user?.name ?? "Unknown",
      username: user?.username ?? "unknown",
      profile_image_url: user?.profileImageUrl ?? null,
      weekly_xp: row._sum.xp ?? 0,
    };
  });
  return { data, meta: paginationMeta(page, limit, total) };
}

export async function myWeeklyRank(userId: string) {
  return {
    weekly_xp: await weeklyXp(userId),
    rank: await weeklyRank(userId),
  };
}
