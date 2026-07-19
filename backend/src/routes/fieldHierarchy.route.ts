import { Router } from "express";
import {
  getAllHierarchies,
  getHierarchyById,
  createHierarchy,
  createHierarchyLevels,
  editHierarchyLevels,
  createHierarchyNodes,
  editHierarchyNodes,
} from "../controllers/fieldHierarchy.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  createHierarchySchema,
  createHierarchyLevelsSchema,
  editHierarchyLevelsSchema,
  createHierarchyNodesSchema,
  editHierarchyNodesSchema,
} from "../requests/fieldHierarchy.request.js";

export const fieldHierarchyRouter = Router();

fieldHierarchyRouter.get("/", getAllHierarchies);
fieldHierarchyRouter.get("/:id", getHierarchyById);
fieldHierarchyRouter.post("/", validateBody(createHierarchySchema), createHierarchy);

fieldHierarchyRouter.post("/:id/levels", validateBody(createHierarchyLevelsSchema), createHierarchyLevels);
fieldHierarchyRouter.put("/:id/levels", validateBody(editHierarchyLevelsSchema), editHierarchyLevels);

fieldHierarchyRouter.post("/:id/nodes", validateBody(createHierarchyNodesSchema), createHierarchyNodes);
fieldHierarchyRouter.put("/:id/nodes", validateBody(editHierarchyNodesSchema), editHierarchyNodes);
