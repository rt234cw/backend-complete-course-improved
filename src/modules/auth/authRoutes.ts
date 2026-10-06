import { Router } from "express";
import { authRateLimiter } from "../../lib/rateLimiter.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { rateLimit } from "../../middlewares/rateLimit.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { login, logout, me, refresh, requireRefreshToken, signup } from "./authController.js";
import { loginSchema, signupSchema } from "./authSchemas.js";

export const authRouter = Router();

const authRateLimit = rateLimit(authRateLimiter);

authRouter.post("/signup", authRateLimit, validateRequest({ body: signupSchema }), signup);
authRouter.post("/login", authRateLimit, validateRequest({ body: loginSchema }), login);
authRouter.post("/refresh", requireRefreshToken, authRateLimit, refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", authMiddleware, me);
