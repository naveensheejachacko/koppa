import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { callableExport } from "./utils/callable-export.js";
import { authRouter } from "./modules/auth/auth.router.js";
import { usersRouter } from "./modules/users/users.router.js";
import { onboardingRouter } from "./modules/onboarding/onboarding.router.js";
import { cafesRouter, categoriesRouter, reviewsRouter } from "./modules/cafes/cafes.router.js";
import { suggestionsRouter } from "./modules/suggestions/suggestions.router.js";
import { leaderboardRouter } from "./modules/leaderboard/leaderboard.router.js";
import { adminRouter } from "./modules/admin/admin.router.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const openapiPath = path.join(dirname, "openapi.yaml");

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
  app.use(helmetMiddleware());
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

  if (existsSync(openapiPath)) {
    const swaggerDocument = YAML.load(openapiPath);
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    app.get("/openapi.yaml", (_req, res) => {
      res.sendFile(openapiPath);
    });
  }

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
