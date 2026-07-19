import { prisma } from "../utils/prisma.js";
import { getPsgcLocation } from "./psgc.service.js";

/**
 * Determines the DimScope value for a PSGC location based on its most
 * specific populated code — checked from most to least specific.
 */
export const getScopeValueForLocation = (location: any): string => {
  if (location.barangayCode) return "BARANGAYS";
  if (location.cityCode || location.municipalityCode)
    return "CITIES-MUNICIPALITIES";
  if (location.districtCode) return "DISTRICTS";
  if (location.provinceCode) return "PROVINCES";
  return "REGIONS";
};

/**
 * Hierarchical boundary check: does this user's own scope/psgcCode
 * authorize acting on the given location? NATIONAL always passes.
 */
export const isUserAuthorizedForLocation = (user: any, location: any): boolean => {
  if (user.scope?.value === "NATIONAL") return true;

  switch (user.scope?.value) {
    case "REGIONS":
      return (
        location.regionCode === user.psgcCode || location.code === user.psgcCode
      );
    case "PROVINCES":
      return (
        location.provinceCode === user.psgcCode ||
        location.code === user.psgcCode
      );
    case "DISTRICTS":
      return (
        location.districtCode === user.psgcCode ||
        location.code === user.psgcCode
      );
    case "CITIES-MUNICIPALITIES":
      return (
        location.code === user.psgcCode ||
        location.cityCode === user.psgcCode ||
        location.municipalityCode === user.psgcCode
      );
    case "BARANGAYS":
      return location.code === user.psgcCode;
    default:
      throw new Error("UNAUTHORIZED_SCOPE: User scope configuration invalid.");
  }
};

export const getScopeIdMap = async (): Promise<Map<string, string>> => {
  const allScopes = await prisma.dimScope.findMany();
  return new Map(allScopes.map((s) => [s.value, s.id]));
};

export type ResolvedPsgcCode = {
  psgcCode: string;
  scopeId: string;
  locationName: string;
};

/**
 * Looks up, authorizes, and resolves the target scopeId for a single PSGC
 * code against the acting user's own scope/jurisdiction. Throws
 * INVALID_PSGC_CODE / SCOPE_NOT_FOUND / FORBIDDEN / UNAUTHORIZED_SCOPE on
 * failure — callers should surface `error.message` as-is (controllers
 * already route by these prefixes).
 */
export const resolvePsgcCodeForUser = async (
  code: string,
  user: any,
  scopeMap: Map<string, string>,
): Promise<ResolvedPsgcCode> => {
  const location = await getPsgcLocation(code);
  if (!location) {
    throw new Error(`INVALID_PSGC_CODE: Location ${code} not found.`);
  }

  const scopeValue = getScopeValueForLocation(location);
  const scopeId = scopeMap.get(scopeValue);
  if (!scopeId) {
    throw new Error(`SCOPE_NOT_FOUND: No scope defined for ${scopeValue}`);
  }

  if (!isUserAuthorizedForLocation(user, location)) {
    throw new Error(`FORBIDDEN: You do not have permission for location ${code}.`);
  }

  return { psgcCode: code, scopeId, locationName: location.name };
};

/**
 * Resolves and authorizes a full list of PSGC codes for a user in one pass.
 * Used by create/edit benefit flows that accept a psgcCodes[] array.
 */
export const resolvePsgcCodesForUser = async (
  codes: string[],
  user: any,
): Promise<ResolvedPsgcCode[]> => {
  const scopeMap = await getScopeIdMap();
  const resolved: ResolvedPsgcCode[] = [];
  for (const code of codes) {
    resolved.push(await resolvePsgcCodeForUser(code, user, scopeMap));
  }
  return resolved;
};

/**
 * Verifies the acting user is still authorized over a benefit's *current*
 * locations — used before editing/deleting an existing benefit, since the
 * user's scope may not cover everything the benefit was originally assigned.
 * Throws FORBIDDEN / INVALID_PSGC_CODE / SCOPE_NOT_FOUND on failure.
 */
export const assertUserAuthorizedForBenefit = async (
  benefit: { isNationwide: boolean; benefitPsgcCodes: { psgcCode: string }[] },
  user: any,
  scopeMap: Map<string, string>,
): Promise<void> => {
  if (benefit.isNationwide) {
    if (user.scope?.value !== "NATIONAL") {
      throw new Error(
        "FORBIDDEN: Only national users may modify nationwide benefits.",
      );
    }
    return;
  }

  for (const { psgcCode } of benefit.benefitPsgcCodes) {
    await resolvePsgcCodeForUser(psgcCode, user, scopeMap);
  }
};
