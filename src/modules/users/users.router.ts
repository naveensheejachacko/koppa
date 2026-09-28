import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./users.controller.js";
import { updateMeSchema, updatePreferencesSchema } from "./users.schema.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);
usersRouter.get("/me", asyncHandler(controller.me));
usersRouter.patch("/me", validate(updateMeSchema), asyncHandler(controller.patchMe));
usersRouter.get("/me/xp", asyncHandler(controller.xp));
usersRouter.get("/me/xp-history", asyncHandler(controller.xpHistory));
usersRouter.get("/me/visits", asyncHandler(controller.visits));
usersRouter.get("/me/reviews", asyncHandler(controller.reviews));
usersRouter.get("/me/preferences", asyncHandler(controller.getPreferences));
usersRouter.patch(
  "/me/preferences",
  validate(updatePreferencesSchema),
  asyncHandler(controller.patchPreferences),
);
