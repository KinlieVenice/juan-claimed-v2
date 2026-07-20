import type {
  DimField,
  DimFieldConditionOperator,
  DimFieldHierarchy,
  DimFieldInputType,
  DimFieldOption,
} from "@/types/domain";

export const inputTypes: Record<string, DimFieldInputType> = {
  TEXT: { id: "it-text", englishName: "Text", tagalogName: "Teksto", value: "TEXT" },
  NUMBER: { id: "it-number", englishName: "Number", tagalogName: "Numero", value: "NUMBER" },
  MONEY: { id: "it-money", englishName: "Currency / Money", tagalogName: "Pera", value: "MONEY" },
  DATE: { id: "it-date", englishName: "Date", tagalogName: "Petsa", value: "DATE" },
  BOOLEAN: { id: "it-boolean", englishName: "Yes/No", tagalogName: "Oo/Hindi", value: "BOOLEAN" },
  SINGLE_SELECT: { id: "it-single", englishName: "Single Selection", tagalogName: "Isang Pagpili", value: "SINGLE_SELECT" },
  MULTI_SELECT: { id: "it-multi", englishName: "Multiple Selection", tagalogName: "Maramihang Pagpili", value: "MULTI_SELECT" },
  HIERARCHY_SELECT: { id: "it-hierarchy", englishName: "Hierarchical Selection", tagalogName: "Hierarchical na Pagpili", value: "HIERARCHY_SELECT" },
  DURATION: { id: "it-duration", englishName: "Duration", tagalogName: "Tagal", value: "DURATION" },
  REPEATER_GROUP: { id: "it-repeater", englishName: "Repeater Group", tagalogName: "Umuulit na Grupo", value: "REPEATER_GROUP" },
};

export const conditionOperators: DimFieldConditionOperator[] = [
  { id: "op-text-equals", englishName: "Equals", tagalogName: "Katumbas", value: "EQUALS", fieldInputTypeId: inputTypes.TEXT.id },
  { id: "op-text-not-equals", englishName: "Not Equals", tagalogName: "Hindi Katumbas", value: "NOT_EQUALS", fieldInputTypeId: inputTypes.TEXT.id },
  { id: "op-text-contains", englishName: "Contains", tagalogName: "Naglalaman", value: "CONTAINS_SUBSTRING", fieldInputTypeId: inputTypes.TEXT.id },

  { id: "op-num-equals", englishName: "Equals", tagalogName: "Katumbas", value: "EQUALS", fieldInputTypeId: inputTypes.NUMBER.id },
  { id: "op-num-gt", englishName: "Greater Than", tagalogName: "Higit Sa", value: "GREATER_THAN", fieldInputTypeId: inputTypes.NUMBER.id },
  { id: "op-num-lt", englishName: "Less Than", tagalogName: "Mas Mababa Sa", value: "LESS_THAN", fieldInputTypeId: inputTypes.NUMBER.id },
  { id: "op-num-gte", englishName: "Greater Than or Equal", tagalogName: "Higit Sa o Katumbas", value: "GREATER_THAN_EQUAL", fieldInputTypeId: inputTypes.NUMBER.id },
  { id: "op-num-lte", englishName: "Less Than or Equal", tagalogName: "Mas Mababa o Katumbas", value: "LESS_THAN_EQUAL", fieldInputTypeId: inputTypes.NUMBER.id },
  { id: "op-num-between", englishName: "Between", tagalogName: "Sa Pagitan", value: "BETWEEN", fieldInputTypeId: inputTypes.NUMBER.id },

  { id: "op-money-equals", englishName: "Equals", tagalogName: "Katumbas", value: "EQUALS", fieldInputTypeId: inputTypes.MONEY.id },
  { id: "op-money-gte", englishName: "Greater Than or Equal", tagalogName: "Higit Sa o Katumbas", value: "GREATER_THAN_EQUAL", fieldInputTypeId: inputTypes.MONEY.id },
  { id: "op-money-lte", englishName: "Less Than or Equal", tagalogName: "Mas Mababa o Katumbas", value: "LESS_THAN_EQUAL", fieldInputTypeId: inputTypes.MONEY.id },
  { id: "op-money-between", englishName: "Between", tagalogName: "Sa Pagitan", value: "BETWEEN", fieldInputTypeId: inputTypes.MONEY.id },

  { id: "op-date-before", englishName: "Before", tagalogName: "Bago", value: "BEFORE", fieldInputTypeId: inputTypes.DATE.id },
  { id: "op-date-after", englishName: "After", tagalogName: "Pagkatapos", value: "AFTER", fieldInputTypeId: inputTypes.DATE.id },
  { id: "op-date-age-gte", englishName: "Age Greater Than or Equal", tagalogName: "Edad Higit Sa o Katumbas", value: "AGE_GREATER_THAN_EQUAL", fieldInputTypeId: inputTypes.DATE.id },
  { id: "op-date-age-lte", englishName: "Age Less Than or Equal", tagalogName: "Edad Mas Mababa o Katumbas", value: "AGE_LESS_THAN_EQUAL", fieldInputTypeId: inputTypes.DATE.id },
  { id: "op-date-age-between", englishName: "Age Between", tagalogName: "Edad sa Pagitan", value: "AGE_BETWEEN", fieldInputTypeId: inputTypes.DATE.id },

  { id: "op-bool-equals", englishName: "Equals", tagalogName: "Katumbas", value: "EQUALS", fieldInputTypeId: inputTypes.BOOLEAN.id },

  { id: "op-single-equals", englishName: "Equals", tagalogName: "Katumbas", value: "EQUALS", fieldInputTypeId: inputTypes.SINGLE_SELECT.id },
  { id: "op-single-not-equals", englishName: "Not Equals", tagalogName: "Hindi Katumbas", value: "NOT_EQUALS", fieldInputTypeId: inputTypes.SINGLE_SELECT.id },

  { id: "op-multi-in", englishName: "In", tagalogName: "Kabilang Sa", value: "IN", fieldInputTypeId: inputTypes.MULTI_SELECT.id },
  { id: "op-multi-not-in", englishName: "Not In", tagalogName: "Hindi Kabilang Sa", value: "NOT_IN", fieldInputTypeId: inputTypes.MULTI_SELECT.id },

  { id: "op-hier-belongs-to", englishName: "Belongs To", tagalogName: "Kabilang Sa", value: "BELONGS_TO", fieldInputTypeId: inputTypes.HIERARCHY_SELECT.id },
  { id: "op-hier-equals", englishName: "Equals", tagalogName: "Katumbas", value: "EQUALS", fieldInputTypeId: inputTypes.HIERARCHY_SELECT.id },

  { id: "op-dur-gt", englishName: "Greater Than", tagalogName: "Higit Sa", value: "GREATER_THAN", fieldInputTypeId: inputTypes.DURATION.id },
  { id: "op-dur-lt", englishName: "Less Than", tagalogName: "Mas Mababa Sa", value: "LESS_THAN", fieldInputTypeId: inputTypes.DURATION.id },
  { id: "op-dur-gte", englishName: "Greater Than or Equal", tagalogName: "Higit Sa o Katumbas", value: "GREATER_THAN_EQUAL", fieldInputTypeId: inputTypes.DURATION.id },
  { id: "op-dur-lte", englishName: "Less Than or Equal", tagalogName: "Mas Mababa o Katumbas", value: "LESS_THAN_EQUAL", fieldInputTypeId: inputTypes.DURATION.id },
];

export const hierarchies: DimFieldHierarchy[] = [
  {
    id: "hier-location",
    key: null,
    englishName: "Philippine Location",
    tagalogName: "Lokasyon sa Pilipinas",
    fieldHierarchyLevels: [
      { id: "hl-1", fieldHierarchyId: "hier-location", level: 1, englishName: "Region", tagalogName: "Rehiyon" },
      { id: "hl-2", fieldHierarchyId: "hier-location", level: 2, englishName: "City / Municipality", tagalogName: "Lungsod / Munisipyo" },
      { id: "hl-3", fieldHierarchyId: "hier-location", level: 3, englishName: "Barangay", tagalogName: "Barangay" },
    ],
    fieldHierarchyNodes: [
      { id: "hn-ncr", fieldHierarchyId: "hier-location", parentNodeId: null, englishName: "NCR", tagalogName: "NCR", value: "NCR", sortOrder: 0 },
      { id: "hn-manila", fieldHierarchyId: "hier-location", parentNodeId: "hn-ncr", englishName: "Manila", tagalogName: "Maynila", value: "MANILA", sortOrder: 0 },
      { id: "hn-ermita", fieldHierarchyId: "hier-location", parentNodeId: "hn-manila", englishName: "Ermita", tagalogName: "Ermita", value: "ERMITA", sortOrder: 0 },
      { id: "hn-malate", fieldHierarchyId: "hier-location", parentNodeId: "hn-manila", englishName: "Malate", tagalogName: "Malate", value: "MALATE", sortOrder: 1 },
      { id: "hn-qc", fieldHierarchyId: "hier-location", parentNodeId: "hn-ncr", englishName: "Quezon City", tagalogName: "Lungsod Quezon", value: "QUEZON_CITY", sortOrder: 1 },
      { id: "hn-diliman", fieldHierarchyId: "hier-location", parentNodeId: "hn-qc", englishName: "Diliman", tagalogName: "Diliman", value: "DILIMAN", sortOrder: 0 },
      { id: "hn-cavite", fieldHierarchyId: "hier-location", parentNodeId: null, englishName: "Region IV-A (CALABARZON)", tagalogName: "Rehiyon IV-A", value: "REGION_4A", sortOrder: 1 },
      { id: "hn-dasma", fieldHierarchyId: "hier-location", parentNodeId: "hn-cavite", englishName: "Dasmariñas", tagalogName: "Dasmariñas", value: "DASMARINAS", sortOrder: 0 },
      { id: "hn-salawag", fieldHierarchyId: "hier-location", parentNodeId: "hn-dasma", englishName: "Salawag", tagalogName: "Salawag", value: "SALAWAG", sortOrder: 0 },
    ],
  },
];

// --- Fields ---------------------------------------------------------------

const f = (
  partial: Omit<DimField, "fieldInputType" | "configJson" | "dynamicCondition" | "eGovField" | "anchorFieldId"> & { eGovField?: boolean; anchorFieldId?: string | null },
): DimField => ({
  ...partial,
  // Mirrors the real seeder's rule: eGovField defaults to whatever `default` is, unless
  // explicitly overridden (e.g. a default-but-not-eGov field like Occupation).
  eGovField: partial.eGovField ?? partial.default,
  anchorFieldId: partial.anchorFieldId ?? null,
  configJson: null,
  dynamicCondition: null,
  fieldInputType: Object.values(inputTypes).find((t) => t.id === partial.fieldInputTypeId)!,
});

export const fields: DimField[] = [
  // PROFILE fields — GLOBAL, not used as eligibility comparators, eGovPH-synced (locked)
  f({ id: "fld-first-name", key: "FIRST_NAME", englishName: "First Name", tagalogName: "Pangalan", englishDescription: "Legal first name.", tagalogDescription: "Legal first name.", classification: "GLOBAL", isProfileField: true, default: true, required: true, sortOrder: 0, fieldInputTypeId: inputTypes.TEXT.id, parentFieldId: null, fieldHierarchyId: null }),
  f({ id: "fld-last-name", key: "LAST_NAME", englishName: "Last Name", tagalogName: "Apelyido", englishDescription: "Legal last name.", tagalogDescription: "Legal last name.", classification: "GLOBAL", isProfileField: true, default: true, required: true, sortOrder: 1, fieldInputTypeId: inputTypes.TEXT.id, parentFieldId: null, fieldHierarchyId: null }),
  f({ id: "fld-address", key: "FULL_ADDRESS", englishName: "Full Address", tagalogName: "Buong Address", englishDescription: "Street, building, unit number.", tagalogDescription: "Street, building, unit number.", classification: "GLOBAL", isProfileField: true, default: true, required: true, sortOrder: 2, fieldInputTypeId: inputTypes.TEXT.id, parentFieldId: null, fieldHierarchyId: null }),

  // GLOBAL comparator fields
  f({ id: "fld-dob", key: "DATE_OF_BIRTH", englishName: "Date of Birth", tagalogName: "Petsa ng Kapanganakan", englishDescription: "Used to compute age-based eligibility.", tagalogDescription: "Used to compute age-based eligibility.", classification: "GLOBAL", default: true, required: true, sortOrder: 3, fieldInputTypeId: inputTypes.DATE.id, parentFieldId: null, fieldHierarchyId: null }),
  f({ id: "fld-income", key: "MONTHLY_HOUSEHOLD_INCOME", englishName: "Monthly Household Income", tagalogName: "Buwanang Kita ng Sambahayan", englishDescription: "Combined household income per month.", tagalogDescription: "Combined household income per month.", classification: "GLOBAL", default: false, required: true, sortOrder: 4, fieldInputTypeId: inputTypes.MONEY.id, parentFieldId: null, fieldHierarchyId: null }),
  f({ id: "fld-household-size", key: "HOUSEHOLD_SIZE", englishName: "Household Size", tagalogName: "Laki ng Sambahayan", englishDescription: "Number of people in the household.", tagalogDescription: "Number of people in the household.", classification: "GLOBAL", default: false, required: true, sortOrder: 5, fieldInputTypeId: inputTypes.NUMBER.id, parentFieldId: null, fieldHierarchyId: null }),
  f({ id: "fld-citizen", key: "IS_FILIPINO_CITIZEN", englishName: "Is Filipino Citizen", tagalogName: "Mamamayang Pilipino", englishDescription: "Confirms Filipino citizenship.", tagalogDescription: "Confirms Filipino citizenship.", classification: "GLOBAL", default: true, required: true, sortOrder: 6, fieldInputTypeId: inputTypes.BOOLEAN.id, parentFieldId: null, fieldHierarchyId: null }),
  f({ id: "fld-location", key: "RESIDENCE_LOCATION", englishName: "Residence Location", tagalogName: "Lugar ng Tirahan", englishDescription: "Region / city / barangay of residence.", tagalogDescription: "Region / city / barangay of residence.", classification: "GLOBAL", default: true, required: true, sortOrder: 7, fieldInputTypeId: inputTypes.HIERARCHY_SELECT.id, parentFieldId: null, fieldHierarchyId: "hier-location" }),
  f({ id: "fld-employment", key: "EMPLOYMENT_STATUS", englishName: "Employment Status", tagalogName: "Katayuan sa Trabaho", englishDescription: "Current employment status.", tagalogDescription: "Current employment status.", classification: "GLOBAL", default: false, required: true, sortOrder: 8, fieldInputTypeId: inputTypes.SINGLE_SELECT.id, parentFieldId: null, fieldHierarchyId: null }),
  f({ id: "fld-civil-status", key: "CIVIL_STATUS", englishName: "Civil Status", tagalogName: "Katayuang Sibil", englishDescription: "Current civil status.", tagalogDescription: "Current civil status.", classification: "GLOBAL", default: false, required: true, sortOrder: 9, fieldInputTypeId: inputTypes.SINGLE_SELECT.id, parentFieldId: null, fieldHierarchyId: null }),
  f({ id: "fld-pwd", key: "HAS_PWD_ID", englishName: "Has PWD ID", tagalogName: "May PWD ID", englishDescription: "Holds a valid Person with Disability ID.", tagalogDescription: "Holds a valid Person with Disability ID.", classification: "GLOBAL", default: false, required: false, sortOrder: 10, fieldInputTypeId: inputTypes.BOOLEAN.id, parentFieldId: null, fieldHierarchyId: null }),
  f({ id: "fld-solo-parent", key: "IS_SOLO_PARENT", englishName: "Is Solo Parent", tagalogName: "Solo Parent", englishDescription: "Holds a valid Solo Parent ID.", tagalogDescription: "Holds a valid Solo Parent ID.", classification: "GLOBAL", default: false, required: false, sortOrder: 11, fieldInputTypeId: inputTypes.BOOLEAN.id, parentFieldId: null, fieldHierarchyId: null }),
  f({ id: "fld-vulnerability", key: "VULNERABILITY_TAGS", englishName: "Vulnerability Tags", tagalogName: "Mga Katangian", englishDescription: "Any additional vulnerability classifications.", tagalogDescription: "Any additional vulnerability classifications.", classification: "GLOBAL", default: false, required: false, sortOrder: 12, fieldInputTypeId: inputTypes.MULTI_SELECT.id, parentFieldId: null, fieldHierarchyId: null }),

  // FOLLOW_UP fields
  f({ id: "fld-unemployment-duration", key: "UNEMPLOYMENT_DURATION", englishName: "Unemployment Duration", tagalogName: "Tagal ng Pagkawala ng Trabaho", englishDescription: "How long you've been unemployed.", tagalogDescription: "How long you've been unemployed.", classification: "FOLLOW_UP", default: false, required: true, sortOrder: 13, fieldInputTypeId: inputTypes.DURATION.id, parentFieldId: null, fieldHierarchyId: null }),
  f({ id: "fld-disability-type", key: "DISABILITY_TYPE", englishName: "Disability Type", tagalogName: "Uri ng Kapansanan", englishDescription: "Primary disability classification.", tagalogDescription: "Primary disability classification.", classification: "FOLLOW_UP", default: false, required: true, sortOrder: 14, fieldInputTypeId: inputTypes.SINGLE_SELECT.id, parentFieldId: null, fieldHierarchyId: null }),

  // REPEATER_GROUP — Dependents, with 2 subfields
  f({ id: "fld-dependents", key: "DEPENDENTS", englishName: "Dependents", tagalogName: "Mga Dependent", englishDescription: "List each dependent.", tagalogDescription: "List each dependent.", classification: "FOLLOW_UP", default: false, required: false, sortOrder: 15, fieldInputTypeId: inputTypes.REPEATER_GROUP.id, parentFieldId: null, fieldHierarchyId: null }),
  f({ id: "fld-dependent-dob", key: "DEPENDENT_DATE_OF_BIRTH", englishName: "Dependent's Date of Birth", tagalogName: "Petsa ng Kapanganakan ng Dependent", englishDescription: "", tagalogDescription: "", classification: "FOLLOW_UP", default: false, required: true, sortOrder: 0, fieldInputTypeId: inputTypes.DATE.id, parentFieldId: "fld-dependents", fieldHierarchyId: null }),
  f({ id: "fld-dependent-enrolled", key: "DEPENDENT_ENROLLED", englishName: "Currently Enrolled in School", tagalogName: "Kasalukuyang Nag-aaral", englishDescription: "", tagalogDescription: "", classification: "FOLLOW_UP", default: false, required: true, sortOrder: 1, fieldInputTypeId: inputTypes.BOOLEAN.id, parentFieldId: "fld-dependents", fieldHierarchyId: null }),
];

export const fieldOptions: DimFieldOption[] = [
  { id: "opt-employed", fieldId: "fld-employment", englishName: "Employed", tagalogName: "May Trabaho", value: "EMPLOYED", englishDescription: "", tagalogDescription: "", sortOrder: 0 },
  { id: "opt-unemployed", fieldId: "fld-employment", englishName: "Unemployed", tagalogName: "Walang Trabaho", value: "UNEMPLOYED", englishDescription: "", tagalogDescription: "", sortOrder: 1 },
  { id: "opt-self-employed", fieldId: "fld-employment", englishName: "Self-Employed", tagalogName: "Sariling Negosyo", value: "SELF_EMPLOYED", englishDescription: "", tagalogDescription: "", sortOrder: 2 },

  { id: "opt-single", fieldId: "fld-civil-status", englishName: "Single", tagalogName: "Walang Asawa", value: "SINGLE", englishDescription: "", tagalogDescription: "", sortOrder: 0 },
  { id: "opt-married", fieldId: "fld-civil-status", englishName: "Married", tagalogName: "May Asawa", value: "MARRIED", englishDescription: "", tagalogDescription: "", sortOrder: 1 },
  { id: "opt-widowed", fieldId: "fld-civil-status", englishName: "Widowed", tagalogName: "Balo", value: "WIDOWED", englishDescription: "", tagalogDescription: "", sortOrder: 2 },

  { id: "opt-tag-4ps", fieldId: "fld-vulnerability", englishName: "4Ps Beneficiary", tagalogName: "4Ps Benepisyaryo", value: "4PS", englishDescription: "", tagalogDescription: "", sortOrder: 0 },
  { id: "opt-tag-indigenous", fieldId: "fld-vulnerability", englishName: "Indigenous Person", tagalogName: "Katutubo", value: "INDIGENOUS", englishDescription: "", tagalogDescription: "", sortOrder: 1 },
  { id: "opt-tag-idp", fieldId: "fld-vulnerability", englishName: "Internally Displaced", tagalogName: "Displaced na Pamilya", value: "IDP", englishDescription: "", tagalogDescription: "", sortOrder: 2 },

  { id: "opt-disability-visual", fieldId: "fld-disability-type", englishName: "Visual Disability", tagalogName: "Kapansanan sa Paningin", value: "VISUAL", englishDescription: "", tagalogDescription: "", sortOrder: 0 },
  { id: "opt-disability-hearing", fieldId: "fld-disability-type", englishName: "Hearing Disability", tagalogName: "Kapansanan sa Pandinig", value: "HEARING", englishDescription: "", tagalogDescription: "", sortOrder: 1 },
  { id: "opt-disability-mobility", fieldId: "fld-disability-type", englishName: "Mobility Disability", tagalogName: "Kapansanan sa Paggalaw", value: "MOBILITY", englishDescription: "", tagalogDescription: "", sortOrder: 2 },
];

export function getFieldOptions(fieldId: string): DimFieldOption[] {
  return fieldOptions.filter((o) => o.fieldId === fieldId).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getFieldById(fieldId: string): DimField | undefined {
  return fields.find((field) => field.id === fieldId);
}

export function getSubfields(parentFieldId: string): DimField[] {
  return fields.filter((field) => field.parentFieldId === parentFieldId).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getConditionOperators(fieldInputTypeId: string): DimFieldConditionOperator[] {
  return conditionOperators.filter((o) => o.fieldInputTypeId === fieldInputTypeId);
}
