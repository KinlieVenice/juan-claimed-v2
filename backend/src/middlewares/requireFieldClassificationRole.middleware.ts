import type { Request, Response, NextFunction } from "express";
import { UserRole } from "../generated/prisma/client.js";
import { prisma } from "../utils/prisma.js";

const forbidden = (res: Response, error = "Agents may only create or edit Follow-Up fields.") =>
  res.status(403).json({
    success: false,
    message: "You do not have permission to perform this action.",
    error,
    errorCode: "FORBIDDEN",
    data: null,
  });

// Global fields are eGovPH-synced/locked and shipped once at seed time (profileFieldSeeder.ts)
// — nobody, INCLUDING Superadmin, may author a new one from here on. Every create must be
// Follow-Up; requireRole alone can't express this (it's data-dependent, not just
// role-dependent), so this runs after mockAuth + validateBody(compositeFieldSchema), reading
// the already-validated body.
export const requireFieldClassificationRole = (req: Request, res: Response, next: NextFunction) => {
  const classification = req.body?.field?.classification;
  if (classification === "FOLLOW_UP") return next();

  return forbidden(res, "Only Follow-Up fields may be created — Global fields are eGovPH-synced and can no longer be authored.");
};

// Editing an EXISTING field can never change its classification either direction — a
// Follow-Up can't be promoted to Global (same "nobody may author a new Global field" rule
// as create, just via a different door) and an existing Global field can't be demoted (it's
// still eGovPH's own field, just possibly having its non-locked properties tweaked). An
// Agent is additionally blocked from touching a Global field at all, same as before.
export const requireFieldEditClassificationRole = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  const role = req.user!.role;

  const field = await prisma.dimField.findUnique({ where: { id: req.params.id }, select: { classification: true } });
  if (!field) {
    return res.status(404).json({ success: false, message: "Field not found.", error: "The field you are trying to modify does not exist.", errorCode: "FIELD_NOT_FOUND", data: null });
  }

  if (role === UserRole.AGENT && field.classification !== "FOLLOW_UP") return forbidden(res);

  const submittedClassification = req.body?.field?.classification;
  if (submittedClassification !== field.classification) {
    return forbidden(res, "A field's classification can't be changed after creation.");
  }

  return next();
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
