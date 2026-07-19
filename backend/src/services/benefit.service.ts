import { prisma } from "../utils/prisma.js";
import { getPsgcLocation } from "./psgc.service.js";

/**
 * Helper to determine the DimScope value based on location properties.
 * We prioritize checking sub-codes to define the administrative level.
 */
const getScopeValueForLocation = (location: any) => {
  if (location.barangayCode) return "BARANGAYS";
  if (location.cityCode || location.municipalityCode)
    return "CITIES-MUNICIPALITIES";
  if (location.districtCode) return "DISTRICTS";
  if (location.provinceCode) return "PROVINCES";
  return "REGIONS"; // Fallback
};

export const createBenefit = async (data: any, user: any) => {
  // 1. Setup: Get all scopes from DB for dynamic mapping
  const allScopes = await prisma.dimScope.findMany();
  const scopeMap = new Map(allScopes.map((s) => [s.value, s.id]));

  // 2. Validate Inputs
  const incomingCodes: string[] = data.psgcCodes || [];
  if (incomingCodes.length === 0) {
    throw new Error("INVALID_INPUT: At least one psgcCodes array is required.");
  }

  if (user.scope?.value === "NATIONAL" && (data.groupIds || []).length === 0) {
    throw new Error("INVALID_INPUT: National users must assign at least one group.");
  }

  const psgcPayloads = [];
  const locationNameMap = new Map<string, string>();

  // 3. Loop through codes: Validate, Authorize, and Prepare Payloads
  for (const code of incomingCodes) {
    const location = await getPsgcLocation(code);
    if (!location)
      throw new Error(`INVALID_PSGC_CODE: Location ${code} not found.`);

    // Store the location name for the enriched response
    locationNameMap.set(code, location.name);

    // Determine the correct target Scope ID for THIS specific location
    const scopeValue = getScopeValueForLocation(location);
    const targetScopeId = scopeMap.get(scopeValue);

    if (!targetScopeId)
      throw new Error(`SCOPE_NOT_FOUND: No scope defined for ${scopeValue}`);

    // Authorization Logic (Existing Hierarchy Check)
    let isAuthorized = user.scope?.value === "NATIONAL";

    if (!isAuthorized) {
      switch (user.scope?.value) {
        case "REGIONS":
          isAuthorized =
            location.regionCode === user.psgcCode ||
            location.code === user.psgcCode;
          break;
        case "PROVINCES":
          isAuthorized =
            location.provinceCode === user.psgcCode ||
            location.code === user.psgcCode;
          break;
        case "DISTRICTS":
          isAuthorized =
            location.districtCode === user.psgcCode ||
            location.code === user.psgcCode;
          break;
        case "CITIES-MUNICIPALITIES":
          isAuthorized =
            location.code === user.psgcCode ||
            location.cityCode === user.psgcCode ||
            location.municipalityCode === user.psgcCode;
          break;
        case "BARANGAYS":
          isAuthorized = location.code === user.psgcCode;
          break;
        default:
          throw new Error(
            "UNAUTHORIZED_SCOPE: User scope configuration invalid.",
          );
      }
    }

    if (!isAuthorized)
      throw new Error(
        `FORBIDDEN: You do not have permission for location ${code}.`,
      );

    // Prepare payload for DimBenefitPsgcCode
    psgcPayloads.push({
      psgcCode: code,
      scopeId: targetScopeId, // The actual level of the location
      createdById: user.id,
    });
  }

  // 4. Create the Benefit and all relations in one transaction
  const newBenefit = await prisma.fctBenefit.create({
    data: {
      name: data.name,
      englishDescription: data.englishDescription,
      tagalogDescription: data.tagalogDescription,
      scopeId: user.scopeId, // The "owner" scope of the benefit itself
      createdById: user.id,

      benefitPsgcCodes: { create: psgcPayloads },

      benefitGroups: {
        create: (data.groupIds || []).map((gId: string) => ({
          groupId: gId,
          createdById: user.id,
        })),
      },
    },
    include: {
      benefitPsgcCodes: { include: { scope: true } },
      benefitGroups: { include: { group: true } },
    },
  });

  // 5. Enrich the response with location names
  return {
    ...newBenefit,
    benefitPsgcCodes: newBenefit.benefitPsgcCodes.map((pc) => ({
      ...pc,
      locationName: locationNameMap.get(pc.psgcCode), // Injecting name for readability
    })),
  };
};
