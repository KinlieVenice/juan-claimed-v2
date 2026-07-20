// Philippine Standard Geographic Code (PSGC) helpers — pure, no DB/network access. The
// 9-digit PSGC code format is itself hierarchical: 2 digits region + 2 digits province/
// district + 2 digits city/municipality + 3 digits barangay, each segment zero-padded when
// unset. Verified directly against the live API (psgc.gitlab.io) this app's frontend
// already uses (frontend/src/services/psgc.service.ts) — e.g. Cavite province "042100000"
// sits under region "040000000" (CALABARZON); Carmona city "042104000" sits under Cavite;
// Lantic barangay "042104008" sits under Carmona. Because the parent/child relationship is
// baked directly into the code's digit positions, the full ancestor chain for ANY code can
// be derived by truncating+zero-padding it — no need to store the ~42,000 barangays (or any
// other level) in our own DB, and no need to call the live PSGC API during evaluation.

const PSGC_CODE_PATTERN = /^\d{9}$/;

export const isPsgcCode = (value: unknown): value is string => typeof value === "string" && PSGC_CODE_PATTERN.test(value);

const regionCodeOf = (code: string) => `${code.slice(0, 2)}0000000`;
const provinceCodeOf = (code: string) => `${code.slice(0, 4)}00000`;
const cityCodeOf = (code: string) => `${code.slice(0, 6)}000`;

// Root-first ancestor path for any PSGC code, stopping at whatever depth the code itself
// represents (a province code's path is just [region, province] — it isn't padded further
// down to a fake city/barangay entry). Returns [code] unchanged if it isn't a recognized
// 9-digit PSGC shape — fails safe (a single-element path still round-trips through
// EQUALS/BELONGS_TO/IN correctly for an exact-code match) rather than throwing.
export const derivePsgcAncestorPath = (code: string): string[] => {
  if (!isPsgcCode(code)) return [code];

  const path: string[] = [];
  const region = regionCodeOf(code);
  path.push(region);
  if (code === region) return path;

  const province = provinceCodeOf(code);
  path.push(province);
  if (code === province) return path;

  const city = cityCodeOf(code);
  path.push(city);
  if (code === city) return path;

  path.push(code);
  return path;
};
