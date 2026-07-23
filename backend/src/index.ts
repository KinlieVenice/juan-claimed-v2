// Local dev entrypoint only (Docker Compose runs this via `tsx watch`) — Vercel never runs
// this file, it imports app.ts directly via api/index.ts instead. Keep this file limited to
// "start listening"; anything about the app itself (middleware, routes) belongs in app.ts so
// both entrypoints share the exact same app.
import app from "./app.js";
import { logger } from "./utils/logger.js";

const port = process.env.BACKEND_PORT || 4000;

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
