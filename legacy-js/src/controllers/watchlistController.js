import { WatchlistStatus } from "@prisma/client";
import { prisma } from "../config/db.js";

const addToWatchlist = async(req, res)=>{
    const {movieId,status,rating,notes} = req.body;
    console.log(`${movieId}`)

    const movie = await prisma.movie.findUnique({
        where:{id:movieId}
    })

    if (!movie) {
        return res.status(404).json("movie doesn't exist")
        
    }

    const existingInWatchlist = await prisma.watchlistItem.findUnique({
        where:{userId_movieId:{
            userId:req.user.id,
            movieId:movieId
        }}
    })

    if (existingInWatchlist) {
         return res.status(400).json({
            error:"movie already in the watchlist"
        })
        
    }

    const watchlistItem = await prisma.watchlistItem.create({
        data:{
            //從 authMiddleware.js 裡 req.user = user 來的
            userId:req.user.id,
            movieId,
            status:status || WatchlistStatus.PLANNED,
            rating,
            notes
        }
    })

    return res.status(201).json({
        data:{
            watchlistItem
        }
    })

    
}

const removeFromWatchlist = async(req,res)=>{
    const watchlistItemId = req.params.id

    const watchlistItem = await prisma.watchlistItem.findUnique({
        where:{id:watchlistItemId}
    })

    if (!watchlistItem) {
          return res.status(404).json({error:"watchlist item not found"})
    }


  if (watchlistItem.userId !== req.user.id) {
          return res.status(403).json({error:"you are not allowed to operate this action"})
        
    }

    await prisma.watchlistItem.delete({
        where:{id:req.params.id}
    })
    
res.status(200).json({
    status:"delete successfully",
    message:"movie removed from watchlist"
})
}

const patchWatchlistItem = async(req,res)=>{
    const id = req.params.id

    const watchlistItem = await prisma.watchlistItem.findUnique({
        where:{id}
    })

    if (!watchlistItem) {
        return res.status(404).json("the item you wanted to patch doesn't exist")
    }

    if (watchlistItem.userId !== req.user.id) {

          return res.status(403).json({error:"you are not allowed to operate this action"})
        
    }

    const {status,rating,notes} = req.body

    const updatedData = {}

    if(status!== undefined) updatedData.status = status
    if(rating !== undefined) updatedData.rating = rating
    if(notes !== undefined) updatedData.notes = notes

    const updatedItem = await prisma.watchlistItem.update({
        where:{id:id},
        data:updatedData
    })


res.status(200).json({
    status:"successfully",
    data:{
        watchlistItem:updatedItem
    }
})



}


const getMyWatchlist = async(req,res)=>{

    const myUserId = req.user.id

    //findMany找不到時，會回傳empty []
    const data = await prisma.watchlistItem.findMany(
      {where:{userId:myUserId},
      select:{id:true,movieId:true,status:true}
    
    }
    )


    return res.status(200).json({data})

}

export {addToWatchlist,removeFromWatchlist,patchWatchlistItem,getMyWatchlist}