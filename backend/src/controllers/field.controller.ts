import type { Request, Response } from "express";
import { fetchAllFields } from "../services/field.service.js";

export const getAllFields = async (_req: Request, res: Response) => {
  try {
    const fields = await fetchAllFields();
    res.status(200).json(fields);
  } catch (error) {
    console.error("Error fetching fields:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createField = (_req: Request, res: Response) => {
  res.json({ message: "Field created successfully" });
};

export const updateField = (_req: Request, res: Response) => {
  res.json({ message: "Field updated successfully" });
};

export const deleteField = (_req: Request, res: Response) => {
  res.json({ message: "Field deleted successfully" });
};