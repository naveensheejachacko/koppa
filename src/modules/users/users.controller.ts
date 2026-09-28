import type { Request, Response } from "express";
import { paginationQuerySchema } from "../../utils/pagination.js";
import * as usersService from "./users.service.js";

export async function me(req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: await usersService.getMe(req.user!) });
}

export async function patchMe(req: Request, res: Response): Promise<void> {
  const data = await usersService.updateMe(req.user!.id, req.body);
  res.status(200).json({ message: "Profile updated", data });
}

export async function xp(req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: await usersService.getMyXp(req.user!) });
}

export async function xpHistory(req: Request, res: Response): Promise<void> {
  const { page, limit } = paginationQuerySchema.parse(req.query);
  const result = await usersService.listMyXpHistory(req.user!.id, page, limit);
  res.status(200).json(result);
}

export async function visits(req: Request, res: Response): Promise<void> {
  const { page, limit } = paginationQuerySchema.parse(req.query);
  const result = await usersService.listMyVisits(req.user!.id, page, limit);
  res.status(200).json(result);
}

export async function reviews(req: Request, res: Response): Promise<void> {
  const { page, limit } = paginationQuerySchema.parse(req.query);
  const result = await usersService.listMyReviews(req.user!.id, page, limit);
  res.status(200).json(result);
}

export async function getPreferences(req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: await usersService.getPreferences(req.user!.id) });
}

export async function patchPreferences(req: Request, res: Response): Promise<void> {
  const data = await usersService.updatePreferences(req.user!.id, req.body);
  res.status(200).json({ message: "Preferences updated", data });
}
