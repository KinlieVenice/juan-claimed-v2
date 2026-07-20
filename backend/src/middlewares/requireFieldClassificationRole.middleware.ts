import type { Request, Response, NextFunction } from "express";
import { UserRole } from "../generated/prisma/client.js";
import { prisma } from "../utils/prisma.js";

const forbidden = (res: Response) =>
  res.status(403).json({
    success: false,
    message: "You do not have permission to perform this action.",
    error: "Agents may only create or edit Follow-Up fields.",
    errorCode: "FORBIDDEN",
    data: null,
  });

// Superadmin can author either classification; Agent only Follow-Up. requireRole alone
// can't express this (it's data-dependent, not just role-dependent), so this runs after
// mockAuth + validateBody(compositeFieldSchema), reading the already-validated body.
export const requireFieldClassificationRole = (req: Request, res: Response, next: NextFunction) => {
  const role = req.user!.role;
  if (role === UserRole.SUPERADMIN) return next();

  const classification = req.body?.field?.classification;
  if (role === UserRole.AGENT && classification === "FOLLOW_UP") return next();

  return forbidden(res);
};

// Same rule for editing an EXISTING field, but an Agent must be blocked both from
// editing a currently-Global field AND from reclassifying a Follow-Up field into
// Global (the request body carries the full desired classification, not a diff) — so
// this checks the field's CURRENT classification (DB lookup by :id) as well as the
// submitted one.
export const requireFieldEditClassificationRole = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  const role = req.user!.role;
  if (role === UserRole.SUPERADMIN) return next();

  if (role !== UserRole.AGENT) return forbidden(res);

  const field = await prisma.dimField.findUnique({ where: { id: req.params.id }, select: { classification: true } });
  if (!field) {
    return res.status(404).json({ success: false, message: "Field not found.", error: "The field you are trying to modify does not exist.", errorCode: "FIELD_NOT_FOUND", data: null });
  }

  const submittedClassification = req.body?.field?.classification;
  if (field.classification === "FOLLOW_UP" && submittedClassification === "FOLLOW_UP") return next();

  return forbidden(res);
};

// Same rule for the bulk reorder endpoint — body carries classification directly (not
// nested under `field`, unlike create/edit).
export const requireReorderClassificationRole = (req: Request, res: Response, next: NextFunction) => {
  const role = req.user!.role;
  if (role === UserRole.SUPERADMIN) return next();

  const classification = req.body?.classification;
  if (role === UserRole.AGENT && classification === "FOLLOW_UP") return next();

  return forbidden(res);
};

// Same rule, but for routes keyed by a :fieldId param instead of a body carrying its own
// classification (dynamic-rule-group tree endpoints, field-options endpoints) — looks up
// the target field's current classification.
export const requireClassificationRoleByFieldIdParam = async (req: Request<{ fieldId: string }>, res: Response, next: NextFunction) => {
  const role = req.user!.role;
  if (role === UserRole.SUPERADMIN) return next();

  if (role !== UserRole.AGENT) return forbidden(res);

  const field = await prisma.dimField.findUnique({ where: { id: req.params.fieldId }, select: { classification: true } });
  if (!field) {
    return res.status(404).json({ success: false, message: "Field not found.", error: "The referenced field does not exist.", errorCode: "FIELD_NOT_FOUND", data: null });
  }

  if (field.classification === "FOLLOW_UP") return next();

  return forbidden(res);
};
