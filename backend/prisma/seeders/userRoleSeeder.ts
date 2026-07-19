import { prisma } from "../../src/utils/prisma.js";
import { UserRole } from "../../src/generated/prisma/client.js";

export async function seedUsersAndRoles() {
  console.log("Seeding System Scopes...");
  const scopeData = [
    { name: "Superadmin", value: "SUPERADMIN" },
    { name: "National", value: "NATIONAL" },
    { name: "Region", value: "REGIONS" },
    { name: "Province", value: "PROVINCES" },
    { name: "District", value: "DISTRICTS" },
    { name: "City/Municipality", value: "CITIES-MUNICIPALITIES" },
    { name: "Barangay", value: "BARANGAYS" },
  ];

  const createdScopes: Record<string, string> = {};

  for (const s of scopeData) {
    const scope = await prisma.dimScope.upsert({
      where: { value: s.value },
      update: { name: s.name },
      create: s,
    });
    createdScopes[s.value] = scope.id;
  }
  console.log(
    `Scopes synchronized (${Object.keys(createdScopes).length} entries).`,
  );

  console.log("Seeding System Groups...");
  let superadminGroup = await prisma.dimGroup.findFirst({
    where: { englishName: "Superadmin Group" },
  });

  if (!superadminGroup) {
    superadminGroup = await prisma.dimGroup.create({
      data: {
        englishName: "Superadmin Group",
        tagalogName: "Superadmin Grupo",
        englishDescription: "Group for system super administrators",
        tagalogDescription: "Grupo para sa mga super administrator ng sistema",
      },
    });
  }

  let dohGroup = await prisma.dimGroup.findFirst({
    where: { englishName: "Department of Health" },
  });

  if (!dohGroup) {
    dohGroup = await prisma.dimGroup.create({
      data: {
        englishName: "Department of Health",
        tagalogName: "Kagawaran ng Kalusugan",
        englishDescription: "National government agency for health",
        tagalogDescription:
          "Pambansang ahensya ng pamahalaan para sa kalusugan",
      },
    });
  }
  console.log("Groups synchronized.");

  console.log("Seeding Users according to role constraints...");

  // A. Superadmin Account (Scope: Superadmin, Group: Superadmin, PsgcCode: Superadmin)
  await prisma.dimUser.upsert({
    where: { email: "superadmin@juanclaimed.com" },
    update: {},
    create: {
      username: "superadmin_main",
      email: "superadmin@juanclaimed.com",
      firstName: "System",
      lastName: "Administrator",
      role: UserRole.SUPERADMIN,
      scopeId: createdScopes["SUPERADMIN"],
      groupId: superadminGroup.id,
      psgcCode: "SUPERADMIN",
    },
  });

  // B. National Agent Account (Scope: National, Group: NOT NULL, PsgcCode: NULL)
  await prisma.dimUser.upsert({
    where: { email: "agent.doh@juanclaimed.com" },
    update: {},
    create: {
      username: "agent_national_doh",
      email: "agent.doh@juanclaimed.com",
      firstName: "National",
      lastName: "Agent",
      role: UserRole.AGENT,
      scopeId: createdScopes["NATIONAL"],
      groupId: dohGroup.id,
      psgcCode: null,
    },
  });

  // C. Provincial Agent Account (Scope: Province, Group: NULL, PsgcCode: NOT NULL)
  await prisma.dimUser.upsert({
    where: { email: "agent.cavite@juanclaimed.com" },
    update: {},
    create: {
      username: "agent_prov_cavite",
      email: "agent.cavite@juanclaimed.com",
      firstName: "Ilocos Norte",
      lastName: "Agent",
      role: UserRole.AGENT,
      scopeId: createdScopes["PROVINCES"],
      groupId: null,
      psgcCode: "012800000",
    },
  });

  // D. Standard User Account (Scope: NULL, Group: NULL, PsgcCode: NULL)
  await prisma.dimUser.upsert({
    where: { email: "juan.delacruz@gmail.com" },
    update: {},
    create: {
      username: "juan_delacruz",
      email: "juan.delacruz@gmail.com",
      firstName: "Juan",
      lastName: "Dela Cruz",
      role: UserRole.USER,
      scopeId: null,
      groupId: null,
      psgcCode: null,
    },
  });

  console.log("Users synchronized.");
}
