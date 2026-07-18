import { Router } from "express";
import { getAllFields, createField, updateField, deleteField } from "../controllers/field.controller.js";

export const fieldRouter = Router();

fieldRouter.get("/", getAllFields);
fieldRouter.post("/", createField);
fieldRouter.put("/", updateField);
fieldRouter.delete("/", deleteField); 

