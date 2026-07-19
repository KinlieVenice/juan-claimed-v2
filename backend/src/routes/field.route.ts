import { Router } from "express";
import { getAllFields, getFieldById, createField, updateField, deleteField } from "../controllers/field.controller.js";
import { getFieldOptionsByFieldId, createFieldOptions, editFieldOptions } from "../controllers/fieldOptions.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { compositeFieldSchema } from "../requests/field.request.js";
import { createFieldOptionsSchema, editFieldOptionsSchema } from "../requests/fieldOption.request.js";

export const fieldRouter = Router();

fieldRouter.get("/", getAllFields);
fieldRouter.get("/:id", getFieldById);
fieldRouter.post("/", validateBody(compositeFieldSchema), createField);
fieldRouter.put("/:id", validateBody(compositeFieldSchema), updateField);
fieldRouter.delete("/:id", deleteField);

fieldRouter.get("/:fieldId/options", getFieldOptionsByFieldId);
fieldRouter.post("/:fieldId/options", validateBody(createFieldOptionsSchema), createFieldOptions);
fieldRouter.put("/:fieldId/options", validateBody(editFieldOptionsSchema), editFieldOptions);
