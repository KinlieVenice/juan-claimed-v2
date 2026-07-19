import "dotenv/config";
import cors from "cors";
import express from "express";
import { healthRouter } from "./routes/health.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { logger } from "./utils/logger.js";
import { fieldRouter } from "./routes/field.route.js";
import { ruleGroupRouter } from "./routes/ruleGroup.route.js";

const app = express();
const port = process.env.BACKEND_PORT || 4000;

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

app.use("/health", healthRouter);
app.use("/api/fields", fieldRouter);
app.use("/api/rule-groups", ruleGroupRouter);


app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
