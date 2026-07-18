import type { Request, Response } from "express";
import { getHealthStatus } from "../services/health.service.js";

export const getField = (_req: Request, res: Response) => {
  res.json({ message: "Field retrieved successfully" });
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