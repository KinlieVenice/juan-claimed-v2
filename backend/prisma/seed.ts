/// <reference types="node" />
// prisma/seed.ts

import { prisma } from "../src/utils/prisma.js"
import { seedFieldConfiguration } from './seeders/fieldConfigSeeder';
import { seedUsersAndRoles } from "./seeders/userRoleSeeder.js";
import { seedProfileFields } from "./seeders/profileFieldSeeder.js";
import { seedCountries } from "./seeders/countriesSeeder.js";
import { seedSchools } from "./seeders/schoolsSeeder.js";
import { seedPhLocationHierarchy } from "./seeders/phLocationHierarchySeeder.js";
import { seedOccupationOthers } from "./seeders/occupationOthersSeeder.js";

async function main() {
  console.log('Executing Main Master Database Seed...');

  // Execute modular seed blocks sequentially
  await seedFieldConfiguration();

  await seedUsersAndRoles();

  await seedProfileFields();

  await seedPhLocationHierarchy();

  await seedOccupationOthers();

  await seedCountries();

  await seedSchools();

  // Future seed blocks can be safely added here:
  // await seedDefaultSettings(prisma);

  console.log('All database seeder modules executed successfully.');
}

main()
  .catch((error) => {
    console.error('Critical error encountered in master seeder loop:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });