import { Router } from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { paginationQuerySchema } from "../../utils/pagination.js";
import { routeParam } from "../../utils/route-param.js";
import * as controller from "./cafes.controller.js";
import * as reviewsController from "../reviews/reviews.controller.js";
import * as visitsController from "../visits/visits.controller.js";
import { createReviewSchema, updateReviewSchema } from "../reviews/reviews.schema.js";
import { createVisitSchema } from "../visits/visits.schema.js";
import { listCafesByCategory } from "./cafes.service.js";
import { listCategories } from "../admin/admin.service.js";

export const cafesRouter = Router();

cafesRouter.get("/", asyncHandler(controller.list));
cafesRouter.get("/nearby", asyncHandler(controller.nearby));
cafesRouter.get("/recommended", requireAuth, asyncHandler(controller.recommended));
cafesRouter.get("/:id", asyncHandler(controller.getById));
cafesRouter.get("/:id/reviews", asyncHandler(reviewsController.listForCafe));
cafesRouter.post(
  "/:id/reviews",
  requireAuth,
  validate(createReviewSchema),
  asyncHandler(reviewsController.create),
);
cafesRouter.post(
  "/:id/visits",
  requireAuth,
  validate(createVisitSchema),
  asyncHandler(visitsController.create),
);

export const categoriesRouter = Router();

categoriesRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({ data: await listCategories() });
  }),
);

categoriesRouter.get(
  "/:id/cafes",
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = paginationQuerySchema.parse(req.query);
    const result = await listCafesByCategory(routeParam(req, "id"), page, limit);
    res.status(200).json(result);
  }),
);

export const reviewsRouter = Router();

reviewsRouter.patch(
  "/:id",
  requireAuth,
  validate(updateReviewSchema),
  asyncHandler(reviewsController.update),
);
reviewsRouter.delete("/:id", requireAuth, asyncHandler(reviewsController.remove));
