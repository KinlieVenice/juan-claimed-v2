import type { Request, Response } from "express";
import * as fieldService from "../services/field.service.js";
import type { CreateFieldRequest, UpdateFieldRequest } from "../requests/field.request.js";

// GET ALL FIELDS
export const getAllFields = async (_req: Request, res: Response) => {
  try {
    const fields = await fieldService.fetchAllFields();
    
    return res.status(200).json({
      success: true,
      message: "Fields loaded successfully.",
      error: null,
      errorCode: null,
      data: fields
    });
  } catch (error) {
    console.error("[FieldController] Error fetching fields:", error);
    return res.status(500).json({ 
      success: false,
      message: "Unable to load fields.",
      error: "An unexpected error occurred on the server.",
      errorCode: "SERVER_ERROR",
      data: []
    });
  }
};

// GET FIELD BY ID
export const getFieldById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const field = await fieldService.fetchFieldById(id);

    return res.status(200).json({
      success: true,
      message: "Field details loaded successfully.",
      error: null,
      errorCode: null,
      data: field
    });
  } catch (error: any) {
    if (error.message === "FIELD_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Could not retrieve field.",
        error: "The requested field does not exist.",
        errorCode: error.message,
        data: null
      });
    }

    console.error("[FieldController] Error fetching field by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Could not retrieve field.",
      error: "An unexpected error occurred on the server.",
      errorCode: "SERVER_ERROR",
      data: null
    });
  }
};

// CREATE FIELD
export const createField = async (req: CreateFieldRequest, res: Response) => {
  try {
    const newField = await fieldService.addField(req.body);

    return res.status(201).json({
      success: true,
      message: "Field created successfully.",
      error: null,
      errorCode: null,
      data: newField
    });
  } catch (error: any) {
    if (error.message === "DUPLICATE_KEY") {
      return res.status(409).json({
        success: false,
        message: "Could not create field.",
        error: "A field with this identifier key already exists.",
        errorCode: error.message,
        data: null
      });
    }

    if (error.message === "INVALID_FOREIGN_KEY") {
      return res.status(400).json({
        success: false,
        message: "Could not create field.",
        error: "The referenced parent field, hierarchy, or input type does not exist.",
        errorCode: error.message,
        data: null
      });
    }

    console.error("[FieldController] Error creating field:", error);
    return res.status(500).json({ 
      success: false,
      message: "Could not create field.",
      error: "An unexpected error occurred on the server.",
      errorCode: "SERVER_ERROR",
      data: null
    });
  }
};

// UPDATE FIELD
export const updateField = async (req: UpdateFieldRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedField = await fieldService.editField(id, updateData);
    
    return res.status(200).json({ 
      success: true,
      message: "Field updated successfully.",
      error: null,
      errorCode: null,
      data: updatedField
    });
  } catch (error: any) {
    if (error.message === "FIELD_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Could not update field.",
        error: "The field you are trying to modify does not exist.",
        errorCode: error.message,
        data: null
      });
    }

    if (error.message === "INVALID_FOREIGN_KEY") {
      return res.status(400).json({
        success: false,
        message: "Could not update field.",
        error: "The referenced parent field, hierarchy, or input type does not exist.",
        errorCode: error.message,
        data: null
      });
    }

    console.error("[FieldController] Error updating field:", error);
    return res.status(500).json({ 
      success: false,
      message: "Could not update field.",
      error: "An unexpected error occurred on the server.",
      errorCode: "SERVER_ERROR",
      data: null
    });
  }
};

// DELETE FIELD
export const deleteField = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    
    await fieldService.removeField(id);

    return res.status(200).json({ 
      success: true,
      message: "Field deleted successfully.",
      error: null,
      errorCode: null,
      data: { id }
    });
  } catch (error: any) {
    if (error.message === "FIELD_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Could not delete field.",
        error: "The field you are trying to remove does not exist.",
        errorCode: error.message,
        data: null
      });
    }

    console.error("[FieldController] Error deleting field:", error);
    return res.status(500).json({
      success: false,
      message: "Could not delete field.",
      error: "An unexpected error occurred on the server.",
      errorCode: "SERVER_ERROR",
      data: null
    });
  }
};