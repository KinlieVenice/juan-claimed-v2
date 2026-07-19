import "dotenv/config";
import cors from "cors";
import express from "express";
import { healthRouter } from "./routes/health.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { logger } from "./utils/logger.js";
import { fieldRouter } from "./routes/field.route.js";
import { ruleGroupRouter } from "./routes/ruleGroup.route.js";
import { dynamicRuleGroupRouter } from "./routes/fieldRuleGroup.route.js";
import { fieldHierarchyRouter } from "./routes/fieldHierarchy.route.js";
import { fieldLookupRouter } from "./routes/fieldLookup.route.js";
import { groupRouter } from "./routes/group.route.js";
import { userRouter } from "./routes/user.route.js";
import { benefitRouter } from "./routes/benefit.routes.js";
import { scopeRouter } from "./routes/scope.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { attachmentUploadRouter } from "./routes/attachmentUpload.routes.js";
import { fieldAnswerRouter } from "./routes/fieldAnswer.route.js";


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
app.use("/api/dynamic-rule-groups", dynamicRuleGroupRouter);
app.use("/api/field-hierarchies", fieldHierarchyRouter);
app.use("/api", fieldLookupRouter);
app.use("/api/field-answers", fieldAnswerRouter);

app.use("/api/groups", groupRouter);
app.use("/api/users", userRouter);
app.use("/api/benefits", benefitRouter);
app.use("/api/scopes", scopeRouter);
app.use("/api/auth", authRouter);
app.use("/api/attachments", attachmentUploadRouter);


app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
