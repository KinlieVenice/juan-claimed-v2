import * as React from "react";
import { cn } from "@/lib/utils";
import { FloatingLabelField } from "@/components/ui/floating-label-field";
import { CascadingSelectRow, type HierarchyColumn } from "@/components/ui/hierarchy-select-field";
import {
  getRegions,
  getSubdivisions,
  getCitiesMunicipalities,
  getBarangays,
  type PsgcAdminMode,
  type PsgcRegion,
  type PsgcProvince,
  type PsgcDistrict,
  type PsgcCityMunicipality,
  type PsgcBarangay,
} from "@/services/psgc.service";

export interface PsgcAddressValue {
  mode: PsgcAdminMode;
  regionCode: string;
  regionName: string;
  /** Province code/name, or district code/name — whichever `mode` selected. */
  subdivisionCode: string;
  subdivisionName: string;
  cityMunicipalityCode: string;
  cityMunicipalityName: string;
  barangayCode: string;
  barangayName: string;
  /** Whichever level this picker actually stopped at (see `maxLevel`) — the terminal
   * code/name to persist. Always mirrors one of the pairs above, so a caller that doesn't
   * know (or care) which specific level it configured can just read this instead. */
  leafCode: string;
  leafName: string;
}

/** Depth of each named tier — 0 = region, 3 = barangay (the deepest possible). */
const LEVEL_DEPTH = { region: 0, province: 1, city: 2, barangay: 3 } as const;
type PsgcMaxLevel = keyof typeof LEVEL_DEPTH;

interface PsgcPhLocationHierarchyFieldProps {
  label: string;
  /** Small line under the label, e.g. its Tagalog translation — testing only. */
  sublabel?: string;
  value: PsgcAddressValue | null;
  onChange: (value: PsgcAddressValue | null) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  badge?: React.ReactNode;
  containerClassName?: string;
  /** Shows the Province/District grouping toggle — this is a PSGC authoring detail
   * ("which administrative tier sits between region and city"), not something a
   * non-technical applicant/admin filling out a field answer or a condition value needs to
   * see. Only Agent creation (assigning a jurisdiction) needs to choose it explicitly;
   * every other use of this field (field config, benefit conditions, field answers) leaves
   * it off and stays on the "province" default. */
  allowAdminModeToggle?: boolean;
  /** Skips the FloatingLabelField box and the between-level indentation — for embedding
   * directly inside a field/operator/value condition row, where the row already makes it
   * obvious this control IS "the value". Each level still keeps its own label and grey
   * trigger background, just laid out flat instead of nested inside a bordered field. */
  inline?: boolean;
  /** Deepest tier this picker goes to before it's considered complete — e.g. "city" stops
   * rendering after the City/Municipality column and fires onChange once that's picked,
   * instead of forcing a drill-down to Barangay. Used to match an agent's own assigned
   * scope (a CITIES-MUNICIPALITIES-scope agent must pick all the way to their city, not
   * stop partway at region/province, and has no reason to go deeper to barangay either).
   * Defaults to "barangay" — today's full-depth behavior, unchanged for every other caller. */
  maxLevel?: PsgcMaxLevel;
}

// Runs `effect` on dep changes, giving it an `isCancelled()` check so a slow response that
// resolves after the deps have already changed again (e.g. user picks a new region before
// the previous province list finishes loading) doesn't clobber newer state.
function useCancelableEffect(effect: (isCancelled: () => boolean) => void, deps: React.DependencyList) {
  React.useEffect(() => {
    let cancelled = false;
    effect(() => cancelled);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// The default region -> province/district -> city/municipality -> barangay cascading
// picker, backed by the public PSGC API (services/psgc.service.ts). This is the
// eGov-standard address field — reuse it anywhere an address needs to be captured rather
// than building another cascading select.
//
// Uncontrolled beyond the initial `value`: region/subdivision/city/barangay selections live
// in local state seeded once from `value` (same pattern as HierarchySelectField in
// text-field.tsx) so an already-answered field pre-fetches and shows its full ancestor
// chain, but external resets of `value` after mount won't retroactively change the open
// selects.
export function PsgcPhLocationHierarchyField({
  label,
  sublabel,
  value,
  onChange,
  required,
  disabled,
  error,
  hint,
  badge,
  containerClassName,
  allowAdminModeToggle,
  inline,
  maxLevel = "barangay",
}: PsgcPhLocationHierarchyFieldProps) {
  const maxDepth = LEVEL_DEPTH[maxLevel];
  const [mode, setMode] = React.useState<PsgcAdminMode>(value?.mode ?? "province");
  const [regionCode, setRegionCode] = React.useState(value?.regionCode ?? "");
  const [subdivisionCode, setSubdivisionCode] = React.useState(value?.subdivisionCode ?? "");
  const [cityCode, setCityCode] = React.useState(value?.cityMunicipalityCode ?? "");
  const [barangayCode, setBarangayCode] = React.useState(value?.barangayCode ?? "");

  const [regions, setRegions] = React.useState<PsgcRegion[]>([]);
  const [subdivisions, setSubdivisions] = React.useState<(PsgcProvince | PsgcDistrict)[]>([]);
  const [cities, setCities] = React.useState<PsgcCityMunicipality[]>([]);
  const [barangays, setBarangays] = React.useState<PsgcBarangay[]>([]);

  const [loading, setLoading] = React.useState({ regions: false, subdivisions: false, cities: false, barangays: false });

  useCancelableEffect((isCancelled) => {
    setLoading((l) => ({ ...l, regions: true }));
    getRegions()
      .then((data) => !isCancelled() && setRegions(data))
      .finally(() => !isCancelled() && setLoading((l) => ({ ...l, regions: false })));
  }, []);

  useCancelableEffect(
    (isCancelled) => {
      if (!regionCode) {
        setSubdivisions([]);
        return;
      }
      setLoading((l) => ({ ...l, subdivisions: true }));
      getSubdivisions(mode, regionCode)
        .then((data) => !isCancelled() && setSubdivisions(data))
        .finally(() => !isCancelled() && setLoading((l) => ({ ...l, subdivisions: false })));
    },
    [regionCode, mode],
  );

  useCancelableEffect(
    (isCancelled) => {
      if (!subdivisionCode) {
        setCities([]);
        return;
      }
      setLoading((l) => ({ ...l, cities: true }));
      getCitiesMunicipalities(mode, subdivisionCode)
        .then((data) => !isCancelled() && setCities(data))
        .finally(() => !isCancelled() && setLoading((l) => ({ ...l, cities: false })));
    },
    [subdivisionCode, mode],
  );

  useCancelableEffect(
    (isCancelled) => {
      if (!cityCode) {
        setBarangays([]);
        return;
      }
      setLoading((l) => ({ ...l, barangays: true }));
      getBarangays(cityCode)
        .then((data) => !isCancelled() && setBarangays(data))
        .finally(() => !isCancelled() && setLoading((l) => ({ ...l, barangays: false })));
    },
    [cityCode],
  );

  const handleModeChange = (nextMode: PsgcAdminMode) => {
    setMode(nextMode);
    setSubdivisionCode("");
    setCityCode("");
    setBarangayCode("");
    onChange(null);
  };

  const handleRegionChange = (code: string) => {
    setRegionCode(code);
    setSubdivisionCode("");
    setCityCode("");
    setBarangayCode("");

    if (maxDepth > 0) {
      onChange(null);
      return;
    }
    const region = regions.find((r) => r.code === code);
    if (!region) return;
    onChange({
      mode,
      regionCode: region.code,
      regionName: region.name,
      subdivisionCode: "",
      subdivisionName: "",
      cityMunicipalityCode: "",
      cityMunicipalityName: "",
      barangayCode: "",
      barangayName: "",
      leafCode: region.code,
      leafName: region.name,
    });
  };

  const handleSubdivisionChange = (code: string) => {
    setSubdivisionCode(code);
    setCityCode("");
    setBarangayCode("");

    if (maxDepth > 1) {
      onChange(null);
      return;
    }
    const region = regions.find((r) => r.code === regionCode);
    const subdivision = subdivisions.find((s) => s.code === code);
    if (!region || !subdivision) return;
    onChange({
      mode,
      regionCode: region.code,
      regionName: region.name,
      subdivisionCode: subdivision.code,
      subdivisionName: subdivision.name,
      cityMunicipalityCode: "",
      cityMunicipalityName: "",
      barangayCode: "",
      barangayName: "",
      leafCode: subdivision.code,
      leafName: subdivision.name,
    });
  };

  const handleCityChange = (code: string) => {
    setCityCode(code);
    setBarangayCode("");

    if (maxDepth > 2) {
      onChange(null);
      return;
    }
    const region = regions.find((r) => r.code === regionCode);
    const subdivision = subdivisions.find((s) => s.code === subdivisionCode);
    const city = cities.find((c) => c.code === code);
    if (!region || !subdivision || !city) return;
    onChange({
      mode,
      regionCode: region.code,
      regionName: region.name,
      subdivisionCode: subdivision.code,
      subdivisionName: subdivision.name,
      cityMunicipalityCode: city.code,
      cityMunicipalityName: city.name,
      barangayCode: "",
      barangayName: "",
      leafCode: city.code,
      leafName: city.name,
    });
  };

  const handleBarangayChange = (code: string) => {
    const region = regions.find((r) => r.code === regionCode);
    const subdivision = subdivisions.find((s) => s.code === subdivisionCode);
    const city = cities.find((c) => c.code === cityCode);
    const barangay = barangays.find((b) => b.code === code);
    if (!region || !subdivision || !city || !barangay) return;

    setBarangayCode(code);
    onChange({
      mode,
      regionCode: region.code,
      regionName: region.name,
      subdivisionCode: subdivision.code,
      subdivisionName: subdivision.name,
      cityMunicipalityCode: city.code,
      cityMunicipalityName: city.name,
      barangayCode: barangay.code,
      barangayName: barangay.name,
      leafCode: barangay.code,
      leafName: barangay.name,
    });
  };

  const columns: HierarchyColumn[] = [
    {
      value: regionCode || undefined,
      onChange: handleRegionChange,
      disabled: disabled || loading.regions,
      options: regions.map((r) => ({ value: r.code, label: r.name })),
      placeholder: loading.regions ? "Loading..." : "Region",
    },
  ];
  if (regionCode && maxDepth >= LEVEL_DEPTH.province) {
    columns.push({
      value: subdivisionCode || undefined,
      onChange: handleSubdivisionChange,
      disabled: disabled || loading.subdivisions,
      options: subdivisions.map((s) => ({ value: s.code, label: s.name })),
      placeholder: loading.subdivisions ? "Loading..." : mode === "district" ? "District" : "Province",
    });
  }
  if (subdivisionCode && maxDepth >= LEVEL_DEPTH.city) {
    columns.push({
      value: cityCode || undefined,
      onChange: handleCityChange,
      disabled: disabled || loading.cities,
      options: cities.map((c) => ({ value: c.code, label: c.name })),
      placeholder: loading.cities ? "Loading..." : "City/Municipality",
    });
  }
  if (cityCode && maxDepth >= LEVEL_DEPTH.barangay) {
    columns.push({
      value: barangayCode || undefined,
      onChange: handleBarangayChange,
      disabled: disabled || loading.barangays,
      options: barangays.map((b) => ({ value: b.code, label: b.name })),
      placeholder: loading.barangays ? "Loading..." : "Barangay",
    });
  }

  const modeToggle = allowAdminModeToggle && (
    <div className="flex items-center justify-end gap-4">
      <span className="text-xs font-medium text-muted-foreground">Group by</span>
      <div className="inline-flex rounded-lg border border-input p-1">
        {(["province", "district"] as PsgcAdminMode[]).map((m) => (
          <button
            key={m}
            type="button"
            disabled={disabled}
            onClick={() => handleModeChange(m)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              mode === m ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );

  if (inline) {
    return (
      <div className={cn("flex flex-col gap-3", containerClassName)}>
        {modeToggle}
        <CascadingSelectRow columns={columns} nested={false} />
      </div>
    );
  }

  return (
    <FloatingLabelField
      label={label}
      sublabel={sublabel}
      // Forced, not !!value — see HierarchySelectField's identical reasoning: a cascading
      // stack always has its first select visibly rendered from the start, so a
      // float-only-once-filled label would sit centered over it the whole time instead.
      hasValue
      required={required}
      disabled={disabled}
      error={error}
      hint={hint}
      badge={badge}
      className={containerClassName}
      disableClickCascade
    >
      <div className="flex flex-col gap-3">
        {modeToggle}
        <CascadingSelectRow columns={columns} nested={false} />
      </div>
    </FloatingLabelField>
  );
}
