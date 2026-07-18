import "dotenv/config";
import cors from "cors";
import express from "express";
import { healthRouter } from "./routes/health.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { logger } from "./utils/logger.js";

const app = express();
const port = process.env.BACKEND_PORT || 4000;

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

app.use("/health", healthRouter);

app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
