import { Router } from "express";
import { login, googleLogin, egovLogin, me, changePassword } from "../controllers/auth.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { loginSchema, googleLoginSchema, egovLoginSchema, changePasswordSchema } from "../requests/auth.request.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";

export const authRouter = Router();

authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/google", validateBody(googleLoginSchema), googleLogin);
authRouter.post("/egov", validateBody(egovLoginSchema), egovLogin);
authRouter.get("/me", mockAuth, me);
authRouter.post("/change-password", mockAuth, validateBody(changePasswordSchema), changePassword);
