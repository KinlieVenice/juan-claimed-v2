import type { Request, Response } from "express";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { ALLOWED_ATTACHMENT_FILE_TYPES } from "../requests/benefitAttachment.request.js";
import { sendUnauthorized } from "../utils/apiResponse.util.js";

/**
 * Issues a short-lived client upload token for @vercel/blob's client-direct
 * upload flow. The frontend uploads bytes straight to Blob using this token
 * and gets back a URL, then calls the existing attachment create endpoints
 * with that URL as filePath — no file bytes ever touch this server.
 */
export const createAttachmentUploadToken = async (req: Request, res: Response) => {
  if (!req.user) return sendUnauthorized(res);

  const body = req.body as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      // BLOB_READ_WRITE_TOKEN is Vercel's own standard name — auto-injected into the
      // project's env vars the moment a Blob store is linked to it, not something to rename.
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      onBeforeGenerateToken: async (_pathname, _clientPayload, _multipart) => ({
        allowedContentTypes: [...ALLOWED_ATTACHMENT_FILE_TYPES],
        maximumSizeInBytes: 25 * 1024 * 1024, // 25MB
        addRandomSuffix: true,
      }),
    });

    return res.status(200).json(jsonResponse);
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: "Could not issue an upload token.",
      error: error.message || "Invalid upload request.",
      errorCode: "BLOB_TOKEN_ERROR",
      data: null,
    });
  }
};
