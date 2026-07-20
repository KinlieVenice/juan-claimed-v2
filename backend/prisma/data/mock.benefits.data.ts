// prisma/data/mock.benefits.data.ts
// Declarative mock data consumed by prisma/factories/benefitFieldFactory.ts.
// Rule leaves reference fields by their short def-level `key` — resolved in-memory by
// benefitFieldFactory.ts via fieldIdMap, distinct from the actual DB `key` column (which
// is now the normalized form of englishName, see toSnakeCaseKey — englishName must be
// globally unique, so a field can't be duplicated verbatim across benefits; promote it to
// globalFields instead, as done for "Employment Status"/"Unemployment Duration"). REPEATER_GROUP
// mini-tree leaves (RepeaterRuleNode) reference a repeater's child fields the same way,
// via "<repeaterFieldKey>.<childKey>" (e.g. "children.birthDate").

export interface FieldOptionDef {
  value: string;
  englishName: string;
  tagalogName: string;
  englishDescription: string;
  tagalogDescription: string;
}

export interface FieldDef {
  key: string;
  englishName: string;
  tagalogName: string;
  englishDescription: string;
  tagalogDescription: string;
  inputType: string;
  classification?: "GLOBAL" | "FOLLOW_UP";
  required?: boolean;
  hierarchy?: boolean;
  options?: FieldOptionDef[];
  // REPEATER_GROUP only. Children must NOT themselves be REPEATER_GROUP
  // (no nested repeater groups) — fieldFactory.ts enforces this at runtime.
  children?: FieldDef[];
}

export type RuleNode =
  | { kind: "condition"; fieldKey: string; operator: string; value: unknown }
  | { kind: "group"; logicalOperator: "ALL" | "ANY"; children: RuleNode[] };

export type RuleGroupNode = Extract<RuleNode, { kind: "group" }>;

// REPEATER_GROUP's ANY_MATCH/ALL_MATCH `value` shape: a single-root mini rule-group
// tree evaluated per repeater row (see condition.util.ts's evaluateRepeaterGroup).
// Leaves reference a repeater CHILD field by its dotted def-key path (e.g.
// "children.birthDate", relative to the repeater field itself) — benefitFieldFactory.ts
// resolves these to real DimField ids at population time, same as top-level fieldKey refs.
export type RepeaterRuleNode =
  | { fieldKey: string; inputType: string; operator: string; conditionFieldValue: unknown }
  | { logicalOperator: "ALL" | "ANY"; conditions: RepeaterRuleNode[] };

export interface BenefitDef {
  slug: string;
  name: string;
  englishDescription: string;
  tagalogDescription: string;
  scopeValue: string;
  fields: FieldDef[];
  rule: RuleGroupNode;
}

// Shared GLOBAL fields — created once, reused (by field key) across every benefit below.
export const globalFields: FieldDef[] = [
  {
    key: "birthDate",
    englishName: "Date of Birth",
    tagalogName: "Petsa ng Kapanganakan",
    englishDescription: "Applicant's date of birth, used for age-based eligibility checks.",
    tagalogDescription: "Applicant's date of birth, used for age-based eligibility checks.",
    inputType: "DATE",
    classification: "GLOBAL",
  },
  {
    key: "monthlyHouseholdIncome",
    englishName: "Monthly Household Income",
    tagalogName: "Buwanang Kita ng Sambahayan",
    englishDescription: "Total monthly income of the applicant's household, in PHP.",
    tagalogDescription: "Total monthly income of the applicant's household, in PHP.",
    inputType: "MONEY",
    classification: "GLOBAL",
  },
  {
    key: "householdSize",
    englishName: "Household Size",
    tagalogName: "Bilang ng Miyembro ng Sambahayan",
    englishDescription: "Number of people living in the applicant's household.",
    tagalogDescription: "Number of people living in the applicant's household.",
    inputType: "NUMBER",
    classification: "GLOBAL",
  },
  {
    key: "isFilipinoCitizen",
    englishName: "Is Filipino Citizen",
    tagalogName: "Filipino Mamamayan",
    englishDescription: "Whether the applicant is a Filipino citizen.",
    tagalogDescription: "Whether the applicant is a Filipino citizen.",
    inputType: "BOOLEAN",
    classification: "GLOBAL",
  },
  {
    key: "residenceLocation",
    englishName: "Residence Location",
    tagalogName: "Lokasyon ng Tirahan",
    englishDescription: "Applicant's current region/province/city of residence.",
    tagalogDescription: "Applicant's current region/province/city of residence.",
    inputType: "HIERARCHY_SELECT",
    classification: "GLOBAL",
    hierarchy: true,
  },
  // Shared across PWD Assistance and Unemployment Assistance — englishName must be
  // globally unique now (see toSnakeCaseKey), so a field can't be duplicated per-benefit.
  {
    key: "employmentStatus",
    englishName: "Employment Status",
    tagalogName: "Katayuan sa Trabaho",
    englishDescription: "Applicant's current employment status.",
    tagalogDescription: "Applicant's current employment status.",
    inputType: "SINGLE_SELECT",
    classification: "GLOBAL",
    options: [
      { value: "EMPLOYED", englishName: "Employed", tagalogName: "May Trabaho", englishDescription: "Currently employed.", tagalogDescription: "Kasalukuyang may trabaho." },
      { value: "UNEMPLOYED", englishName: "Unemployed", tagalogName: "Walang Trabaho", englishDescription: "Currently unemployed.", tagalogDescription: "Kasalukuyang walang trabaho." },
      { value: "SELF_EMPLOYED", englishName: "Self-Employed", tagalogName: "Nagsasariling Hanapbuhay", englishDescription: "Runs own livelihood.", tagalogDescription: "May sariling hanapbuhay." },
    ],
  },
  {
    key: "unemploymentDuration",
    englishName: "Unemployment Duration",
    tagalogName: "Tagal ng Kawalan ng Trabaho",
    englishDescription: "How long the applicant has been unemployed, if applicable.",
    tagalogDescription: "How long the applicant has been unemployed, if applicable.",
    inputType: "DURATION",
    classification: "GLOBAL",
  },
];

export const benefits: BenefitDef[] = [
  {
    slug: "senior-citizen-pension",
    name: "Senior Citizen Pension",
    englishDescription: "Monthly financial assistance for indigent senior citizens.",
    tagalogDescription: "Buwanang tulong pinansyal para sa mga maralitang senior citizen.",
    scopeValue: "NATIONAL",
    fields: [
      {
        key: "civilStatus",
        englishName: "Civil Status",
        tagalogName: "Katayuang Sibil",
        englishDescription: "Applicant's current civil status.",
        tagalogDescription: "Applicant's current civil status.",
        inputType: "SINGLE_SELECT",
        options: [
          { value: "SINGLE", englishName: "Single", tagalogName: "Walang Asawa", englishDescription: "Never married.", tagalogDescription: "Hindi pa kasal." },
          { value: "MARRIED", englishName: "Married", tagalogName: "Kasal", englishDescription: "Currently married.", tagalogDescription: "Kasalukuyang kasal." },
          { value: "WIDOWED", englishName: "Widowed", tagalogName: "Balo", englishDescription: "Spouse has passed away.", tagalogDescription: "Yumao na ang asawa." },
          { value: "SEPARATED", englishName: "Separated", tagalogName: "Hiwalay", englishDescription: "Separated from spouse.", tagalogDescription: "Hiwalay sa asawa." },
        ],
      },
      {
        key: "dependents",
        englishName: "Dependents",
        tagalogName: "Mga Dependent",
        englishDescription: "List of dependents living with the applicant.",
        tagalogDescription: "List of dependents living with the applicant.",
        inputType: "REPEATER_GROUP",
        children: [
          {
            key: "birthDate",
            englishName: "Dependent's Date of Birth",
            tagalogName: "Petsa ng Kapanganakan ng Dependent",
            englishDescription: "Date of birth of this dependent.",
            tagalogDescription: "Date of birth of this dependent.",
            inputType: "DATE",
          },
          {
            key: "relationship",
            englishName: "Relationship to Applicant",
            tagalogName: "Kaugnayan sa Aplikante",
            englishDescription: "How this dependent is related to the applicant.",
            tagalogDescription: "How this dependent is related to the applicant.",
            inputType: "SINGLE_SELECT",
            options: [
              { value: "CHILD", englishName: "Child", tagalogName: "Anak", englishDescription: "Applicant's child.", tagalogDescription: "Anak ng aplikante." },
              { value: "SPOUSE", englishName: "Spouse", tagalogName: "Asawa", englishDescription: "Applicant's spouse.", tagalogDescription: "Asawa ng aplikante." },
              { value: "GRANDCHILD", englishName: "Grandchild", tagalogName: "Apo", englishDescription: "Applicant's grandchild.", tagalogDescription: "Apo ng aplikante." },
              { value: "OTHER", englishName: "Other", tagalogName: "Iba Pa", englishDescription: "Other relationship.", tagalogDescription: "Ibang uri ng kaugnayan." },
            ],
          },
        ],
      },
    ],
    rule: {
      kind: "group",
      logicalOperator: "ALL",
      children: [
        { kind: "condition", fieldKey: "birthDate", operator: "AGE_GREATER_THAN_EQUAL", value: { value: 60, unit: "years" } },
        { kind: "condition", fieldKey: "isFilipinoCitizen", operator: "EQUALS", value: true },
        {
          kind: "group",
          logicalOperator: "ANY",
          children: [
            { kind: "condition", fieldKey: "monthlyHouseholdIncome", operator: "LESS_THAN_EQUAL", value: 15000 },
            {
              kind: "group",
              logicalOperator: "ANY",
              children: [
                { kind: "condition", fieldKey: "civilStatus", operator: "EQUALS", value: "WIDOWED" },
                { kind: "condition", fieldKey: "civilStatus", operator: "EQUALS", value: "SEPARATED" },
              ],
            },
          ],
        },
      ],
    },
  },

  {
    slug: "pwd-assistance",
    name: "PWD Assistance Program",
    englishDescription: "Financial assistance for persons with disability (PWD) from low-income or unemployed households.",
    tagalogDescription: "Tulong pinansyal para sa mga taong may kapansanan (PWD) mula sa mababang-kita o walang-trabahong sambahayan.",
    scopeValue: "NATIONAL",
    fields: [
      {
        key: "hasPwdId",
        englishName: "Has PWD ID",
        tagalogName: "May PWD ID",
        englishDescription: "Whether the applicant holds a valid PWD identification card.",
        tagalogDescription: "Whether the applicant holds a valid PWD identification card.",
        inputType: "BOOLEAN",
      },
      {
        key: "disabilityType",
        englishName: "Disability Type",
        tagalogName: "Uri ng Kapansanan",
        englishDescription: "The primary type of disability of the applicant.",
        tagalogDescription: "The primary type of disability of the applicant.",
        inputType: "SINGLE_SELECT",
        options: [
          { value: "VISUAL", englishName: "Visual", tagalogName: "Panglalawagan", englishDescription: "Visual impairment.", tagalogDescription: "Kapansanan sa paningin." },
          { value: "HEARING", englishName: "Hearing", tagalogName: "Pandinig", englishDescription: "Hearing impairment.", tagalogDescription: "Kapansanan sa pandinig." },
          { value: "PHYSICAL", englishName: "Physical", tagalogName: "Pisikal", englishDescription: "Physical/orthopedic disability.", tagalogDescription: "Kapansanang pisikal." },
          { value: "INTELLECTUAL", englishName: "Intellectual", tagalogName: "Intelektwal", englishDescription: "Intellectual disability.", tagalogDescription: "Kapansanang intelektwal." },
          { value: "PSYCHOSOCIAL", englishName: "Psychosocial", tagalogName: "Sikososyal", englishDescription: "Psychosocial disability.", tagalogDescription: "Kapansanang sikososyal." },
        ],
      },
    ],
    rule: {
      kind: "group",
      logicalOperator: "ALL",
      children: [
        { kind: "condition", fieldKey: "hasPwdId", operator: "EQUALS", value: true },
        {
          kind: "group",
          logicalOperator: "ANY",
          children: [
            { kind: "condition", fieldKey: "monthlyHouseholdIncome", operator: "LESS_THAN_EQUAL", value: 20000 },
            {
              kind: "group",
              logicalOperator: "ALL",
              children: [
                { kind: "condition", fieldKey: "employmentStatus", operator: "EQUALS", value: "UNEMPLOYED" },
                { kind: "condition", fieldKey: "unemploymentDuration", operator: "GREATER_THAN", value: { value: 6, unit: "months" } },
              ],
            },
          ],
        },
      ],
    },
  },

  {
    slug: "solo-parent-support",
    name: "Solo Parent Support Program",
    englishDescription: "Assistance for solo parents raising minor dependents on a low household income.",
    tagalogDescription: "Tulong para sa mga solo parent na nag-aalaga ng menor-de-edad na dependent na may mababang kita.",
    scopeValue: "NATIONAL",
    fields: [
      {
        key: "isSoloParent",
        englishName: "Is Solo Parent",
        tagalogName: "Solo Parent",
        englishDescription: "Whether the applicant is a registered solo parent.",
        tagalogDescription: "Whether the applicant is a registered solo parent.",
        inputType: "BOOLEAN",
      },
      {
        key: "remarks",
        englishName: "Additional Remarks",
        tagalogName: "Karagdagang Puna",
        englishDescription: "Optional free-text remarks from the applicant.",
        tagalogDescription: "Optional free-text remarks from the applicant.",
        inputType: "TEXT",
        required: false,
      },
      {
        key: "children",
        englishName: "Children",
        tagalogName: "Mga Anak",
        englishDescription: "List of the applicant's children.",
        tagalogDescription: "List of the applicant's children.",
        inputType: "REPEATER_GROUP",
        children: [
          {
            key: "birthDate",
            englishName: "Child's Date of Birth",
            tagalogName: "Petsa ng Kapanganakan ng Anak",
            englishDescription: "Date of birth of this child.",
            tagalogDescription: "Date of birth of this child.",
            inputType: "DATE",
          },
        ],
      },
    ],
    rule: {
      kind: "group",
      logicalOperator: "ALL",
      children: [
        { kind: "condition", fieldKey: "isSoloParent", operator: "EQUALS", value: true },
        { kind: "condition", fieldKey: "monthlyHouseholdIncome", operator: "LESS_THAN_EQUAL", value: 18000 },
        {
          kind: "condition",
          fieldKey: "children",
          operator: "ANY_MATCH",
          value: [
            {
              logicalOperator: "ALL",
              conditions: [
                { fieldKey: "children.birthDate", inputType: "DATE", operator: "AGE_LESS_THAN", conditionFieldValue: { value: 18, unit: "years" } },
              ],
            },
          ] satisfies RepeaterRuleNode[],
        },
      ],
    },
  },

  {
    slug: "unemployment-assistance",
    name: "Unemployment Assistance Program",
    englishDescription: "Temporary financial assistance for working-age Filipinos who recently lost employment.",
    tagalogDescription: "Pansamantalang tulong pinansyal para sa mga Pilipinong nasa edad-paggawa na kararaos lamang mawalan ng trabaho.",
    scopeValue: "NATIONAL",
    fields: [
      {
        key: "isFirstTimeApplicant",
        englishName: "Is First-Time Applicant",
        tagalogName: "Unang Beses na Aplikante",
        englishDescription: "Whether this is the applicant's first time applying for this program.",
        tagalogDescription: "Whether this is the applicant's first time applying for this program.",
        inputType: "BOOLEAN",
      },
      {
        key: "vulnerabilityTags",
        englishName: "Vulnerability Tags",
        tagalogName: "Mga Katangiang Bulnerable",
        englishDescription: "Any additional vulnerability classifications that apply to the applicant.",
        tagalogDescription: "Any additional vulnerability classifications that apply to the applicant.",
        inputType: "MULTI_SELECT",
        options: [
          { value: "SOLO_PARENT", englishName: "Solo Parent", tagalogName: "Solo Parent", englishDescription: "Registered solo parent.", tagalogDescription: "Rehistradong solo parent." },
          { value: "PWD", englishName: "PWD", tagalogName: "PWD", englishDescription: "Person with disability.", tagalogDescription: "Taong may kapansanan." },
          { value: "INDIGENOUS", englishName: "Indigenous Person", tagalogName: "Katutubo", englishDescription: "Member of an indigenous community.", tagalogDescription: "Kasapi ng katutubong pamayanan." },
          { value: "SENIOR", englishName: "Senior Citizen", tagalogName: "Senior Citizen", englishDescription: "Senior citizen.", tagalogDescription: "Senior citizen." },
          { value: "PREGNANT", englishName: "Pregnant", tagalogName: "Buntis", englishDescription: "Currently pregnant.", tagalogDescription: "Kasalukuyang buntis." },
        ],
      },
    ],
    rule: {
      kind: "group",
      logicalOperator: "ALL",
      children: [
        { kind: "condition", fieldKey: "employmentStatus", operator: "EQUALS", value: "UNEMPLOYED" },
        { kind: "condition", fieldKey: "unemploymentDuration", operator: "GREATER_THAN", value: { value: 1, unit: "months" } },
        { kind: "condition", fieldKey: "birthDate", operator: "AGE_BETWEEN", value: { min: 18, max: 59, unit: "years" } },
        { kind: "condition", fieldKey: "householdSize", operator: "GREATER_THAN_EQUAL", value: 1 },
        {
          kind: "group",
          logicalOperator: "ANY",
          children: [
            { kind: "condition", fieldKey: "isFirstTimeApplicant", operator: "EQUALS", value: true },
            { kind: "condition", fieldKey: "monthlyHouseholdIncome", operator: "LESS_THAN_EQUAL", value: 12000 },
            { kind: "condition", fieldKey: "vulnerabilityTags", operator: "IN", value: ["SOLO_PARENT", "PWD"] },
          ],
        },
      ],
    },
  },

  {
    slug: "educational-subsidy",
    name: "Educational Subsidy Program",
    englishDescription: "Subsidy for indigent households with children currently enrolled in school.",
    tagalogDescription: "Subsidyo para sa maralitang sambahayan na may mga anak na kasalukuyang nag-aaral.",
    scopeValue: "NATIONAL",
    fields: [
      {
        key: "isRegisteredIndigent",
        englishName: "Is Registered Indigent",
        tagalogName: "Nakarehistrong Maralita",
        englishDescription: "Whether the household is registered as indigent (e.g. under the National Household Targeting System).",
        tagalogDescription: "Whether the household is registered as indigent (e.g. under the National Household Targeting System).",
        inputType: "BOOLEAN",
      },
      {
        key: "childrenInSchool",
        englishName: "Children in School",
        tagalogName: "Mga Anak na Nag-aaral",
        englishDescription: "List of the applicant's school-age children.",
        tagalogDescription: "List of the applicant's school-age children.",
        inputType: "REPEATER_GROUP",
        children: [
          {
            key: "birthDate",
            englishName: "Student's Date of Birth",
            tagalogName: "Petsa ng Kapanganakan ng Mag-aaral",
            englishDescription: "Date of birth of this child.",
            tagalogDescription: "Date of birth of this child.",
            inputType: "DATE",
          },
          {
            key: "enrollmentStatus",
            englishName: "Currently Enrolled",
            tagalogName: "Kasalukuyang Naka-enroll",
            englishDescription: "Whether this child is currently enrolled in school.",
            tagalogDescription: "Whether this child is currently enrolled in school.",
            inputType: "BOOLEAN",
          },
        ],
      },
    ],
    rule: {
      kind: "group",
      logicalOperator: "ALL",
      children: [
        { kind: "condition", fieldKey: "monthlyHouseholdIncome", operator: "LESS_THAN_EQUAL", value: 10000 },
        {
          kind: "condition",
          fieldKey: "childrenInSchool",
          operator: "ANY_MATCH",
          value: [
            {
              logicalOperator: "ALL",
              conditions: [
                { fieldKey: "childrenInSchool.enrollmentStatus", inputType: "BOOLEAN", operator: "EQUALS", conditionFieldValue: true },
              ],
            },
          ] satisfies RepeaterRuleNode[],
        },
        {
          kind: "group",
          logicalOperator: "ANY",
          children: [
            { kind: "condition", fieldKey: "isRegisteredIndigent", operator: "EQUALS", value: true },
            { kind: "condition", fieldKey: "residenceLocation", operator: "BELONGS_TO", value: "MANILA" },
          ],
        },
      ],
    },
  },
];
