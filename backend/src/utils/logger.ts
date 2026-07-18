import fs from "node:fs";
import path from "node:path";
import pino from "pino";

const logDir = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

export const logger = pino(
  { level: process.env.LOG_LEVEL || "info" },
  pino.transport({
    targets: [
      {
        target: "pino-pretty",
        options: { colorize: true },
        level: "info",
      },
      {
        target: "pino/file",
        options: { destination: path.join(logDir, "app.log") },
        level: "info",
      },
    ],
  }),
);
