import type { Request, Response } from "express";
import * as authService from "./auth.service.js";

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.registerUser(req.body);
  res.status(201).json({ data: result.user, tokens: result.tokens });
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.loginUser(req.body);
  res.status(200).json({ data: result.user, tokens: result.tokens });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const tokens = await authService.refreshSession(req.body.refresh_token);
  res.status(200).json({ tokens });
}

export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logoutUser(req.body.refresh_token);
  res.status(204).send();
}

export async function me(req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: authService.toPublicUser(req.user!) });
}
