import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";
import { ValidationError } from "../utils/errors.js";

type Source = "body" | "query" | "params";

export function validate(schema: ZodType, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(toValidationError(result.error));
      return;
    }
    req[source] = result.data as never;
    next();
  };
}

function toValidationError(error: ZodError): ValidationError {
  return new ValidationError("Validation failed", error.flatten());
}
