// prisma/seeders/phLocationHierarchySeeder.ts
// Seeds the "PH Location" hierarchy — a special case: its LEVELS are statically defined
// (region/province-or-district/city/barangay), but its NODES are never seeded here, unlike
// a normal hierarchy (see benefitFieldFactory.ts's ensureHierarchy). Actual location
// options are fetched live from the public PSGC API by the frontend's
// PsgcPhLocationHierarchyField.tsx, which is swapped in for the generic static-node
// HierarchySelectField specifically when a field's hierarchy.key === "PH_LOCATION" (see
// frontend/src/components/fields/FieldInput.tsx). The stored answer value is just the
// selected barangay's PSGC code — condition evaluation needs no special handling, it's
// still a plain string EQUALS/IN comparison (see condition.util.ts's evaluateHierarchySelect).

import { prisma } from "../../src/utils/prisma.js";

const PH_LOCATION_KEY = "PH_LOCATION";

interface LevelDef {
  level: number;
  englishName: string;
  tagalogName: string;
  englishDescription: string;
  tagalogDescription: string;
}

const levels: LevelDef[] = [
  { level: 1, englishName: "Country", tagalogName: "Bansa", englishDescription: "Country name", tagalogDescription: "Bansa" },
  { level: 2, englishName: "Region", tagalogName: "Rehiyon", englishDescription: "Administrative region", tagalogDescription: "Rehiyon" },
  {
    level: 3,
    englishName: "District",
    tagalogName: "Distrito",
    englishDescription: "Legislative or administrative district within a region",
    tagalogDescription: "Administratibo o pambatasang distrito sa loob ng rehiyon",
  },
  { level: 4, englishName: "Province", tagalogName: "Lalawigan", englishDescription: "Province location", tagalogDescription: "Lalawigan o probinsya" },
  {
    level: 5,
    englishName: "City / Municipality",
    tagalogName: "Lungsod / Bayan",
    englishDescription: "City or municipality",
    tagalogDescription: "Lungsod o munisipalidad",
  },
  { level: 6, englishName: "Barangay", tagalogName: "Barangay", englishDescription: "Local barangay", tagalogDescription: "Lokal na barangay" },
];

export async function seedPhLocationHierarchy() {
  console.log("Seeding PH Location hierarchy...");

  const hierarchy = await prisma.dimFieldHierarchy.upsert({
    where: { key: PH_LOCATION_KEY },
    update: {},
    create: {
      key: PH_LOCATION_KEY,
      default: true,
      englishName: "Philippine Location",
      tagalogName: "Lokasyon sa Pilipinas",
      englishDescription:
        "Region, province/district, city/municipality, and barangay hierarchy for Philippine addresses — options are sourced live from the PSGC API, not stored as hierarchy nodes.",
      tagalogDescription: "Hierarkiya ng rehiyon, lalawigan/distrito, lungsod/munisipalidad, at barangay para sa mga address sa Pilipinas.",
    },
  });

  for (const level of levels) {
    const existing = await prisma.dimFieldHierarchyLevel.findFirst({ where: { fieldHierarchyId: hierarchy.id, level: level.level } });
    if (existing) {
      await prisma.dimFieldHierarchyLevel.update({
        where: { id: existing.id },
        data: {
          englishName: level.englishName,
          tagalogName: level.tagalogName,
          englishDescription: level.englishDescription,
          tagalogDescription: level.tagalogDescription,
        },
      });
    } else {
      await prisma.dimFieldHierarchyLevel.create({
        data: {
          fieldHierarchyId: hierarchy.id,
          level: level.level,
          englishName: level.englishName,
          tagalogName: level.tagalogName,
          englishDescription: level.englishDescription,
          tagalogDescription: level.tagalogDescription,
        },
      });
    }
  }

  const residence = await prisma.dimField.findFirst({ where: { englishName: "Residence" } });
  if (residence) {
    await prisma.dimField.update({ where: { id: residence.id }, data: { fieldHierarchyId: hierarchy.id } });
    console.log(`PH Location hierarchy ready (${levels.length} levels) — attached to "Residence".`);
  } else {
    console.log(`PH Location hierarchy ready (${levels.length} levels) — no "Residence" field found to attach to.`);
  }
}
