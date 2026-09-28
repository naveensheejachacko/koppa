import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { isPrismaUniqueViolation } from "../domain/enums.js";
import { AppError } from "../utils/errors.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: err.flatten() });
    return;
  }

  if (isPrismaUniqueViolation(err)) {
    res.status(409).json({ error: "Resource already exists" });
    return;
  }
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "P2025"
  ) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  if (process.env.NODE_ENV !== "production") {
    res.status(500).json({ error: message });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Route not found" });
}
