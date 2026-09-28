import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./admin.controller.js";
import {
  cafeMediaSchema,
  categoryBodySchema,
  createCafeSchema,
  patchCafeSchema,
  patchCategorySchema,
  suggestionReviewSchema,
  xpRulePatchSchema,
} from "./admin.schema.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/dashboard", asyncHandler(controller.dashboard));

adminRouter.get("/categories", asyncHandler(controller.listCategories));
adminRouter.post("/categories", validate(categoryBodySchema), asyncHandler(controller.createCategory));
adminRouter.patch(
  "/categories/:id",
  validate(patchCategorySchema),
  asyncHandler(controller.patchCategory),
);
adminRouter.delete("/categories/:id", asyncHandler(controller.deleteCategory));

adminRouter.get("/cafes", asyncHandler(controller.listCafes));
adminRouter.post("/cafes", validate(createCafeSchema), asyncHandler(controller.createCafe));
adminRouter.get("/cafes/:id", asyncHandler(controller.getCafe));
adminRouter.patch("/cafes/:id", validate(patchCafeSchema), asyncHandler(controller.patchCafe));
adminRouter.delete("/cafes/:id", asyncHandler(controller.deleteCafe));
adminRouter.patch("/cafes/:id/restore", asyncHandler(controller.restoreCafe));
adminRouter.post("/cafes/:id/media", validate(cafeMediaSchema), asyncHandler(controller.addMedia));

adminRouter.get("/reviews", asyncHandler(controller.listReviews));
adminRouter.delete("/reviews/:id", asyncHandler(controller.hideReview));

adminRouter.get("/cafe-suggestions", asyncHandler(controller.listSuggestions));
adminRouter.patch(
  "/cafe-suggestions/:id",
  validate(suggestionReviewSchema),
  asyncHandler(controller.reviewSuggestion),
);

adminRouter.get("/users", asyncHandler(controller.listUsers));
adminRouter.get("/visits", asyncHandler(controller.listVisits));
adminRouter.get("/xp-rules", asyncHandler(controller.listXpRules));
adminRouter.patch("/xp-rules", validate(xpRulePatchSchema), asyncHandler(controller.patchXpRule));
