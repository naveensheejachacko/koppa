import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./onboarding.controller.js";
import { saveAnswersSchema } from "./onboarding.schema.js";

export const onboardingRouter = Router();

onboardingRouter.get("/questions", asyncHandler(controller.questions));
onboardingRouter.post(
  "/answers",
  requireAuth,
  validate(saveAnswersSchema),
  asyncHandler(controller.answers),
);
