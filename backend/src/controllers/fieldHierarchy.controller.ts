import type { Request, Response } from "express";
import * as fieldHierarchyService from "../services/fieldHierarchy.service.js";
import type {
  GetHierarchyRequest,
  CreateHierarchyRequest,
  CreateHierarchyLevelsRequest,
  EditHierarchyLevelsRequest,
  CreateHierarchyNodesRequest,
  EditHierarchyNodesRequest,
} from "../requests/fieldHierarchy.request.js";
import type { CreateHierarchyInput, HierarchyNodeInput, HierarchyNodeUpdateInput } from "../services/fieldHierarchy.service.js";

// GET ALL HIERARCHIES (for a "reuse an existing hierarchy" picker)
export const getAllHierarchies = async (_req: Request, res: Response) => {
  try {
    const hierarchies = await fieldHierarchyService.fetchAllHierarchies();

    return res.status(200).json({
      success: true,
      message: "Hierarchies loaded successfully.",
      error: null,
      errorCode: null,
      data: hierarchies
    });
  } catch (error) {
    console.error("[FieldHierarchyController] Error fetching hierarchies:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load hierarchies.",
      error: "An unexpected error occurred on the server.",
      errorCode: "SERVER_ERROR",
      data: []
    });
  }
};

// GET HIERARCHY BY ID (with levels + nodes)
export const getHierarchyById = async (req: GetHierarchyRequest, res: Response) => {
  try {
    const { id } = req.params;
    const hierarchy = await fieldHierarchyService.fetchHierarchyById(id);

    return res.status(200).json({
      success: true,
      message: "Hierarchy loaded successfully.",
      error: null,
      errorCode: null,
      data: hierarchy
    });
  } catch (error: any) {
    if (error.message === "HIERARCHY_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Could not retrieve hierarchy.",
        error: "The requested hierarchy does not exist.",
        errorCode: error.message,
        data: null
      });
    }

    console.error("[FieldHierarchyController] Error fetching hierarchy by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Could not retrieve hierarchy.",
      error: "An unexpected error occurred on the server.",
      errorCode: "SERVER_ERROR",
      data: null
    });
  }
};

const mapHierarchyError = (res: Response, error: any, message: string) => {
  if (error.message === "HIERARCHY_NOT_FOUND") {
    return res.status(404).json({ success: false, message, error: "The referenced hierarchy does not exist.", errorCode: error.message, data: null });
  }

  if (error.message === "DUPLICATE_HIERARCHY") {
    return res.status(409).json({ success: false, message, error: "A hierarchy with this name already exists.", errorCode: error.message, data: null });
  }

  if (error.message === "DUPLICATE_HIERARCHY_LEVEL") {
    return res.status(409).json({ success: false, message, error: "This level number already exists in this hierarchy.", errorCode: error.message, data: null });
  }

  if (error.message === "HIERARCHY_LEVEL_NOT_FOUND") {
    return res.status(404).json({ success: false, message, error: "One of the levels you are trying to modify does not exist.", errorCode: error.message, data: null });
  }

  if (error.message === "DUPLICATE_HIERARCHY_NODE") {
    return res.status(409).json({ success: false, message, error: "A node with this name already exists in this hierarchy.", errorCode: error.message, data: null });
  }

  if (error.message === "HIERARCHY_NODE_NOT_FOUND") {
    return res.status(404).json({ success: false, message, error: "One of the nodes you are trying to modify does not exist.", errorCode: error.message, data: null });
  }

  if (error.message === "PARENT_NODE_NOT_FOUND") {
    return res.status(400).json({ success: false, message, error: "The referenced parent node does not exist in this hierarchy.", errorCode: error.message, data: null });
  }

  return null;
};

// CREATE HIERARCHY (bulk: hierarchy + levels + nodes in one call)
export const createHierarchy = async (req: CreateHierarchyRequest, res: Response) => {
  try {
    const hierarchy = await fieldHierarchyService.createHierarchy(req.body as unknown as CreateHierarchyInput);

    return res.status(201).json({
      success: true,
      message: "Hierarchy created successfully.",
      error: null,
      errorCode: null,
      data: hierarchy
    });
  } catch (error: any) {
    const mapped = mapHierarchyError(res, error, "Could not create hierarchy.");
    if (mapped) return mapped;

    console.error("[FieldHierarchyController] Error creating hierarchy:", error);
    return res.status(500).json({
      success: false,
      message: "Could not create hierarchy.",
      error: "An unexpected error occurred on the server.",
      errorCode: "SERVER_ERROR",
      data: null
    });
  }
};

// CREATE HIERARCHY LEVELS (bulk, granular — given an existing hierarchy's id)
export const createHierarchyLevels = async (req: CreateHierarchyLevelsRequest, res: Response) => {
  try {
    const { id } = req.params;
    const levels = await fieldHierarchyService.createHierarchyLevels(id, req.body.levels);

    return res.status(201).json({
      success: true,
      message: "Hierarchy levels created successfully.",
      error: null,
      errorCode: null,
      data: levels
    });
  } catch (error: any) {
    const mapped = mapHierarchyError(res, error, "Could not create hierarchy levels.");
    if (mapped) return mapped;

    console.error("[FieldHierarchyController] Error creating hierarchy levels:", error);
    return res.status(500).json({
      success: false,
      message: "Could not create hierarchy levels.",
      error: "An unexpected error occurred on the server.",
      errorCode: "SERVER_ERROR",
      data: null
    });
  }
};

// EDIT HIERARCHY LEVELS (bulk — each entry must include its own id)
export const editHierarchyLevels = async (req: EditHierarchyLevelsRequest, res: Response) => {
  try {
    const { id } = req.params;
    const levels = await fieldHierarchyService.editHierarchyLevels(id, req.body.levels);

    return res.status(200).json({
      success: true,
      message: "Hierarchy levels updated successfully.",
      error: null,
      errorCode: null,
      data: levels
    });
  } catch (error: any) {
    const mapped = mapHierarchyError(res, error, "Could not update hierarchy levels.");
    if (mapped) return mapped;

    console.error("[FieldHierarchyController] Error updating hierarchy levels:", error);
    return res.status(500).json({
      success: false,
      message: "Could not update hierarchy levels.",
      error: "An unexpected error occurred on the server.",
      errorCode: "SERVER_ERROR",
      data: null
    });
  }
};

// CREATE HIERARCHY NODES (bulk — each entry may be a nested tree via children)
export const createHierarchyNodes = async (req: CreateHierarchyNodesRequest, res: Response) => {
  try {
    const { id } = req.params;
    const nodes = await fieldHierarchyService.createHierarchyNodes(id, req.body.nodes as HierarchyNodeInput[]);

    return res.status(201).json({
      success: true,
      message: "Hierarchy nodes created successfully.",
      error: null,
      errorCode: null,
      data: nodes
    });
  } catch (error: any) {
    const mapped = mapHierarchyError(res, error, "Could not create hierarchy nodes.");
    if (mapped) return mapped;

    console.error("[FieldHierarchyController] Error creating hierarchy nodes:", error);
    return res.status(500).json({
      success: false,
      message: "Could not create hierarchy nodes.",
      error: "An unexpected error occurred on the server.",
      errorCode: "SERVER_ERROR",
      data: null
    });
  }
};

// EDIT HIERARCHY NODES (bulk — each entry must include its own id)
export const editHierarchyNodes = async (req: EditHierarchyNodesRequest, res: Response) => {
  try {
    const { id } = req.params;
    const nodes = await fieldHierarchyService.editHierarchyNodes(id, req.body.nodes as HierarchyNodeUpdateInput[]);

    return res.status(200).json({
      success: true,
      message: "Hierarchy nodes updated successfully.",
      error: null,
      errorCode: null,
      data: nodes
    });
  } catch (error: any) {
    const mapped = mapHierarchyError(res, error, "Could not update hierarchy nodes.");
    if (mapped) return mapped;

    console.error("[FieldHierarchyController] Error updating hierarchy nodes:", error);
    return res.status(500).json({
      success: false,
      message: "Could not update hierarchy nodes.",
      error: "An unexpected error occurred on the server.",
      errorCode: "SERVER_ERROR",
      data: null
    });
  }
};
