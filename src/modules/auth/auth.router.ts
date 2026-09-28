import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import * as controller from "./auth.controller.js";
import { loginSchema, refreshSchema, registerSchema } from "./auth.schema.js";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), asyncHandler(controller.register));
authRouter.post("/login", validate(loginSchema), asyncHandler(controller.login));
authRouter.post("/refresh", validate(refreshSchema), asyncHandler(controller.refresh));
authRouter.post("/logout", validate(refreshSchema), asyncHandler(controller.logout));
authRouter.get("/me", requireAuth, asyncHandler(controller.me));
