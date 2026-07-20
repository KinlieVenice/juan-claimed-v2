import { Router } from "express";
import { getAllFields, getFieldById, createField, updateField, deleteField, reorderFields } from "../controllers/field.controller.js";
import { getFieldOptionsByFieldId, createFieldOptions, editFieldOptions, deleteFieldOption } from "../controllers/fieldOptions.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { compositeFieldSchema, reorderFieldsSchema } from "../requests/field.request.js";
import { createFieldOptionsSchema, editFieldOptionsSchema } from "../requests/fieldOption.request.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
  requireFieldClassificationRole,
  requireFieldEditClassificationRole,
  requireClassificationRoleByFieldIdParam,
  requireReorderClassificationRole,
} from "../middlewares/requireFieldClassificationRole.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const fieldRouter = Router();

fieldRouter.get("/", mockAuth, requireRole(PERMISSIONS.VIEW_FIELDS), getAllFields);

// Mounted before "/:id" — PATCH /reorder is a distinct method+path, but kept above the
// param routes as a defensive convention matching this codebase's existing route ordering.
fieldRouter.patch(
  "/reorder",
  mockAuth,
  requireRole(PERMISSIONS.CREATE_FIELDS),
  validateBody(reorderFieldsSchema),
  requireReorderClassificationRole,
  reorderFields,
);

fieldRouter.get("/:id", mockAuth, requireRole(PERMISSIONS.VIEW_FIELDS), getFieldById);

fieldRouter.post("/", mockAuth, requireRole(PERMISSIONS.CREATE_FIELDS), validateBody(compositeFieldSchema), requireFieldClassificationRole, createField);
fieldRouter.put("/:id", mockAuth, requireRole(PERMISSIONS.EDIT_FIELDS), validateBody(compositeFieldSchema), requireFieldEditClassificationRole, updateField);
fieldRouter.delete("/:id", mockAuth, requireRole(PERMISSIONS.DELETE_FIELDS), deleteField);

fieldRouter.get("/:fieldId/options", mockAuth, requireRole(PERMISSIONS.VIEW_FIELDS), getFieldOptionsByFieldId);
fieldRouter.post(
  "/:fieldId/options",
  mockAuth,
  requireRole(PERMISSIONS.CREATE_FIELDS),
  requireClassificationRoleByFieldIdParam,
  validateBody(createFieldOptionsSchema),
  createFieldOptions,
);
fieldRouter.put(
  "/:fieldId/options",
  mockAuth,
  requireRole(PERMISSIONS.EDIT_FIELDS),
  requireClassificationRoleByFieldIdParam,
  validateBody(editFieldOptionsSchema),
  editFieldOptions,
);
fieldRouter.delete(
  "/:fieldId/options/:optionId",
  mockAuth,
  requireRole(PERMISSIONS.EDIT_FIELDS),
  requireClassificationRoleByFieldIdParam,
  deleteFieldOption,
);
