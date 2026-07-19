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
      where: { value: op.value },
      update: {
        englishName: op.englishName,
        tagalogName: op.tagalogName,
        fieldInputTypeId: fieldInputTypeId,
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
}