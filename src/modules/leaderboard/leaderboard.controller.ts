import type { Request, Response } from "express";
import { paginationQuerySchema } from "../../utils/pagination.js";
import * as leaderboardService from "./leaderboard.service.js";

export async function weekly(req: Request, res: Response): Promise<void> {
  const { page, limit } = paginationQuerySchema.parse(req.query);
  const result = await leaderboardService.weeklyLeaderboard(page, limit);
  res.status(200).json(result);
}

export async function me(req: Request, res: Response): Promise<void> {
  const data = await leaderboardService.myWeeklyRank(req.user!.id);
  res.status(200).json({ data });
}
