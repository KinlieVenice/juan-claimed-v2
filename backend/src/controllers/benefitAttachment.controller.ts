import type { Request, Response } from "express";
import {
  listAttachments,
  createAttachment,
  editAttachment,
  deleteAttachment,
} from "../services/benefitAttachment.service.js";
import { handleApiError } from "../utils/errorMapping.js";

// fileSize is BigInt in the schema — JSON.stringify throws on BigInt, so it
// must be stringified before every response.
const serializeAttachment = (attachment: any) => ({
  ...attachment,
  fileSize: attachment.fileSize?.toString(),
});

export const listBenefitAttachments = async (
  req: Request<{ benefitId: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const attachments = await listAttachments(req.params.benefitId, req.user);
    res.status(200).json({ success: true, data: attachments.map(serializeAttachment) });
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const createBenefitAttachment = async (
  req: Request<{ benefitId: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const attachment = await createAttachment(req.params.benefitId, req.body, req.user);
    res.status(201).json({ success: true, data: serializeAttachment(attachment) });
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const editBenefitAttachment = async (
  req: Request<{ benefitId: string; id: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const attachment = await editAttachment(
      req.params.benefitId,
      req.params.id,
      req.body,
      req.user,
    );
    res.status(200).json({ success: true, data: serializeAttachment(attachment) });
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const deleteBenefitAttachment = async (
  req: Request<{ benefitId: string; id: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const result = await deleteAttachment(req.params.benefitId, req.params.id, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    handleApiError(error, res);
  }
};
