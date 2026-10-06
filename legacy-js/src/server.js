import express from "express";
import { connectDB,disconnectDB } from "./config/db.js";
import { config } from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import  watchlistRoutes  from "./routes/watchlistRoutes.js";
import  cookieParser  from "cookie-parser";


config();
connectDB();

const app = express()
const PORT = 8080
app.use(cookieParser()); // 放在 routes 之前
app.use(express.json())
app.use('/auth',authRoutes)
app.use('/watchlist',watchlistRoutes)




//後面的callback function是，啟動時，會一起呼叫的程式
const server = app.listen(PORT,()=>{
    console.log(`Server is running on PORT ${PORT}`)
})


/**
 * process.on("名稱")
 * 名稱的字必須一模一樣，這些都是node.js定義好的事件名稱
 */


//handle unhandled promise rejections (e.g db connection error)
process.on("unhandledRejection",(err)=>{
    console.error("unhandle Rejection:",err);
    server.close(async()=>{
        await disconnectDB();
        process.exit(1);
    })
})

//handle uncaught exceptions
process.on("uncaughtException",(err)=>{
    console.error("Uncaught Exception:",err);
    server.close(async()=>{
        await disconnectDB();
        process.exit(1);
    })
})

/**
 * SIGTERM 是作業系統送給程式的一個信號，意思是「請你結束」。它是比較客氣的要求，程式收到後還有機會先做收尾工作，例如關閉連線、存檔，然後才退出。
 */
process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully")
    server.close(async () => {
        await disconnectDB()
        process.exit(0)
    })
})