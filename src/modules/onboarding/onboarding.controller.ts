import type { Request, Response } from "express";
import * as onboardingService from "./onboarding.service.js";

export async function questions(_req: Request, res: Response): Promise<void> {
  const data = await onboardingService.listQuestions();
  res.status(200).json({ data });
}

export async function answers(req: Request, res: Response): Promise<void> {
  await onboardingService.saveAnswers(req.user!.id, req.body.answers);
  res.status(200).json({ message: "Onboarding saved" });
}
