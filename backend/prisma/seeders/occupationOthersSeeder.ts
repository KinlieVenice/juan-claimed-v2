// prisma/seeders/occupationOthersSeeder.ts
// Seeds a real example of a "Children Dependents"/anchored conditional child: a free-text
// field that pops up right under Occupation when it's answered "Others" — exercising the
// exact mechanism field.service.ts's addField/resolveAnchor implement (dynamicCondition
// pointing at Occupation + anchorFieldId pinning it to render beside/beneath Occupation
// instead of at its own flat sortOrder). Reuses the real composite service directly rather
// than hand-rolling the create+condition+anchor logic again here.

import { prisma } from "../../src/utils/prisma.js";
import { addField, editField } from "../../src/services/field.service.js";

export async function seedOccupationOthers() {
  console.log('Seeding "Please Specify Occupation" anchored child...');

  const occupation = await prisma.dimField.findFirst({ where: { englishName: "Occupation" } });
  if (!occupation) {
    console.log('Skipped "Please Specify Occupation" — no "Occupation" field found.');
    return;
  }

  const othersOption = await prisma.dimFieldOption.findFirst({ where: { fieldId: occupation.id, englishName: "Others" } });
  if (!othersOption) {
    console.log('Skipped "Please Specify Occupation" — no "Others" option found on Occupation.');
    return;
  }

  const equalsOperator = await prisma.dimFieldConditionOperator.findFirst({ where: { value: "EQUALS", fieldInputTypeId: occupation.fieldInputTypeId } });
  if (!equalsOperator) {
    console.log('Skipped "Please Specify Occupation" — no EQUALS operator seeded for Occupation\'s input type.');
    return;
  }

  const textType = await prisma.dimFieldInputType.findFirst({ where: { value: "TEXT" } });
  if (!textType) {
    console.log('Skipped "Please Specify Occupation" — TEXT input type not seeded.');
    return;
  }

  // englishName reads naturally as the actual prompt shown once "Others" is picked — key
  // just derives from it as usual (generateUniqueCode), whatever that normalizes to, same
  // as every other field. Not forced to literally read "OCCUPATION_OTHERS".
  const existing = await prisma.dimField.findFirst({ where: { englishName: "Please Specify Occupation" } });

  const compositeInput = {
    field: {
      englishName: "Please Specify Occupation",
      tagalogName: "Pakisabi ang Trabaho",
      englishDescription: 'Specify your occupation since you selected "Others".',
      tagalogDescription: 'Tukuyin ang iyong trabaho dahil pinili mong "Iba Pa".',
      classification: occupation.classification,
      default: false,
      required: false,
      notConditional: true,
      sortOrder: 0,
      configJson: null,
      fieldInputTypeId: textType.id,
      parentFieldId: null,
      fieldHierarchyId: null,
      anchorFieldId: occupation.id,
    },
    dynamicCondition: {
      kind: "group" as const,
      logicalOperator: "ALL" as const,
      children: [{ kind: "condition" as const, fieldConditionOperatorId: equalsOperator.id, conditionFieldValue: othersOption.value, conditionFieldId: occupation.id }],
    },
  };

  // profileFieldSeeder truncates dim_field on every full `npm run seed` run, so in the
  // normal flow `existing` is always null here — this branch only matters if this seeder is
  // ever re-run in isolation without a preceding truncate.
  const field = existing ? await editField(existing.id, compositeInput) : await addField(compositeInput);

  // eGovField isn't part of the composite create/update schema (addField/editField never
  // touch it — see requests/field.request.ts) since it's not admin-authorable content, it's
  // a fact about where the field's value comes from. Set directly here, same as Occupation
  // itself (profileFieldSeeder.ts): this field only ever holds a value because Occupation's
  // own eGov-synced answer was "Others", so it's exactly as eGov-locked as its parent.
  await prisma.dimField.update({ where: { id: field.id }, data: { eGovField: true, classification: "GLOBAL" } });

  console.log(`"Please Specify Occupation" ${existing ? "refreshed" : "created"} (key ${field.key}) and anchored to Occupation.`);
}
