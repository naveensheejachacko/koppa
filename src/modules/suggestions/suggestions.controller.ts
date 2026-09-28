import type { Request, Response } from "express";
import { paginationQuerySchema } from "../../utils/pagination.js";
import * as suggestionsService from "./suggestions.service.js";

export async function create(req: Request, res: Response): Promise<void> {
  const data = await suggestionsService.createSuggestion(req.user!.id, req.body);
  res.status(201).json({ data });
}

export async function mine(req: Request, res: Response): Promise<void> {
  const { page, limit } = paginationQuerySchema.parse(req.query);
  const result = await suggestionsService.listMySuggestions(req.user!.id, page, limit);
  res.status(200).json(result);
}
