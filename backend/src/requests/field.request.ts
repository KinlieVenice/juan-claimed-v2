import type { Request } from "express";
import type { Prisma } from "../generated/prisma/client.js";

// Define what fields you expect from the user
export interface CreateUpdateFieldDto {
    key: string;
    englishName: string;
    tagalogName: string;
    description: string;
    classification: "GLOBAL" | "FOLLOW_UP";
    default: boolean;
    required: boolean;
    sortOrder: number;
    configJson: Prisma.InputJsonValue | null;
    fieldInputTypeId: string;
    parentFieldId: string | null;
    fieldHierarchyId: string | null;
}



// Attach that structure directly to the Express Request
// Request(ReqParams, ResBody, ReqBody, ReqQuery) = < {}, {}, {}, {} >

export type CreateUpdateFieldRequest = Request<{ id: string }, {}, CreateUpdateFieldDto>;

export type DeleteFieldRequest = Request<{ id: string }>;