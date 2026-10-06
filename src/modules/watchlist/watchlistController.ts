import type { RequestHandler } from "express";
import { requireUser } from "../../middlewares/authMiddleware.js";
import type { IdParams } from "../../schemas/commonSchemas.js";
import type {
  AddToWatchlistInput,
  ListWatchlistQuery,
  PatchWatchlistItemInput,
} from "./watchlistSchemas.js";
import * as watchlistService from "./watchlistService.js";

export const listWatchlist: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  ListWatchlistQuery
> = async (req, res) => {
  const user = requireUser(req);

  const { items, meta } = await watchlistService.listWatchlist(user.id, req.query);

  res.status(200).json({ data: items, meta });
};

export const listWatchlistIds: RequestHandler = async (req, res) => {
  const user = requireUser(req);

  const data = await watchlistService.listWatchlistIds(user.id);

  res.status(200).json({ data });
};

export const addToWatchlist: RequestHandler<
  Record<string, string>,
  unknown,
  AddToWatchlistInput
> = async (req, res) => {
  //從 authMiddleware.js 裡 req.user = user 來的
  const user = requireUser(req);

  const watchlistItem = await watchlistService.addToWatchlist(user.id, req.body);

  res.status(201).json({ data: watchlistItem });
};

export const removeFromWatchlist: RequestHandler<IdParams> = async (req, res) => {
  const user = requireUser(req);

  await watchlistService.removeFromWatchlist(user.id, req.params.id);

  res.status(204).end();
};

export const patchWatchlistItem: RequestHandler<
  IdParams,
  unknown,
  PatchWatchlistItemInput
> = async (req, res) => {
  const user = requireUser(req);

  const watchlistItem = await watchlistService.updateWatchlistItem(
    user.id,
    req.params.id,
    req.body,
  );

  res.status(200).json({ data: watchlistItem });
};
