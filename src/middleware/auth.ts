import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role, type User } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../database/prisma.js";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

export type AccessTokenPayload = {
  sub: string;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }
  void attachUser(req, header.slice("Bearer ".length)).then(() => next()).catch(() => next());
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new UnauthorizedError());
    return;
  }
  void attachUser(req, header.slice("Bearer ".length))
    .then(() => {
      if (!req.user) {
        next(new UnauthorizedError("Invalid token"));
        return;
      }
      next();
    })
    .catch(next);
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new UnauthorizedError());
    return;
  }
  if (req.user.role !== Role.ADMIN) {
    next(new ForbiddenError("Admin access required"));
    return;
  }
  next();
}

async function attachUser(req: Request, token: string): Promise<void> {
  let payload: AccessTokenPayload;
  try {
    payload = jwt.verify(token, env().JWT_SECRET) as AccessTokenPayload;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new UnauthorizedError("User not found");
  }
  req.user = user;
}
