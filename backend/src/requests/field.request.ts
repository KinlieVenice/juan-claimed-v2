import type { Request } from "express";

// Define what fields you expect from the user
export interface CreateFieldDto {
    key: string;
    englishName: string;
    tagalogName: string;
    description: string;
    classification: "GLOBAL" | "FOLLOW_UP";
    default: boolean;
    required: boolean;
    sortOrder: number;
    configJson: string;
    fieldInputTypeId: string;
    parentFieldId: string | null;
    fieldHierarchyId: string | null;
}

// Attach that structure directly to the Express Request
export type CreateFieldRequest = Request<{}, {}, CreateFieldDto>;