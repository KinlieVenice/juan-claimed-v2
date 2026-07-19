import type { Request, Response } from "express";
import * as fieldLookupService from "../services/fieldLookup.service.js";

// GET ALL FIELD INPUT TYPES
export const getAllFieldInputTypes = async (_req: Request, res: Response) => {
  try {
    const inputTypes = await fieldLookupService.fetchAllFieldInputTypes();

    return res.status(200).json({
      success: true,
      message: "Field input types loaded successfully.",
      error: null,
      errorCode: null,
      data: inputTypes
    });
  } catch (error) {
    console.error("[FieldLookupController] Error fetching field input types:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load field input types.",
      error: "An unexpected error occurred on the server.",
      errorCode: "SERVER_ERROR",
      data: []
    });
  }
};

// GET FIELD CONDITION OPERATORS — optionally filtered by ?fieldInputTypeId=
export const getFieldConditionOperators = async (req: Request<{}, {}, {}, { fieldInputTypeId?: string }>, res: Response) => {
  try {
    const { fieldInputTypeId } = req.query;
    const operators = await fieldLookupService.fetchFieldConditionOperators(fieldInputTypeId);

    return res.status(200).json({
      success: true,
      message: "Field condition operators loaded successfully.",
      error: null,
      errorCode: null,
      data: operators
    });
  } catch (error) {
    console.error("[FieldLookupController] Error fetching field condition operators:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load field condition operators.",
      error: "An unexpected error occurred on the server.",
      errorCode: "SERVER_ERROR",
      data: []
    });
  }
};
