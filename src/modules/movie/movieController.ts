import type { RequestHandler } from "express";
import type { IdParams } from "../../schemas/commonSchemas.js";
import type { ListMoviesQuery } from "./movieSchemas.js";
import * as movieService from "./movieService.js";

type Params = Record<string, string>;

export const listMovies: RequestHandler<Params, unknown, unknown, ListMoviesQuery> = async (
  req,
  res,
) => {
  const { movies, meta } = await movieService.listMovies(req.query);

  res.status(200).json({ data: movies, meta });
};

export const getMovie: RequestHandler<IdParams> = async (req, res) => {
  const movie = await movieService.getMovie(req.params.id);

  res.status(200).json({ data: movie });
};
