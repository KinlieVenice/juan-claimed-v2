// Resolves the acting agent's own single jurisdiction (scope + psgcCode, see DimUser in
// schema.prisma) into the locked ancestor chain HierarchyMultiLevelSelector's `lockedPrefix`
// prop expects — so a local-scope agent's benefit-scope picker starts under their own
// jurisdiction instead of the whole country. Mirrors backend/src/utils/psgc.util.ts's
// derivePsgcAncestorPath digit-slicing convention client-side to get ancestor CODES for
// free (no network round-trip needed for that part), then resolves each level's NAME via
// the same single-record PSGC lookups ConditionValueInput.tsx's fetchers are built on.
import type { Role } from "@/lib/auth";
import {
  getRegions,
  getProvinceByCode,
  getDistrictByCode,
  getCityMunicipalityByCode,
  getBarangayByCode,
  type PsgcAdminMode,
} from "@/services/psgc.service";
import type { Scope } from "@/services/scopes.service";

export interface JurisdictionPrefixEntry {
  value: string;
  label: string;
}

const regionCodeOf = (code: string) => `${code.slice(0, 2)}0000000`;
const provinceCodeOf = (code: string) => `${code.slice(0, 4)}00000`;
const cityCodeOf = (code: string) => `${code.slice(0, 6)}000`;

// SUPERADMIN and NATIONAL-scope agents get an empty prefix (unlocked, starts at root) —
// matches backend/src/services/benefitLocation.service.ts's isUserAuthorizedForLocation's
// "NATIONAL/SUPERADMIN always pass" rule. Any lookup failure along the way (e.g. an
// unexpected code shape) just returns whatever prefix was resolved so far rather than
// throwing — a shorter-than-expected lock is safer than breaking the whole picker.
export async function resolveAgentJurisdictionPrefix(
  role: Role,
  scopeValue: Scope["value"] | undefined,
  psgcCode: string | null | undefined,
): Promise<JurisdictionPrefixEntry[]> {
  if (role === "SUPERADMIN" || !scopeValue || scopeValue === "SUPERADMIN" || scopeValue === "NATIONAL" || !psgcCode) {
    return [];
  }

  const mode: PsgcAdminMode = scopeValue === "DISTRICTS" ? "district" : "province";
  const prefix: JurisdictionPrefixEntry[] = [];

  try {
    const regionCode = regionCodeOf(psgcCode);
    const region = (await getRegions()).find((r) => r.code === regionCode);
    if (!region) return prefix;
    prefix.push({ value: region.code, label: region.name });
    if (scopeValue === "REGIONS") return prefix;

    const provinceCode = provinceCodeOf(psgcCode);
    const subdivision = mode === "district" ? await getDistrictByCode(provinceCode) : await getProvinceByCode(provinceCode);
    prefix.push({ value: subdivision.code, label: subdivision.name });
    if (scopeValue === "PROVINCES" || scopeValue === "DISTRICTS") return prefix;

    const cityCode = cityCodeOf(psgcCode);
    const city = await getCityMunicipalityByCode(cityCode);
    prefix.push({ value: city.code, label: city.name });
    if (scopeValue === "CITIES-MUNICIPALITIES") return prefix;

    // BARANGAYS scope: the agent's own code IS the barangay — locking the whole chain
    // leaves nothing interactive below it, correctly reflecting that they can only ever
    // scope a benefit to that one barangay.
    const barangay = await getBarangayByCode(psgcCode);
    prefix.push({ value: barangay.code, label: barangay.name });
    return prefix;
  } catch {
    return prefix;
  }
}
