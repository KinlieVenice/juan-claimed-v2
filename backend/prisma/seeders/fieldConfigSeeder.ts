// prisma/seeders/fieldConfigSeeder.ts

import { prisma } from "../../src/utils/prisma.js"
import { inputTypesData, operatorsData } from '../data/fieldConfig.js';

export async function seedFieldConfiguration() {
  console.log('Seeding System Field Input Types...');
  const inputTypeMap: Record<string, string> = {};

  for (const type of inputTypesData) {
    const record = await prisma.dimFieldInputType.upsert({
      where: { value: type.value },
      update: {
        englishName: type.englishName,
        tagalogName: type.tagalogName,
      },
      create: {
        value: type.value,
        englishName: type.englishName,
        tagalogName: type.tagalogName,
      },
    });
    inputTypeMap[type.value] = record.id;
  }
  console.log(`Input Types synchronized (${Object.keys(inputTypeMap).length} entries).`);

  console.log('Seeding Field Condition Operators...');
  let operatorCount = 0;

  for (const op of operatorsData) {
    const fieldInputTypeId = inputTypeMap[op.inputTypeValue];

    if (!fieldInputTypeId) {
      console.warn(`⚠️ Warning: Input type "${op.inputTypeValue}" missing for operator "${op.value}". Skipping.`);
      continue;
    }

    await prisma.dimFieldConditionOperator.upsert({
      // Composite key — "EQUALS" (etc.) is a distinct row PER input type, not one shared
      // row across all of them (see the migration that fixed this constraint).
      where: { value_fieldInputTypeId: { value: op.value, fieldInputTypeId } },
      update: {
        englishName: op.englishName,
        tagalogName: op.tagalogName,
      },
      create: {
        value: op.value,
        englishName: op.englishName,
        tagalogName: op.tagalogName,
        fieldInputTypeId: fieldInputTypeId,
      },
    });
    operatorCount++;
  }

  console.log(`Condition Operators synchronized (${operatorCount} entries).`);

  // The loop above only creates/updates — an operator removed from operatorsData (e.g. a
  // rename like MULTI_SELECT's IN/NOT_IN -> HAS_ANY/HAS_NONE) otherwise sits in the DB
  // forever as a confusing stale duplicate in the admin's operator picker. Reconcile by
  // deleting anything no longer present, skipping (not crashing) any row a live
  // dynamic-condition/benefit-condition leaf still actually references.
  console.log('Reconciling stale Field Condition Operators...');
  const validOperatorKeys = new Set(
    operatorsData.filter((op) => inputTypeMap[op.inputTypeValue]).map((op) => `${op.value}::${inputTypeMap[op.inputTypeValue]}`),
  );
  const existingOperators = await prisma.dimFieldConditionOperator.findMany({ select: { id: true, value: true, fieldInputTypeId: true } });
  const staleOperators = existingOperators.filter((o) => !validOperatorKeys.has(`${o.value}::${o.fieldInputTypeId}`));

  let removedCount = 0;
  for (const stale of staleOperators) {
    try {
      await prisma.dimFieldConditionOperator.delete({ where: { id: stale.id } });
      removedCount++;
    } catch {
      console.warn(`⚠️ Could not remove stale operator "${stale.value}" — still referenced by an existing condition, leaving it in place.`);
    }
  }
  console.log(`Removed ${removedCount} stale operator(s) no longer in fieldConfig.ts.`);
}