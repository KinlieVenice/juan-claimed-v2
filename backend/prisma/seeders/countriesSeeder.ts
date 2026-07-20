// prisma/seeders/countriesSeeder.ts
// Loads backend/data/countries.json into DimCountries — a static reference table (ISO
// country list), not a DimField-scoped option list. See fieldOptions.service.ts's
// fetchFieldOptions for how the Nationality/Country fields serve options FROM this table.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { prisma } from "../../src/utils/prisma.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COUNTRIES_JSON_PATH = path.resolve(__dirname, "../../data/countries.json");

interface CountryJsonRow {
  num_code: string;
  alpha_2_code: string;
  alpha_3_code: string;
  en_short_name: string;
  nationality: string;
}

export async function seedCountries() {
  console.log("Seeding DimCountries from backend/data/countries.json...");

  const raw = readFileSync(COUNTRIES_JSON_PATH, "utf-8");
  const rows: CountryJsonRow[] = JSON.parse(raw);

  // Truncate + reseed every run — static reference data, no reason to diff/upsert. CASCADE
  // also clears the _DimCountriesToDimField join table (belt-and-suspenders — it's already
  // empty by the time this runs, since profileFieldSeeder's own CASCADE truncate of
  // dim_field clears it first).
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "dim_countries" CASCADE;');

  await prisma.dimCountries.createMany({
    data: rows.map((row) => ({
      numCode: row.num_code,
      alpha2Code: row.alpha_2_code,
      alpha3Code: row.alpha_3_code,
      enShortName: row.en_short_name,
      nationality: row.nationality,
    })),
  });

  console.log(`DimCountries seeded (${rows.length} entries).`);

  // Real DB-level wiring (not string-matching) — connect every country row to whichever
  // profile fields consume this table, so the relation is visible/queryable in Prisma
  // Client (field.countries / country.fields), not just inferred from englishName.
  const countryIds = (await prisma.dimCountries.findMany({ select: { id: true } })).map((c) => ({ id: c.id }));
  const consumers = await prisma.dimField.findMany({
    where: { englishName: { in: ["Nationality", "Country"] } },
    select: { id: true, englishName: true },
  });

  for (const field of consumers) {
    await prisma.dimField.update({
      where: { id: field.id },
      data: { countries: { connect: countryIds } },
    });
  }

  console.log(`Wired DimCountries to ${consumers.length} field(s) (${consumers.map((f) => f.englishName).join(", ")}).`);
}
