import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { idParamSchema } from "../../schemas/commonSchemas.js";
import {
  addToWatchlist,
  listWatchlist,
  listWatchlistIds,
  patchWatchlistItem,
  removeFromWatchlist,
} from "./watchlistController.js";
import {
  addToWatchlistSchema,
  listWatchlistQuerySchema,
  patchWatchlistItemSchema,
} from "./watchlistSchemas.js";

export const watchlistRouter = Router();

watchlistRouter.use(authMiddleware);

watchlistRouter.get("/", validateRequest({ query: listWatchlistQuerySchema }), listWatchlist);

watchlistRouter.get("/ids", listWatchlistIds);

watchlistRouter.post("/", validateRequest({ body: addToWatchlistSchema }), addToWatchlist);

watchlistRouter.delete("/:id", validateRequest({ params: idParamSchema }), removeFromWatchlist);

watchlistRouter.patch(
  "/:id",
  validateRequest({ params: idParamSchema, body: patchWatchlistItemSchema }),
  patchWatchlistItem,
);
