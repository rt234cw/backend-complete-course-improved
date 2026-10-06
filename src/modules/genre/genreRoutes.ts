import { Router } from "express";
import { listGenres } from "./genreController.js";

export const genreRouter = Router();

genreRouter.get("/", listGenres);
