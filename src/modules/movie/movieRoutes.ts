import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { idParamSchema } from "../../schemas/commonSchemas.js";
import { getMovie, listMovies } from "./movieController.js";
import { listMoviesQuerySchema } from "./movieSchemas.js";

export const movieRouter = Router();

movieRouter.get("/", validateRequest({ query: listMoviesQuerySchema }), listMovies);

movieRouter.get("/:id", validateRequest({ params: idParamSchema }), getMovie);
