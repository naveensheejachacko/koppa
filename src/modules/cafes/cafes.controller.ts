import type { Request, Response } from "express";
import { paginationQuerySchema } from "../../utils/pagination.js";
import { routeParam } from "../../utils/route-param.js";
import * as cafesService from "./cafes.service.js";
import { listCafesQuerySchema, nearbyQuerySchema } from "./cafes.schema.js";
import * as recommendationsService from "../recommendations/recommendations.service.js";

export async function list(req: Request, res: Response): Promise<void> {
  const query = listCafesQuerySchema.parse(req.query);
  const result = await cafesService.listCafes(query);
  res.status(200).json(result);
}

export async function nearby(req: Request, res: Response): Promise<void> {
  const query = nearbyQuerySchema.parse(req.query);
  const result = await cafesService.nearbyCafes(query);
  res.status(200).json(result);
}

export async function recommended(req: Request, res: Response): Promise<void> {
  const { page, limit } = paginationQuerySchema.parse(req.query);
  const lat = req.query.lat !== undefined ? Number(req.query.lat) : undefined;
  const lng = req.query.lng !== undefined ? Number(req.query.lng) : undefined;
  const result = await recommendationsService.recommend(req.user!.id, {
    page,
    limit,
    latitude: Number.isFinite(lat) ? lat : undefined,
    longitude: Number.isFinite(lng) ? lng : undefined,
  });
  res.status(200).json(result);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const lat = req.query.lat !== undefined ? Number(req.query.lat) : undefined;
  const lng = req.query.lng !== undefined ? Number(req.query.lng) : undefined;
  const data = await cafesService.getCafe(
    routeParam(req, "id"),
    Number.isFinite(lat) ? lat : undefined,
    Number.isFinite(lng) ? lng : undefined,
  );
  res.status(200).json({ data });
}
