import type { Request, Response } from "express";
import { routeParam } from "../../utils/route-param.js";
import * as visitsService from "./visits.service.js";

export async function create(req: Request, res: Response): Promise<void> {
  const result = await visitsService.createVisit(req.user!.id, routeParam(req, "id"), req.body);
  const status = result.visit.verificationStatus === "VERIFIED" ? 201 : 200;
  res.status(status).json({
    data: {
      visit: result.visit,
      xp_earned: result.xp_earned,
      total_xp: result.total_xp,
      weekly_xp: result.weekly_xp,
      unique_cafes_visited: result.unique_cafes_visited,
      total_visits: result.total_visits,
    },
  });
}
