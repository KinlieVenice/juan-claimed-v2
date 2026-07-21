// prisma/factories/demoPersonaFactory.ts
// Seeds 6 demo USER (citizen) accounts, one per life-stage persona, each with a believable
// but DELIBERATELY INCOMPLETE set of GLOBAL/eGov field answers already filled in — as if
// they'd already gone through eGov SSO once. This is the "Google SSO" mock-up the flow spec
// calls for: real eGov SSO never stores its fields in our DB (single source of truth is the
// live eGov session), but Google SSO has no such session to sync from, so its demo accounts
// carry their eGov-equivalent answers here instead (see fieldAnswer.service.ts — the exact
// same submitFieldAnswers() a real form submission would call, so this data behaves
// identically to anything a real applicant answered).
//
// "Believable but incomplete" means: every field gets a row (matching the app's own
// "asked but left blank" convention — see evaluateLeafNode's hasOwnProperty check), but
// several optional ones are deliberately null per persona, the way a real partially-filled
// eGov profile would be — not every field for every person.
//
// Wired into prisma/seed.ts (unlike factories/benefitFieldFactory.ts, which is a standalone
// manual script) — every call here is upsert/find-then-create, safe to re-run.

import { prisma } from "../../src/utils/prisma.js";
import { UserRole } from "../../src/generated/prisma/client.js";
import { hashPassword } from "../../src/utils/password.js";
import { submitFieldAnswers, createAnswerGroup, fetchAnswerGroups, type SubmitFieldAnswerInput } from "../../src/services/fieldAnswer.service.js";

interface PersonaDef {
  username: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  // Keyed by DimField.englishName (top-level GLOBAL fields only) — `null` means "asked,
  // left blank" (a real row with a null value), matching every other field not listed here.
  answers: Record<string, string | number | null>;
  // "Educational Attainment" is a REPEATER_GROUP — no scalar answer of its own, so it's
  // handled separately as (at most) one row. `undefined` means this persona never provided
  // this at all (no row/group), as opposed to a row with nulled-out subfields.
  education?: Record<string, string | number | null>;
}

// Nationality/Country are SINGLE_SELECT fields whose options are synthesized on the fly
// from DimCountries (fieldOptions.service.ts's fetchCountryBackedOptions) rather than real
// DimFieldOption rows — so encodeFieldValue's SINGLE_SELECT branch (which only checks
// DimFieldOption) can never validate them, a pre-existing gap unrelated to this factory.
// Written directly instead of through submitFieldAnswers for just these two; every other
// field goes through the real service so it's validated exactly like a real submission.
const COUNTRY_BACKED_FIELDS = new Set(["Nationality", "Country"]);

const personas: PersonaDef[] = [
  {
    // Student — Cavite State University-Carmona, living in the same city as the Carmona
    // demo agent (see the "then create admin and agent" block below) so that agent has a
    // real applicant to see.
    username: "demo_student_jhoriz",
    email: "aquinojhorizrodel@gmail.com",
    firstName: "Jhoriz",
    middleName: "Rodel",
    lastName: "Aquino",
    answers: {
      "Date of Birth": "2005-11-03",
      Gender: "MALE",
      "Mobile Number": "+639611754592",
      Nationality: "Filipino",
      Country: "Philippines",
      Residence: "042104008", // Barangay Lantic, Carmona, Cavite
      "Street Address": "123 Mabini Street",
      "Postal Code": 4116,
      "Full Address": "123 Mabini Street, Barangay Lantic, Carmona, Cavite",
      Occupation: "STUDENTS",
      "Marital Status": "Single",
      Religion: null, // intentional gap — never got around to it
      Weight: 60,
      Height: 170,
      Industry: null, // not employed yet
      "Salary Range": null, // no income yet
    },
    education: {
      Level: "Senior High",
      School: null, // intentional gap — current enrollment (Cavite State U-Carmona) not on file
      From: 2023,
      To: null, // still ongoing
    },
  },
  {
    // Working professional — Quezon City, IT industry.
    username: "demo_working_jeanne",
    email: "jeanne.guzon@gmail.com",
    firstName: "Jeanne",
    middleName: null,
    lastName: "Guzon",
    answers: {
      "Date of Birth": "1992-05-20",
      Gender: "FEMALE",
      "Mobile Number": "+639171234567",
      Nationality: "Filipino",
      Country: "Philippines",
      Residence: "137404001", // Barangay Alicia, Quezon City
      "Street Address": "45 Kalayaan Avenue",
      "Postal Code": 1100,
      "Full Address": "45 Kalayaan Avenue, Barangay Alicia, Quezon City",
      "Address Line 2": "Unit 3B",
      Occupation: "PRIVATE_EMPLOYEES",
      "Marital Status": "Married",
      Religion: "Roman Catholic",
      Weight: 58,
      Height: 160,
      Industry: "Information and Communication",
      "Salary Range": "60,001-90,000",
    },
    education: {
      Level: "Bachelor",
      School: null, // intentional gap
      From: 2010,
      To: 2014,
    },
  },
  {
    // Senior citizen — Cebu City, widowed, retired (no current occupation/industry/salary,
    // and no educational-attainment record at all — never provided that whole section).
    username: "demo_senior_alexie",
    email: "alexieleanne@gmail.com",
    firstName: "Alexie",
    middleName: null,
    lastName: "Leanne",
    answers: {
      "Date of Birth": "1958-03-15",
      Gender: "FEMALE",
      "Mobile Number": "+639281234567",
      Nationality: "Filipino",
      Country: "Philippines",
      Residence: "072217001", // Barangay Adlaon, Cebu City
      "Street Address": "Purok 2, Sitio Kahayag",
      "Postal Code": 6000,
      "Full Address": "Purok 2, Sitio Kahayag, Barangay Adlaon, Cebu City",
      Occupation: "SENIOR_CITIZENS",
      "Marital Status": "Widowed",
      Religion: "Roman Catholic",
      Weight: null, // intentional gap — health data often incomplete for this age group
      Height: null,
      Industry: null,
      "Salary Range": null,
    },
    // No `education` key at all — never provided, no row/group created.
  },
  {
    // Child — Laguna, no occupation/marital status/mobile of her own (a guardian would
    // have registered her), but a religion and current elementary enrollment are on file.
    username: "demo_child_kinlie",
    email: "kinlievenicedeguzman@gmail.com",
    firstName: "Kinlie",
    middleName: "Venice",
    lastName: "De Guzman",
    answers: {
      "Date of Birth": "2017-09-10",
      Gender: "FEMALE",
      "Mobile Number": null, // intentional gap — child, no personal number
      Nationality: "Filipino",
      Country: "Philippines",
      Residence: "043412012", // Barangay San Diego, Luisiana, Laguna
      "Street Address": "78 Bonifacio Street",
      "Postal Code": 4032,
      "Full Address": "78 Bonifacio Street, Barangay San Diego, Luisiana, Laguna",
      Occupation: null, // too young
      "Marital Status": null, // too young
      Religion: "Roman Catholic",
      Weight: 25,
      Height: 128,
      Industry: null,
      "Salary Range": null,
    },
    education: {
      Level: "Elementary",
      School: null,
      From: 2023,
      To: null, // still ongoing
    },
  },
  {
    // Everyman — Carmona, Cavite (same city as the Carmona demo agent, so that agent has a
    // second real applicant to see besides the Student persona above). Formerly seeded
    // answer-less by userRoleSeeder.ts's old "Standard User Account" block — every USER
    // account needs real Residence at minimum (it's a required field), so this account now
    // gets the same full, believable treatment as every other persona.
    username: "juan_delacruz",
    email: "juan.delacruz@gmail.com",
    firstName: "Juan",
    middleName: null,
    lastName: "Dela Cruz",
    answers: {
      "Date of Birth": "1988-06-12",
      Gender: "MALE",
      "Mobile Number": "+639178765432",
      Nationality: "Filipino",
      Country: "Philippines",
      Residence: "042104008", // Barangay Lantic, Carmona, Cavite
      "Street Address": "56 Rizal Avenue",
      "Postal Code": 4116,
      "Full Address": "56 Rizal Avenue, Barangay Lantic, Carmona, Cavite",
      Occupation: "PRIVATE_EMPLOYEES",
      "Marital Status": "Married",
      Religion: "Roman Catholic",
      Weight: 68,
      Height: 165,
      Industry: "Manufacturing",
      "Salary Range": "40,001-60,000",
    },
    education: {
      Level: "Bachelor",
      School: null, // intentional gap
      From: 2006,
      To: 2010,
    },
  },
  {
    // Unemployed — Davao City, job-seeking, finished senior high but didn't continue.
    username: "demo_unemployed_janvincent",
    email: "janvincentvallente@gmail.com",
    firstName: "Jan",
    middleName: "Vincent",
    lastName: "Vallente",
    answers: {
      "Date of Birth": "1996-01-25",
      Gender: "MALE",
      "Mobile Number": "+639051234567",
      Nationality: "Filipino",
      Country: "Philippines",
      Residence: "112402001", // Barangay Acacia, Davao City
      "Street Address": "12 Rizal Street",
      "Postal Code": 8000,
      "Full Address": "12 Rizal Street, Barangay Acacia, Davao City",
      Occupation: "JOB_SEEKERS",
      "Marital Status": "Single",
      Religion: "Islam",
      Weight: 70,
      Height: 172,
      Industry: null, // intentional gap — unemployed, no current industry
      "Salary Range": null, // intentional gap — no income
    },
    education: {
      Level: "Senior High",
      School: null,
      From: 2012,
      To: 2014,
    },
  },
];

async function resolveGlobalFieldMap(): Promise<{ topLevel: Map<string, string>; educationSubfields: Map<string, string>; conditionalFieldIds: Set<string> }> {
  const topLevelFields = await prisma.dimField.findMany({
    where: { classification: "GLOBAL", parentFieldId: null },
    select: { id: true, englishName: true },
  });
  const topLevel = new Map(topLevelFields.map((f) => [f.englishName, f.id]));

  const educationFieldId = topLevel.get("Educational Attainment");
  const educationSubfields = new Map<string, string>();
  if (educationFieldId) {
    const children = await prisma.dimField.findMany({ where: { parentFieldId: educationFieldId }, select: { id: true, englishName: true } });
    for (const child of children) educationSubfields.set(child.englishName, child.id);
  }

  // Fields with their own dynamicCondition (e.g. "Please Specify Occupation", only shown
  // when Occupation = Others) are only ever "presented" to a persona who actually triggers
  // that condition — none of these personas pick "Others", so it must stay fully absent
  // (PENDING, not NOT_ELIGIBLE) for all of them, not get a premature null row. See
  // evaluateLeafNode's hasOwnProperty check (benefitEligibility.service.ts) for why that
  // distinction matters.
  const conditionGroups = await prisma.fctDynamicRuleGroup.findMany({
    where: { fieldId: { in: [...topLevel.values()] }, parentRuleGroupId: null },
    select: { fieldId: true },
  });
  const conditionalFieldIds = new Set(conditionGroups.map((g) => g.fieldId));

  return { topLevel, educationSubfields, conditionalFieldIds };
}

async function seedPersonaAnswers(
  userId: string,
  persona: PersonaDef,
  fieldMap: { topLevel: Map<string, string>; educationSubfields: Map<string, string>; conditionalFieldIds: Set<string> },
): Promise<void> {
  const submittable: SubmitFieldAnswerInput[] = [];
  const rawWrites: { fieldId: string; value: string }[] = [];

  // First/Middle/Last Name and Email Address always mirror the account's own identity
  // fields (exactly what a real eGov/Google sync would produce) — derived here instead of
  // duplicated into every persona's `answers` map by hand.
  const allAnswers: PersonaDef["answers"] = {
    "First Name": persona.firstName,
    "Middle Name": persona.middleName,
    "Last Name": persona.lastName,
    "Email Address": persona.email,
    ...persona.answers,
  };

  for (const [englishName, value] of Object.entries(allAnswers)) {
    const fieldId = fieldMap.topLevel.get(englishName);
    if (!fieldId) {
      console.warn(`⚠️ Demo persona "${persona.email}" — unknown field "${englishName}", skipping.`);
      continue;
    }
    if (COUNTRY_BACKED_FIELDS.has(englishName) && value !== null) {
      rawWrites.push({ fieldId, value: String(value) });
    } else {
      submittable.push({ fieldId, value });
    }
  }

  // Every OTHER top-level GLOBAL field not explicitly listed for this persona still gets
  // its own null-valued row — "asked, left blank" (see evaluateLeafNode's hasOwnProperty
  // check), not "never asked at all". Skips fields already handled above (explicit value or
  // explicit null), the REPEATER_GROUP field itself (handled separately below), and any
  // conditionally-visible field (e.g. "Please Specify Occupation") this persona never
  // actually triggered — those must stay fully absent, not null (see resolveGlobalFieldMap).
  const handledFieldIds = new Set([...submittable.map((s) => s.fieldId), ...rawWrites.map((r) => r.fieldId)]);
  const educationFieldId = fieldMap.topLevel.get("Educational Attainment");
  for (const fieldId of fieldMap.topLevel.values()) {
    if (fieldId === educationFieldId || handledFieldIds.has(fieldId) || fieldMap.conditionalFieldIds.has(fieldId)) continue;
    submittable.push({ fieldId, value: null });
  }

  await submitFieldAnswers(userId, submittable);

  for (const { fieldId, value } of rawWrites) {
    const existing = await prisma.fctUserFieldAnswer.findFirst({ where: { userId, fieldId, repeaterGroupId: null } });
    if (existing) {
      await prisma.fctUserFieldAnswer.update({ where: { id: existing.id }, data: { field_value: value, updatedById: userId } });
    } else {
      await prisma.fctUserFieldAnswer.create({ data: { userId, fieldId, repeaterGroupId: null, field_value: value, createdById: userId } });
    }
  }

  if (persona.education && educationFieldId) {
    const existingGroups = await fetchAnswerGroups(userId, educationFieldId);
    const group = existingGroups[0] ?? (await createAnswerGroup(userId, educationFieldId));

    const subfieldAnswers: SubmitFieldAnswerInput[] = [];
    for (const [englishName, value] of Object.entries(persona.education)) {
      const subfieldId = fieldMap.educationSubfields.get(englishName);
      if (!subfieldId) {
        console.warn(`⚠️ Demo persona "${persona.email}" — unknown Educational Attainment subfield "${englishName}", skipping.`);
        continue;
      }
      subfieldAnswers.push({ fieldId: subfieldId, value, repeaterGroupId: group.id });
    }
    // "Educational Background" has no seeded options yet (see profileFields.data.ts) — no
    // valid value exists to select, so it's always left null, same as every persona above.
    const educationalBackgroundId = fieldMap.educationSubfields.get("Educational Background");
    if (educationalBackgroundId && !subfieldAnswers.some((a) => a.fieldId === educationalBackgroundId)) {
      subfieldAnswers.push({ fieldId: educationalBackgroundId, value: null, repeaterGroupId: group.id });
    }

    await submitFieldAnswers(userId, subfieldAnswers);
  }
}

async function seedDemoPersonas(): Promise<void> {
  console.log("Seeding demo USER personas with pre-filled eGov/global answers...");

  const fieldMap = await resolveGlobalFieldMap();
  if (fieldMap.topLevel.size === 0) {
    console.log("Skipped demo personas — no GLOBAL fields found (run profileFieldSeeder first).");
    return;
  }

  for (const persona of personas) {
    const user = await prisma.dimUser.upsert({
      where: { email: persona.email },
      update: {
        firstName: persona.firstName,
        middleName: persona.middleName,
        lastName: persona.lastName,
      },
      create: {
        username: persona.username,
        email: persona.email,
        firstName: persona.firstName,
        middleName: persona.middleName,
        lastName: persona.lastName,
        role: UserRole.USER,
        scopeId: null,
        groupId: null,
        psgcCode: null,
        // No passHash — these are Google-SSO-only demo accounts (see auth.service.ts's
        // loginWithGoogle, which now binds a real Google sign-in to this row by email).
      },
    });

    await seedPersonaAnswers(user.id, persona, fieldMap);
    console.log(`  "${persona.firstName} ${persona.lastName}" (${persona.email}) ready.`);
  }

  console.log(`Demo personas synchronized (${personas.length} accounts).`);
}

// A Carmona (city-level) agent and a reasserted Superadmin — self-contained on top of
// userRoleSeeder.ts's own accounts, so this factory can seed a full usable demo cast (an
// agent who can actually see the Student persona above under the Benefit module's
// scope-visibility rule — see benefitLocation.service.ts's isBenefitVisibleToScope) even if
// run on its own.
async function seedDemoAdminAndAgent(): Promise<void> {
  console.log("Seeding demo Superadmin/Agent accounts...");

  const devPassHash = await hashPassword("password123");
  const scopes = await prisma.dimScope.findMany();
  const scopeIdByValue = Object.fromEntries(scopes.map((s) => [s.value, s.id]));

  await prisma.dimUser.upsert({
    where: { email: "superadmin@juanclaimed.com" },
    update: { passHash: devPassHash },
    create: {
      username: "superadmin_main",
      email: "superadmin@juanclaimed.com",
      firstName: "System",
      lastName: "Administrator",
      role: UserRole.SUPERADMIN,
      scopeId: scopeIdByValue["SUPERADMIN"],
      psgcCode: "SUPERADMIN",
      passHash: devPassHash,
    },
  });

  const citiesScopeId = scopeIdByValue["CITIES-MUNICIPALITIES"];
  if (citiesScopeId) {
    await prisma.dimUser.upsert({
      where: { email: "agent.carmona@juanclaimed.com" },
      update: { passHash: devPassHash },
      create: {
        username: "agent_city_carmona",
        email: "agent.carmona@juanclaimed.com",
        firstName: "Carmona",
        lastName: "Agent",
        role: UserRole.AGENT,
        scopeId: citiesScopeId,
        groupId: null,
        psgcCode: "042104000", // Carmona, Cavite (city level)
        passHash: devPassHash,
      },
    });
  } else {
    console.log('Skipped Carmona agent — "CITIES-MUNICIPALITIES" scope not seeded yet.');
  }

  console.log("Demo Superadmin/Agent accounts ready (password: password123).");
}

export async function seedDemoData(): Promise<void> {
  await seedDemoAdminAndAgent();
  await seedDemoPersonas();
}
