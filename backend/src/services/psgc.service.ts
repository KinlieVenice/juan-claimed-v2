import axios from "axios";

const PSGC_API = "https://psgc.gitlab.io/api";

// Maps each PSGC endpoint to the DimScope value it represents. The PSGC API
// never returns a self-referencing level field (e.g. a barangay has no
// "barangayCode" pointing to itself, only parent-pointer fields like
// municipalityCode/provinceCode) — so the endpoint that matched IS the
// level, and must be carried alongside the location, not re-derived from
// the location's own fields.
const ENDPOINT_SCOPE_MAP: Record<string, string> = {
  "/barangays": "BARANGAYS",
  "/cities-municipalities": "CITIES-MUNICIPALITIES",
  "/provinces": "PROVINCES",
  "/districts": "DISTRICTS",
  "/regions": "REGIONS",
};

export const getPsgcLocation = async (psgcCode: string) => {
  // Ordered by specificity to find the object
  for (const endpoint of Object.keys(ENDPOINT_SCOPE_MAP)) {
    try {
      const response = await axios.get(`${PSGC_API}${endpoint}/${psgcCode}`);
      if (response.data) {
        return { ...response.data, scopeValue: ENDPOINT_SCOPE_MAP[endpoint] };
      }
    } catch (error) {
      continue;
    }
  }
  return null;
};
