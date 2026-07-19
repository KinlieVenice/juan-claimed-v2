import type { FctBenefit, RuleTreeRoot } from "@/types/domain";

const seniorCitizenTree: RuleTreeRoot = {
  kind: "group",
  id: "rt-senior-root",
  logicalOperator: "ALL",
  children: [
    { kind: "condition", id: "rt-senior-1", fieldId: "fld-dob", fieldConditionOperatorId: "op-date-age-gte", conditionFieldValue: { value: 60, unit: "years" } },
  ],
};

const pwdTree: RuleTreeRoot = {
  kind: "group",
  id: "rt-pwd-root",
  logicalOperator: "ALL",
  children: [
    { kind: "condition", id: "rt-pwd-1", fieldId: "fld-pwd", fieldConditionOperatorId: "op-bool-equals", conditionFieldValue: true },
    { kind: "condition", id: "rt-pwd-2", fieldId: "fld-disability-type", fieldConditionOperatorId: "op-single-equals", conditionFieldValue: "VISUAL" },
  ],
};

const soloParentTree: RuleTreeRoot = {
  kind: "group",
  id: "rt-solo-root",
  logicalOperator: "ALL",
  children: [
    { kind: "condition", id: "rt-solo-1", fieldId: "fld-solo-parent", fieldConditionOperatorId: "op-bool-equals", conditionFieldValue: true },
  ],
};

const unemploymentTree: RuleTreeRoot = {
  kind: "group",
  id: "rt-unemp-root",
  logicalOperator: "ALL",
  children: [
    { kind: "condition", id: "rt-unemp-1", fieldId: "fld-employment", fieldConditionOperatorId: "op-single-equals", conditionFieldValue: "UNEMPLOYED" },
    { kind: "condition", id: "rt-unemp-2", fieldId: "fld-unemployment-duration", fieldConditionOperatorId: "op-dur-gte", conditionFieldValue: { value: 3, unit: "months" } },
  ],
};

const educSubsidyTree: RuleTreeRoot = {
  kind: "group",
  id: "rt-educ-root",
  logicalOperator: "ALL",
  children: [
    { kind: "condition", id: "rt-educ-1", fieldId: "fld-income", fieldConditionOperatorId: "op-money-lte", conditionFieldValue: 12000 },
    { kind: "condition", id: "rt-educ-2", fieldId: "fld-household-size", fieldConditionOperatorId: "op-num-gte", conditionFieldValue: 3 },
  ],
};

const initialBenefits: FctBenefit[] = [
  {
    id: "ben-senior",
    name: "Senior Citizen Pension",
    englishDescription: "Monthly financial assistance for Filipino citizens aged 60 and above.",
    tagalogDescription: "Buwanang tulong pinansyal para sa mga mamamayang Pilipino na 60 taong gulang pataas.",
    isNationwide: true,
    scopeName: "Nationwide",
    eligibilityTree: seniorCitizenTree,
    benefitRequirements: [
      { id: "req-senior-1", benefitId: "ben-senior", englishName: "Valid ID", tagalogName: "Balidong ID", englishDescription: "Any government-issued ID showing your birth date.", tagalogDescription: "Anumang gobyernong ID na nagpapakita ng petsa ng kapanganakan.", documents: ["Senior Citizen ID sample.pdf", "Valid ID guide.pdf"] },
      { id: "req-senior-2", benefitId: "ben-senior", englishName: "Barangay Certificate", tagalogName: "Sertipiko ng Barangay", englishDescription: "Proof of residency issued within the last 3 months.", tagalogDescription: "Patunay ng tirahan na inisyu sa nakaraang 3 buwan.", documents: ["Barangay cert template.pdf"] },
    ],
    benefitUtilizations: [
      { id: "util-senior-1", benefitId: "ben-senior", englishName: "Monthly Pension Claim", tagalogName: "Buwanang Pension", englishDescription: "Always bring your Senior Citizen booklet, not just the ID, when claiming your pension at the municipal hall.", tagalogDescription: "Laging dalhin ang inyong Senior Citizen booklet, hindi lang ang ID, kapag kukunin ang pension." },
      { id: "util-senior-2", benefitId: "ben-senior", englishName: "Discount Privileges", tagalogName: "Diskwentong Pribilehiyo", englishDescription: "Present your Senior Citizen ID for the 20% discount and VAT exemption on qualifying purchases.", tagalogDescription: "Ipakita ang Senior Citizen ID para sa 20% diskwento at VAT exemption." },
    ],
  },
  {
    id: "ben-pwd",
    name: "PWD Assistance Program",
    englishDescription: "Financial and medical assistance for persons with disabilities.",
    tagalogDescription: "Tulong pinansyal at medikal para sa mga taong may kapansanan.",
    isNationwide: true,
    scopeName: "Nationwide",
    eligibilityTree: pwdTree,
    benefitRequirements: [
      { id: "req-pwd-1", benefitId: "ben-pwd", englishName: "PWD ID", tagalogName: "PWD ID", englishDescription: "Valid Person with Disability ID from your city/municipal PDAO.", tagalogDescription: "Balidong PWD ID mula sa PDAO ng inyong lungsod/munisipyo.", documents: ["PWD ID application form.pdf"] },
      { id: "req-pwd-2", benefitId: "ben-pwd", englishName: "Medical Certificate", tagalogName: "Sertipiko Medikal", englishDescription: "Certificate specifying the type and degree of disability.", tagalogDescription: "Sertipikong nagsasaad ng uri at antas ng kapansanan.", documents: [] },
    ],
    benefitUtilizations: [
      { id: "util-pwd-1", benefitId: "ben-pwd", englishName: "Assistive Device Voucher", tagalogName: "Voucher para sa Kagamitan", englishDescription: "Redeem at any accredited medical supply partner within 6 months of issuance.", tagalogDescription: "I-redeem sa akreditadong medical supply partner sa loob ng 6 buwan." },
    ],
  },
  {
    id: "ben-solo-parent",
    name: "Solo Parent Support Program",
    englishDescription: "Cash assistance and livelihood support for solo parents.",
    tagalogDescription: "Tulong pera at hanapbuhay para sa mga solo parent.",
    isNationwide: false,
    scopeName: "Metro Manila",
    eligibilityTree: soloParentTree,
    benefitRequirements: [
      { id: "req-solo-1", benefitId: "ben-solo-parent", englishName: "Solo Parent ID", tagalogName: "Solo Parent ID", englishDescription: "Valid Solo Parent ID issued by your local social welfare office.", tagalogDescription: "Balidong Solo Parent ID mula sa lokal na social welfare office.", documents: ["Solo parent ID checklist.pdf"] },
    ],
    benefitUtilizations: [
      { id: "util-solo-1", benefitId: "ben-solo-parent", englishName: "Cash Assistance Release", tagalogName: "Paglabas ng Cash Assistance", englishDescription: "Released quarterly — coordinate with your barangay social worker for the exact schedule.", tagalogDescription: "Inilalabas kada quarter — makipag-ugnayan sa social worker ng barangay." },
    ],
  },
  {
    id: "ben-unemployment",
    name: "Unemployment Assistance Program",
    englishDescription: "Temporary financial support while you look for work.",
    tagalogDescription: "Pansamantalang tulong pinansyal habang naghahanap ng trabaho.",
    isNationwide: true,
    scopeName: "Nationwide",
    eligibilityTree: unemploymentTree,
    benefitRequirements: [
      { id: "req-unemp-1", benefitId: "ben-unemployment", englishName: "Certificate of Employment (last job)", tagalogName: "Sertipiko ng Huling Trabaho", englishDescription: "From your most recent employer, or a sworn affidavit if unavailable.", tagalogDescription: "Mula sa pinakabagong employer, o sworn affidavit kung wala.", documents: [] },
    ],
    benefitUtilizations: [
      { id: "util-unemp-1", benefitId: "ben-unemployment", englishName: "One-Time Cash Aid", tagalogName: "Isang-Beses na Tulong Pera", englishDescription: "Released once per application cycle — reapply only after 12 months.", tagalogDescription: "Isang beses lang bawat cycle — mag-apply muli pagkatapos ng 12 buwan." },
    ],
  },
  {
    id: "ben-educ-subsidy",
    name: "Educational Subsidy Program",
    englishDescription: "School expense subsidy for low-income households with multiple dependents.",
    tagalogDescription: "Subsidy sa gastos sa paaralan para sa mababang-kita na sambahayan.",
    isNationwide: false,
    scopeName: "Cavite",
    eligibilityTree: educSubsidyTree,
    benefitRequirements: [
      { id: "req-educ-1", benefitId: "ben-educ-subsidy", englishName: "Enrollment Certificate", tagalogName: "Sertipiko ng Pagpapatala", englishDescription: "One per enrolled dependent, from the current school year.", tagalogDescription: "Isa bawat naka-enroll na dependent, sa kasalukuyang taon.", documents: [] },
    ],
    benefitUtilizations: [
      { id: "util-educ-1", benefitId: "ben-educ-subsidy", englishName: "Subsidy Disbursement", tagalogName: "Paglabas ng Subsidy", englishDescription: "Disbursed at the start of each school term directly to the enrolled school.", tagalogDescription: "Inilalabas sa simula ng bawat termino, direkta sa paaralan." },
    ],
  },
];

let benefitList: FctBenefit[] = initialBenefits;
let nextBenefitId = 1;

export function listBenefits(): FctBenefit[] {
  return benefitList;
}

export function getBenefitById(id: string): FctBenefit | undefined {
  return benefitList.find((b) => b.id === id);
}

export function upsertBenefit(benefit: Omit<FctBenefit, "id"> & { id?: string }): FctBenefit {
  if (benefit.id) {
    const index = benefitList.findIndex((b) => b.id === benefit.id);
    if (index !== -1) {
      const updated = { ...benefit, id: benefit.id } as FctBenefit;
      benefitList = [...benefitList.slice(0, index), updated, ...benefitList.slice(index + 1)];
      return updated;
    }
  }
  const created: FctBenefit = { ...benefit, id: `ben-custom-${nextBenefitId++}` };
  benefitList = [...benefitList, created];
  return created;
}
