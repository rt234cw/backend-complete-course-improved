import { Router } from "express";
import { docsRouter } from "./docs/docsRoutes.js";
import { authRouter } from "./modules/auth/authRoutes.js";
import { genreRouter } from "./modules/genre/genreRoutes.js";
import { movieRouter } from "./modules/movie/movieRoutes.js";
import { watchlistRouter } from "./modules/watchlist/watchlistRoutes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.status(200).json({ data: { status: "ok" } });
});

apiRouter.use(docsRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/movies", movieRouter);
apiRouter.use("/genres", genreRouter);
apiRouter.use("/watchlist", watchlistRouter);
