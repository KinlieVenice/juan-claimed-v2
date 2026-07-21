// prisma/seeders/schoolsSeeder.ts
// Loads backend/data/schools.json into DimSchool — a static reference table (flattened
// school names), not a DimField-scoped option list. See fieldOptions.service.ts's
// fetchFieldOptions for how the "School" field serves options FROM this table, same
// pattern as countriesSeeder.ts/DimCountries.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { prisma } from "../../src/utils/prisma.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHOOLS_JSON_PATH = path.resolve(__dirname, "../../data/schools.json");

interface SchoolJsonRow {
  name: string;
  type: string;
  category: string;
}

interface SchoolsJson {
  regions: Record<string, SchoolJsonRow[]>;
}

export async function seedSchools() {
  console.log("Seeding DimSchool from backend/data/schools.json...");

  const raw = readFileSync(SCHOOLS_JSON_PATH, "utf-8");
  const parsed: SchoolsJson = JSON.parse(raw);

  // Region/type/category are dropped — just the flat school name list, deduped (the same
  // school can legitimately appear under more than one region's array in the source data).
  const names = Array.from(new Set(Object.values(parsed.regions).flat().map((row) => row.name))).sort((a, b) =>
    a.localeCompare(b),
  );

  // Truncate + reseed every run — static reference data, no reason to diff/upsert. CASCADE
  // also clears the _DimSchoolToDimField join table.
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "dim_school" CASCADE;');

  await prisma.dimSchool.createMany({ data: names.map((name) => ({ name })) });

  console.log(`DimSchool seeded (${names.length} entries).`);

  // Real DB-level wiring (not string-matching) — connect every school row to the "School"
  // field, so the relation is visible/queryable in Prisma Client (field.schools /
  // school.fields), not just inferred from englishName.
  const schoolIds = (await prisma.dimSchool.findMany({ select: { id: true } })).map((s) => ({ id: s.id }));
  const consumers = await prisma.dimField.findMany({
    where: { englishName: "School" },
    select: { id: true, englishName: true },
  });

  for (const field of consumers) {
    await prisma.dimField.update({
      where: { id: field.id },
      data: { schools: { connect: schoolIds } },
    });
  }

  console.log(`Wired DimSchool to ${consumers.length} field(s) (${consumers.map((f) => f.englishName).join(", ")}).`);
}
