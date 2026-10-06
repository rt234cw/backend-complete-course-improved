import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { addToWatchlistSchema,patchWatchlistItemSchema } from "../validators/watchlistValidator.js";
import { addToWatchlist,removeFromWatchlist,patchWatchlistItem,getMyWatchlist } from "../controllers/watchlistController.js";

const router = express.Router()

router.use(authMiddleware)

router.post('/',validateRequest(addToWatchlistSchema),addToWatchlist)

router.delete('/:id',removeFromWatchlist)

router.patch('/:id',validateRequest(patchWatchlistItemSchema),patchWatchlistItem)

router.get('/ids',getMyWatchlist)



export default router