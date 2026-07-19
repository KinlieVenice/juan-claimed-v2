import { Router } from "express";
import { makeAttachmentControllers } from "../controllers/benefitAttachment.controller.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { benefitAttachmentSchema } from "../requests/benefitAttachment.request.js";
import { PERMISSIONS } from "../constants/permissions.js";
import type { AttachmentParentType } from "../constants/attachmentEntityTypes.js";

/**
 * Mounted inside benefitRequirement.routes.ts and benefitUtilization.routes.ts
 * at "/:id/attachments" (mergeParams gives access to :benefitId and the
 * parent's own :id) — one implementation shared by both parent types.
 */
export const createAttachmentRouter = (parentType: AttachmentParentType) => {
  const router = Router({ mergeParams: true });
  const controllers = makeAttachmentControllers(parentType);

  router.get("/", mockAuth, requireRole(PERMISSIONS.PARTICIPATE), controllers.list);

  router.post(
    "/",
    mockAuth,
    requireRole(PERMISSIONS.CREATE_BENEFIT_ATTACHMENTS),
    validateBody(benefitAttachmentSchema),
    controllers.create,
  );

  router.patch(
    "/:attachmentId",
    mockAuth,
    requireRole(PERMISSIONS.EDIT_BENEFIT_ATTACHMENTS),
    validateBody(benefitAttachmentSchema),
    controllers.edit,
  );

  router.delete(
    "/:attachmentId",
    mockAuth,
    requireRole(PERMISSIONS.DELETE_BENEFIT_ATTACHMENTS),
    controllers.remove,
  );

  return router;
};
