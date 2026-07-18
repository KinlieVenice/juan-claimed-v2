import { Router } from "express";
import { getAllFields, getFieldById, createField, updateField, deleteField } from "../controllers/field.controller.js";

export const fieldRouter = Router();

fieldRouter.get("/", getAllFields);
fieldRouter.get("/:id", getFieldById);
fieldRouter.post("/", createField);
fieldRouter.put("/:id", updateField);
fieldRouter.delete("/:id", deleteField);

