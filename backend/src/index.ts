import "dotenv/config";
import cors from "cors";
import express from "express";
import { healthRouter } from "./routes/health.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { fieldRouter } from "./routes/field.route.js";

const app = express();
const port = process.env.BACKEND_PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/field", fieldRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
