import type { RequestHandler } from "express";
import * as genreService from "./genreService.js";

export const listGenres: RequestHandler = async (_req, res) => {
  const genres = await genreService.listGenres();

  res.status(200).json({ data: genres });
};
