import { Router } from "express";
import { getAllFields, getFieldById, createField, updateField, deleteField } from "../controllers/field.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { createUpdateFieldSchema } from "../requests/field.request.js";

export const fieldRouter = Router();

fieldRouter.get("/", getAllFields);
fieldRouter.get("/:id", getFieldById);
fieldRouter.post("/", validateBody(createUpdateFieldSchema), createField);
fieldRouter.put("/:id", validateBody(createUpdateFieldSchema), updateField);
fieldRouter.delete("/:id", deleteField);

