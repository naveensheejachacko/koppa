import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./suggestions.controller.js";
import { createSuggestionSchema } from "./suggestions.schema.js";

export const suggestionsRouter = Router();

suggestionsRouter.post(
  "/",
  requireAuth,
  validate(createSuggestionSchema),
  asyncHandler(controller.create),
);
suggestionsRouter.get("/my", requireAuth, asyncHandler(controller.mine));
