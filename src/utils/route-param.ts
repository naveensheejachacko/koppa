import type { Request } from "express";
import { ValidationError } from "./errors.js";

export function routeParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new ValidationError(`Missing route parameter: ${name}`);
  }
  return value;
}
