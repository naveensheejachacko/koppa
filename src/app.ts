import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { callableExport } from "./utils/callable-export.js";
import { redocHtml, swaggerHtml } from "./docs-html.js";
import openapi from "./openapi.json" with { type: "json" };
import { authRouter } from "./modules/auth/auth.router.js";
import { usersRouter } from "./modules/users/users.router.js";
import { onboardingRouter } from "./modules/onboarding/onboarding.router.js";
import { cafesRouter, categoriesRouter, reviewsRouter } from "./modules/cafes/cafes.router.js";
import { suggestionsRouter } from "./modules/suggestions/suggestions.router.js";
import { leaderboardRouter } from "./modules/leaderboard/leaderboard.router.js";
import { adminRouter } from "./modules/admin/admin.router.js";

const helmetMiddleware = callableExport(helmet);
const corsMiddleware = callableExport(cors);
const rateLimitMiddleware = callableExport<[
  {
    windowMs: number;
    limit: number;
    standardHeaders: "draft-7";
    legacyHeaders: boolean;
  },
]>(rateLimit);

export function createApp() {
  const app = express();
  const config = env();

  app.set("trust proxy", 1);
  app.use(
    helmetMiddleware({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "https://cdn.jsdelivr.net", "data:"],
        },
      },
    }),
  );
  app.use(
    corsMiddleware({
      origin: config.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(
    rateLimitMiddleware({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get(["/docs", "/docs/"], (_req, res) => {
    res.type("html").send(swaggerHtml(openapi));
  });
  app.get(["/redoc", "/redoc/"], (_req, res) => {
    res.type("html").send(redocHtml(openapi));
  });
  app.get("/openapi.json", (_req, res) => {
    res.json(openapi);
  });

  const api = express.Router();
  api.use("/auth", authRouter);
  api.use("/users", usersRouter);
  api.use("/onboarding", onboardingRouter);
  api.use("/cafes", cafesRouter);
  api.use("/categories", categoriesRouter);
  api.use("/reviews", reviewsRouter);
  api.use("/cafe-suggestions", suggestionsRouter);
  api.use("/leaderboard", leaderboardRouter);
  api.use("/admin", adminRouter);
  app.use("/api/v1", api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
