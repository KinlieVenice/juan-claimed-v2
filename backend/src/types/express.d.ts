import { DimUser } from "../generated/prisma/client.js";

declare global {
  namespace Express {
    interface Request {
      user?: DimUser & {
        scope?: any; // Adjust based on your prisma model
        group?: any;
      };
    }
  }
}
