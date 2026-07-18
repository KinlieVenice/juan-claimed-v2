import { Router } from "express";
import { getField, createField, updateField, deleteField } from "../controllers/field.controller.js";

export const fieldRouter = Router();

fieldRouter.get("/", getField);
fieldRouter.post("/", createField);
fieldRouter.put("/", updateField);
fieldRouter.delete("/", deleteField); 

