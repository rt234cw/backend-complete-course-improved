import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { connectDB, disconnectDB } from "./lib/prisma.js";

try {
  await connectDB();
} catch (error) {
  logger.fatal({ err: error }, "DB connection error");
  process.exit(1);
}

const app = createApp();

//後面的callback function是，啟動時，會一起呼叫的程式
const server = app.listen(env.PORT, () => {
  logger.info(`Server is running on PORT ${env.PORT}`);
});

const shutdown = (exitCode: number) => {
  setTimeout(() => process.exit(exitCode), 10_000).unref();

  server.close(() => {
    void disconnectDB().finally(() => process.exit(exitCode));
  });
};

/**
 * process.on("名稱")
 * 名稱的字必須一模一樣，這些都是node.js定義好的事件名稱
 */

//handle unhandled promise rejections (e.g db connection error)
process.on("unhandledRejection", (err) => {
  logger.fatal({ err }, "Unhandled rejection");
  shutdown(1);
});

//handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  shutdown(1);
});

/**
 * SIGTERM 是作業系統送給程式的一個信號，意思是「請你結束」。它是比較客氣的要求，程式收到後還有機會先做收尾工作，例如關閉連線、存檔，然後才退出。
 */
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  shutdown(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  shutdown(0);
});
