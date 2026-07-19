import type { Request, Response } from "express";
import * as userService from "../services/user.service.js";
import type { AssignRoleRequest } from "../requests/user.request.js";

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await userService.fetchAllUsers();

    return res.status(200).json({
      success: true,
      message: "Users loaded successfully.",
      error: null,
      errorCode: null,
      data: users,
    });
  } catch (error) {
    console.error("[UserController] Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load users.",
      error: "An unexpected error occurred on the server.",
      errorCode: "SERVER_ERROR",
      data: [],
    });
  }
};

export const getUserById = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const user = await userService.fetchUserById(id);

    return res.status(200).json({
      success: true,
      message: "User details loaded successfully.",
      error: null,
      errorCode: null,
      data: user,
    });
  } catch (error: any) {
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Could not retrieve user.",
        error: "The requested user does not exist.",
        errorCode: error.message,
        data: null,
      });
    }

    console.error("[UserController] Error fetching user by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Could not retrieve user.",
      error: "An unexpected error occurred on the server.",
      errorCode: "SERVER_ERROR",
      data: null,
    });
  }
};

export const assignRoleAndScope = async (
  req: AssignRoleRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const updatedUser = await userService.assignUserRole(id, req.body);

    return res.status(200).json({
      success: true,
      message: "User role and assignments successfully updated.",
      error: null,
      errorCode: null,
      data: updatedUser,
    });
  } catch (error: any) {
    if (
      error.message === "USER_NOT_FOUND" ||
      error.message === "INVALID_SCOPE"
    ) {
      return res.status(404).json({
        success: false,
        message: "Could not assign role.",
        error: "The requested user or scope does not exist.",
        errorCode: error.message,
        data: null,
      });
    }

    // Handle Matrix Constraint Violations
    const constraintErrors = [
      "INVALID_SUPERADMIN_CONFIG",
      "AGENT_REQUIRES_SCOPE",
      "INVALID_NATIONAL_AGENT_CONFIG",
      "INVALID_LOCAL_AGENT_CONFIG",
      "INVALID_USER_CONFIG",
    ];

    if (constraintErrors.includes(error.message)) {
      return res.status(400).json({
        success: false,
        message: "Could not assign role.",
        error:
          "The provided role, scope, group, and PSGC configuration violates system constraints.",
        errorCode: error.message,
        data: null,
      });
    }

    console.error("[UserController] Error assigning user role:", error);
    return res.status(500).json({
      success: false,
      message: "Could not assign role.",
      error: "An unexpected error occurred on the server.",
      errorCode: "SERVER_ERROR",
      data: null,
    });
  }
};
