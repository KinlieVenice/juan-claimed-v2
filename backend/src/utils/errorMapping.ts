import type { Response } from "express";

/**
 * Shared error-message-prefix -> HTTP status mapping used across benefit
 * and benefit-child (requirement/utilization/attachment) controllers.
 * Services throw `Error("PREFIX: message")` for control flow; this maps
 * the prefix to the right status code.
 */
export const handleApiError = (
  error: any,
  res: Response,
  duplicateMessage = "This record already exists.",
) => {
  if (error.code === "P2002") {
    return res.status(409).json({ success: false, message: duplicateMessage });
  }

  const message: string = error.message || "";
  if (message.endsWith("_NOT_FOUND") && !message.startsWith("SCOPE_NOT_FOUND")) {
    return res.status(404).json({ success: false, message });
  }
  if (message.startsWith("INVALID_INPUT") || message.startsWith("INVALID_PSGC_CODE")) {
    return res.status(400).json({ success: false, message });
  }
  if (message.startsWith("SCOPE_NOT_FOUND")) {
    return res.status(500).json({ success: false, message });
  }
  if (message.startsWith("FORBIDDEN") || message.startsWith("UNAUTHORIZED_SCOPE")) {
    return res.status(403).json({ success: false, message });
  }

  return res.status(500).json({ success: false, message: message || "Internal server error." });
};
