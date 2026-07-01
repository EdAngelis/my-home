import { chalkError, chalkSuccess } from "./tools/chalk";
import connect from "./db";
import logger from "./tools/winston";
import serverless from "serverless-http";

import app from "./app";
import config from "./config/config";

connect();

export const handler = serverless(app);

if (config.serverless !== "true") {
  const port = process.env.PORT || 3003;

  const server = app.listen(port, () => {
    console.log(`Server running on port ${chalkSuccess(port)}`);
  });

  server.on("error", (err) => {
    console.log(chalkError("Server error:", err));
  });
}

process.on("unhandledRejection", (reason, promise) => {
  console.log(
    chalkError("Unhandled Rejection at:", promise, "reason:", reason),
  );
  // Application specific logging, throwing an error, or other logic here
});

process.on("uncaughtException", (err) => {
  console.log(chalkError("Uncaught Exception:", err));
  // Application specific logging, throwing an error, or other logic here
});

process.on("SIGINT", () => {
  logger.warn("SIGINT signal received.");
  process.exit();
});

process.on("SIGTERM", () => {
  logger.warn("SIGTERM signal received.");
  process.exit();
});
