// prisma/seeders/profileFieldSeeder.ts
// Wipes DimField and everything FK-dependent on it (options, user answers, dynamic
// condition trees, benefit eligibility leaves) and reseeds the core GLOBAL profile fields
// from profileFields.data.ts. Destructive by design — run only when you actually want a
// clean slate for fields (see prisma/seed.ts).

import { prisma, Prisma } from "../../src/utils/prisma.js";
import { generateUniqueCode, toSnakeCaseKey } from "../../src/utils/slug.util.js";
import { profileFields } from "../data/profileFields.data.js";

export async function seedProfileFields() {
  console.log("Truncating DimField and all FK-dependent tables (options, user answers, dynamic conditions, benefit eligibility leaves)...");
  // CASCADE pulls in every table with a (direct or transitive) FK to dim_field:
  // dim_field_option, fct_user_field_answer, fct_user_field_answer_group,
  // fct_dynamic_rule_group, fct_dynamic_field_condition, benefit_field_condition.
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "dim_field" CASCADE;');

  console.log("Seeding profile fields...");
  const inputTypes = await prisma.dimFieldInputType.findMany();
  const inputTypeMap = Object.fromEntries(inputTypes.map((t) => [t.value, t.id]));

  let created = 0;
  for (const def of profileFields) {
    const fieldInputTypeId = inputTypeMap[def.inputType];
    if (!fieldInputTypeId) {
      throw new Error(`Unknown inputType "${def.inputType}" for field "${def.englishName}" — is it seeded in DimFieldInputType?`);
    }

    const field = await prisma.dimField.create({
      data: {
        key: generateUniqueCode(def.englishName),
        englishName: def.englishName,
        tagalogName: def.tagalogName,
        englishDescription: def.englishDescription,
        tagalogDescription: def.tagalogDescription,
        classification: "GLOBAL",
        default: true,
        // Every profile field is a system-shipped default — but "Occupation" isn't
        // actually eGovPH-sourced, we authored its option list ourselves, so it's the one
        // exception left editable/unlocked in the admin UI (see DimField.eGovField).
        eGovField: def.englishName !== "Occupation",
        required: def.required,
        notConditional: def.notConditional,
        sortOrder: def.sortOrder,
        configJson: def.configJson === null ? Prisma.DbNull : (def.configJson as Prisma.InputJsonValue),
        fieldInputTypeId,
      },
    });
    created++;

    if (def.options) {
      await prisma.dimFieldOption.createMany({
        data: def.options.map((option, index) => ({
          fieldId: field.id,
          // Always the normalized SCREAMING_SNAKE_CASE form of englishName — same
          // convention as every other option/key value in this codebase (see slug.util.ts).
          value: toSnakeCaseKey(option.englishName),
          englishName: option.englishName,
          tagalogName: option.tagalogName,
          englishDescription: option.englishName,
          tagalogDescription: option.tagalogName,
          sortOrder: index,
        })),
      });
    }
  }

  console.log(`Profile fields seeded (${created} entries).`);
}
