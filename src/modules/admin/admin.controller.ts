import type { Request, Response } from "express";
import { paginationQuerySchema } from "../../utils/pagination.js";
import { routeParam } from "../../utils/route-param.js";
import * as adminService from "./admin.service.js";
import * as reviewsService from "../reviews/reviews.service.js";
import * as suggestionsService from "../suggestions/suggestions.service.js";
import { suggestionListQuerySchema } from "./admin.schema.js";

export async function dashboard(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: await adminService.dashboard() });
}

export async function listCategories(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: await adminService.listCategories() });
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const data = await adminService.createCategory(req.body);
  res.status(201).json({ data });
}

export async function patchCategory(req: Request, res: Response): Promise<void> {
  const data = await adminService.updateCategory(routeParam(req, "id"), req.body);
  res.status(200).json({ message: "Category updated", data });
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  await adminService.deleteCategory(routeParam(req, "id"));
  res.status(204).send();
}

export async function listCafes(req: Request, res: Response): Promise<void> {
  const { page, limit } = paginationQuerySchema.parse(req.query);
  const includeDeleted = req.query.include_deleted === "true";
  const result = await adminService.adminListCafes(page, limit, includeDeleted);
  res.status(200).json(result);
}

export async function getCafe(req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: await adminService.adminGetCafe(routeParam(req, "id")) });
}

export async function createCafe(req: Request, res: Response): Promise<void> {
  const data = await adminService.createCafe(req.body);
  res.status(201).json({ data });
}

export async function patchCafe(req: Request, res: Response): Promise<void> {
  const data = await adminService.updateCafe(routeParam(req, "id"), req.body, req.user!.id);
  res.status(200).json({ message: "Cafe updated", data });
}

export async function deleteCafe(req: Request, res: Response): Promise<void> {
  await adminService.softDeleteCafe(routeParam(req, "id"));
  res.status(204).send();
}

export async function restoreCafe(req: Request, res: Response): Promise<void> {
  const data = await adminService.restoreCafe(routeParam(req, "id"));
  res.status(200).json({ message: "Cafe restored", data });
}

export async function addMedia(req: Request, res: Response): Promise<void> {
  const data = await adminService.addCafeMedia(routeParam(req, "id"), req.user!.id, req.body);
  res.status(201).json({ data });
}

export async function patchMedia(req: Request, res: Response): Promise<void> {
  const data = await adminService.setCafeMediaDefault(
    routeParam(req, "id"),
    routeParam(req, "mediaId"),
  );
  res.status(200).json({ message: "Default media updated", data });
}

export async function deleteMedia(req: Request, res: Response): Promise<void> {
  await adminService.deleteCafeMedia(routeParam(req, "id"), routeParam(req, "mediaId"));
  res.status(204).send();
}

export async function listReviews(req: Request, res: Response): Promise<void> {
  const { page, limit } = paginationQuerySchema.parse(req.query);
  const result = await reviewsService.adminListReviews(page, limit);
  res.status(200).json(result);
}

export async function hideReview(req: Request, res: Response): Promise<void> {
  await reviewsService.adminHideReview(routeParam(req, "id"));
  res.status(204).send();
}

export async function listSuggestions(req: Request, res: Response): Promise<void> {
  const { page, limit } = paginationQuerySchema.parse(req.query);
  const { status } = suggestionListQuerySchema.parse(req.query);
  const result = await suggestionsService.adminListSuggestions(page, limit, status);
  res.status(200).json(result);
}

export async function reviewSuggestion(req: Request, res: Response): Promise<void> {
  const data = await suggestionsService.adminReviewSuggestion(routeParam(req, "id"), req.body);
  res.status(200).json({ data });
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const { page, limit } = paginationQuerySchema.parse(req.query);
  const result = await adminService.adminListUsers(page, limit);
  res.status(200).json(result);
}

export async function listVisits(req: Request, res: Response): Promise<void> {
  const { page, limit } = paginationQuerySchema.parse(req.query);
  const result = await adminService.adminListVisits(page, limit);
  res.status(200).json(result);
}

export async function listXpRules(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: await adminService.listXpRules() });
}

export async function patchXpRule(req: Request, res: Response): Promise<void> {
  const data = await adminService.updateXpRule(req.body.action, req.body.xp, req.body.is_active);
  res.status(200).json({ message: "XP rule updated", data });
}
