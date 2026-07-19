import { Router } from "express";
import { login, googleLogin, me } from "../controllers/auth.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { loginSchema, googleLoginSchema } from "../requests/auth.request.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";

export const authRouter = Router();

authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/google", validateBody(googleLoginSchema), googleLogin);
authRouter.get("/me", mockAuth, me);
