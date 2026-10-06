import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { randomUUID } from "node:crypto";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { globalRateLimiter } from "./lib/rateLimiter.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";
import { rateLimit } from "./middlewares/rateLimit.js";
import { apiRouter } from "./routes.js";

export const createApp = () => {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    pinoHttp({
      logger,
      genReqId: (_req, res) => {
        const id = randomUUID();
        res.setHeader("X-Request-Id", id);
        return id;
      },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
      autoLogging: {
        ignore: (req) => req.url === "/api/health",
      },
    }),
  );
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  app.use(rateLimit(globalRateLimiter));
  app.use(cookieParser()); // 放在 routes 之前
  app.use(express.json({ limit: "10kb" }));

  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
