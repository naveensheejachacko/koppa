import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import * as controller from "./leaderboard.controller.js";

export const leaderboardRouter = Router();

leaderboardRouter.get("/weekly", asyncHandler(controller.weekly));
leaderboardRouter.get("/weekly/me", requireAuth, asyncHandler(controller.me));
