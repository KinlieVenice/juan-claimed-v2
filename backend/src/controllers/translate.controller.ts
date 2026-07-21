import type { Response } from "express";
import { translateText } from "../services/egovApi.service.js";
import { handleApiError } from "../utils/errorMapping.util.js";
import { sendSuccess, sendUnauthorized } from "../utils/apiResponse.util.js";
import type { TranslateRequest } from "../requests/translate.request.js";

export const translate = async (req: TranslateRequest, res: Response) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const { prompt, sourceLang, targetLang } = req.body;
    const translation = await translateText(prompt, sourceLang, targetLang);

    return sendSuccess(res, 200, "Translated successfully.", translation);
  } catch (error: any) {
    handleApiError(error, res);
  }
};
