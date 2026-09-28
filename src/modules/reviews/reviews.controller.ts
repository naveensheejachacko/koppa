import type { Request, Response } from "express";
import { paginationQuerySchema } from "../../utils/pagination.js";
import { routeParam } from "../../utils/route-param.js";
import * as reviewsService from "./reviews.service.js";

export async function listForCafe(req: Request, res: Response): Promise<void> {
  const { page, limit } = paginationQuerySchema.parse(req.query);
  const result = await reviewsService.listCafeReviews(routeParam(req, "id"), page, limit);
  res.status(200).json(result);
}

export async function create(req: Request, res: Response): Promise<void> {
  const review = await reviewsService.createReview(req.user!.id, routeParam(req, "id"), req.body);
  res.status(201).json({ data: review });
}

export async function update(req: Request, res: Response): Promise<void> {
  const review = await reviewsService.updateReview(req.user!.id, routeParam(req, "id"), req.body);
  res.status(200).json({ message: "Review updated", data: review });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await reviewsService.deleteReview(req.user!.id, routeParam(req, "id"));
  res.status(204).send();
}
