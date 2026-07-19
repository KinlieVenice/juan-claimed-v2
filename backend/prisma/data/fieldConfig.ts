// prisma/data/fieldConfig.ts

export interface SeedInputType {
  value: string;
  englishName: string;
  tagalogName: string;
}

export interface SeedOperator {
  inputTypeValue: string;
  value: string;
  englishName: string;
  tagalogName: string;
}

export const inputTypesData: SeedInputType[] = [
  { value: 'TEXT', englishName: 'Text', tagalogName: 'Teksto' },
  { value: 'NUMBER', englishName: 'Number', tagalogName: 'Numero' },
  { value: 'MONEY', englishName: 'Currency / Money', tagalogName: 'Halaga / Pera' },
  { value: 'DATE', englishName: 'Date', tagalogName: 'Petsa' },
  { value: 'DURATION', englishName: 'Duration', tagalogName: 'Tagal' },
  { value: 'BOOLEAN', englishName: 'Yes/No', tagalogName: 'Oo/Hindi' },
  { value: 'SINGLE_SELECT', englishName: 'Single Selection', tagalogName: 'Isang Pagpipilian' },
  { value: 'MULTI_SELECT', englishName: 'Multiple Selection', tagalogName: 'Maramihang Pagpipilian' },
  { value: 'HIERARCHY_SELECT', englishName: 'Hierarchical Selection', tagalogName: 'Klasipikasyon (Kaskad)' },
  { value: 'REPEATER_GROUP', englishName: 'Repeater Group', tagalogName: 'Grupo ng Ulitin' },
];

export const operatorsData: SeedOperator[] = [
  // TEXT OPERATORS
  { inputTypeValue: 'TEXT', value: 'EQUALS', englishName: 'Is Exactly', tagalogName: 'Ay Eksaktong' },
  { inputTypeValue: 'TEXT', value: 'NOT_EQUALS', englishName: 'Is Not Exactly', tagalogName: 'Ay Hindi Eksaktong' },
  { inputTypeValue: 'TEXT', value: 'STARTS_WITH', englishName: 'Starts With', tagalogName: 'Nagsisimula sa' },
  { inputTypeValue: 'TEXT', value: 'ENDS_WITH', englishName: 'Ends With', tagalogName: 'Nagtatapos sa' },
  { inputTypeValue: 'TEXT', value: 'CONTAINS_SUBSTRING', englishName: 'Contains', tagalogName: 'Naglalaman ng' },
  { inputTypeValue: 'TEXT', value: 'NOT_CONTAINS_SUBSTRING', englishName: 'Does Not Contain', tagalogName: 'Hindi Naglalaman ng' },
  { inputTypeValue: 'TEXT', value: 'IS_EMPTY', englishName: 'Is Empty', tagalogName: 'Ay Walang Laman' },
  { inputTypeValue: 'TEXT', value: 'IS_NOT_EMPTY', englishName: 'Is Not Empty', tagalogName: 'May Laman' },

  // NUMBER OPERATORS
  { inputTypeValue: 'NUMBER', value: 'EQUALS', englishName: 'Is Equal To', tagalogName: 'Ay Katumbas ng' },
  { inputTypeValue: 'NUMBER', value: 'NOT_EQUALS', englishName: 'Is Not Equal To', tagalogName: 'Ay Hindi Katumbas ng' },
  { inputTypeValue: 'NUMBER', value: 'GREATER_THAN', englishName: 'Is Greater Than', tagalogName: 'Ay Higit sa' },
  { inputTypeValue: 'NUMBER', value: 'LESS_THAN', englishName: 'Is Less Than', tagalogName: 'Ay Mababa sa' },
  { inputTypeValue: 'NUMBER', value: 'GREATER_THAN_EQUAL', englishName: 'Is Greater Than or Equal To', tagalogName: 'Ay Higit sa o Katumbas ng' },
  { inputTypeValue: 'NUMBER', value: 'LESS_THAN_EQUAL', englishName: 'Is Less Than or Equal To', tagalogName: 'Ay Mababa sa o Katumbas ng' },
  { inputTypeValue: 'NUMBER', value: 'BETWEEN', englishName: 'Is Between', tagalogName: 'Ay Nasa Pagitan ng' },

  // MONEY OPERATORS
  { inputTypeValue: 'MONEY', value: 'EQUALS', englishName: 'Is Equal To', tagalogName: 'Ay Katumbas ng' },
  { inputTypeValue: 'MONEY', value: 'NOT_EQUALS', englishName: 'Is Not Equal To', tagalogName: 'Ay Hindi Katumbas ng' },
  { inputTypeValue: 'MONEY', value: 'GREATER_THAN', englishName: 'Is More Than', tagalogName: 'Ay Mas Malaki sa' },
  { inputTypeValue: 'MONEY', value: 'LESS_THAN', englishName: 'Is Less Than', tagalogName: 'Ay Mas Mababa sa' },
  { inputTypeValue: 'MONEY', value: 'GREATER_THAN_EQUAL', englishName: 'Is At Least', tagalogName: 'Ay Hindi Bababa sa' },
  { inputTypeValue: 'MONEY', value: 'LESS_THAN_EQUAL', englishName: 'Is At Most', tagalogName: 'Ay Hindi Lalampas sa' },
  { inputTypeValue: 'MONEY', value: 'BETWEEN', englishName: 'Is Between', tagalogName: 'Ay Nasa Pagitan ng' },

  // DATE OPERATORS
  { inputTypeValue: 'DATE', value: 'BEFORE', englishName: 'Is Before', tagalogName: 'Ay Bago ang' },
  { inputTypeValue: 'DATE', value: 'AFTER', englishName: 'Is After', tagalogName: 'Ay Pagkatapos ng' },
  { inputTypeValue: 'DATE', value: 'EQUALS', englishName: 'Is Exactly', tagalogName: 'Ay Sakto sa' },
  { inputTypeValue: 'DATE', value: 'ON_OR_BEFORE', englishName: 'On or Before', tagalogName: 'Sa o Bago ang' },
  { inputTypeValue: 'DATE', value: 'ON_OR_AFTER', englishName: 'On or After', tagalogName: 'Sa o Pagkatapos ng' },
  { inputTypeValue: 'DATE', value: 'IN_THE_PAST', englishName: 'Is in the Past', tagalogName: 'Ay Tapos na' },
  { inputTypeValue: 'DATE', value: 'IN_THE_FUTURE', englishName: 'Is in the Future', tagalogName: 'Ay sa Hinaharap' },
  { inputTypeValue: 'DATE', value: 'IS_CURRENT_DAY', englishName: 'Is Today', tagalogName: 'Ay Ngayong Araw' },
  { inputTypeValue: 'DATE', value: 'IS_CURRENT_WEEK', englishName: 'Is This Week', tagalogName: 'Ay Ngayong Linggo' },
  { inputTypeValue: 'DATE', value: 'IS_CURRENT_MONTH', englishName: 'Is This Month', tagalogName: 'Ay Ngayong Buwan' },
  { inputTypeValue: 'DATE', value: 'IS_CURRENT_YEAR', englishName: 'Is This Year', tagalogName: 'Ay Ngayong Taon' },
  { inputTypeValue: 'DATE', value: 'BETWEEN', englishName: 'Is Between', tagalogName: 'Ay Nasa Pagitan ng' },

  // DATE AGE OPERATORS (actualValue treated as a birth date)
  { inputTypeValue: 'DATE', value: 'AGE_GREATER_THAN', englishName: 'Age Is Greater Than', tagalogName: 'Edad ay Higit sa' },
  { inputTypeValue: 'DATE', value: 'AGE_LESS_THAN', englishName: 'Age Is Less Than', tagalogName: 'Edad ay Mababa sa' },
  { inputTypeValue: 'DATE', value: 'AGE_GREATER_THAN_EQUAL', englishName: 'Age Is Greater Than or Equal To', tagalogName: 'Edad ay Higit sa o Katumbas ng' },
  { inputTypeValue: 'DATE', value: 'AGE_LESS_THAN_EQUAL', englishName: 'Age Is Less Than or Equal To', tagalogName: 'Edad ay Mababa sa o Katumbas ng' },
  { inputTypeValue: 'DATE', value: 'AGE_EQUALS', englishName: 'Age Is Equal To', tagalogName: 'Edad ay Katumbas ng' },
  { inputTypeValue: 'DATE', value: 'AGE_NOT_EQUALS', englishName: 'Age Is Not Equal To', tagalogName: 'Edad ay Hindi Katumbas ng' },
  { inputTypeValue: 'DATE', value: 'AGE_BETWEEN', englishName: 'Age Is Between', tagalogName: 'Edad ay Nasa Pagitan ng' },

  // DURATION OPERATORS
  { inputTypeValue: 'DURATION', value: 'EQUALS', englishName: 'Is Equal To', tagalogName: 'Ay Katumbas ng' },
  { inputTypeValue: 'DURATION', value: 'NOT_EQUALS', englishName: 'Is Not Equal To', tagalogName: 'Ay Hindi Katumbas ng' },
  { inputTypeValue: 'DURATION', value: 'GREATER_THAN', englishName: 'Is Greater Than', tagalogName: 'Ay Higit sa' },
  { inputTypeValue: 'DURATION', value: 'LESS_THAN', englishName: 'Is Less Than', tagalogName: 'Ay Mababa sa' },
  { inputTypeValue: 'DURATION', value: 'GREATER_THAN_EQUAL', englishName: 'Is Greater Than or Equal To', tagalogName: 'Ay Higit sa o Katumbas ng' },
  { inputTypeValue: 'DURATION', value: 'LESS_THAN_EQUAL', englishName: 'Is Less Than or Equal To', tagalogName: 'Ay Mababa sa o Katumbas ng' },
  { inputTypeValue: 'DURATION', value: 'BETWEEN', englishName: 'Is Between', tagalogName: 'Ay Nasa Pagitan ng' },

  // BOOLEAN OPERATORS
  { inputTypeValue: 'BOOLEAN', value: 'EQUALS', englishName: 'Is', tagalogName: 'Ay' },

  // SINGLE_SELECT OPERATORS
  { inputTypeValue: 'SINGLE_SELECT', value: 'EQUALS', englishName: 'Is Exactly', tagalogName: 'Ay Eksaktong' },
  { inputTypeValue: 'SINGLE_SELECT', value: 'NOT_EQUALS', englishName: 'Is Not Exactly', tagalogName: 'Ay Hindi Eksaktong' },

  // MULTI_SELECT OPERATORS
  { inputTypeValue: 'MULTI_SELECT', value: 'EQUALS', englishName: 'Is Exactly', tagalogName: 'Ay Eksaktong' },
  { inputTypeValue: 'MULTI_SELECT', value: 'NOT_EQUALS', englishName: 'Is Not Exactly', tagalogName: 'Ay Hindi Eksaktong' },
  { inputTypeValue: 'MULTI_SELECT', value: 'IN', englishName: 'Is One Of', tagalogName: 'Ay Alinman Sa' },
  { inputTypeValue: 'MULTI_SELECT', value: 'NOT_IN', englishName: 'Is None Of', tagalogName: 'Ay Hindi Alinman Sa' },

  // HIERARCHY_SELECT OPERATORS
  { inputTypeValue: 'HIERARCHY_SELECT', value: 'BELONGS_TO', englishName: 'Belongs Under', tagalogName: 'Kabilang sa Ilalim ng' },
  { inputTypeValue: 'HIERARCHY_SELECT', value: 'EQUALS', englishName: 'Is Exactly', tagalogName: 'Ay Eksaktong' },
  { inputTypeValue: 'HIERARCHY_SELECT', value: 'NOT_EQUALS', englishName: 'Is Not Exactly', tagalogName: 'Ay Hindi Eksaktong' },
  { inputTypeValue: 'HIERARCHY_SELECT', value: 'IN', englishName: 'Is One Of', tagalogName: 'Ay Alinman Sa' },
  { inputTypeValue: 'HIERARCHY_SELECT', value: 'IS_EMPTY', englishName: 'Is Empty', tagalogName: 'Ay Walang Laman' },
  { inputTypeValue: 'HIERARCHY_SELECT', value: 'IS_NOT_EMPTY', englishName: 'Is Not Empty', tagalogName: 'May Laman' },

  // REPEATER_GROUP OPERATORS
  { inputTypeValue: 'REPEATER_GROUP', value: 'COUNT_EQUALS', englishName: 'Count Is Equal To', tagalogName: 'Bilang ay Katumbas ng' },
  { inputTypeValue: 'REPEATER_GROUP', value: 'SUM_GREATER_THAN', englishName: 'Total Is Greater Than', tagalogName: 'Kabuuan ay Higit sa' },
  { inputTypeValue: 'REPEATER_GROUP', value: 'MIN_LESS_THAN', englishName: 'Minimum Is Less Than', tagalogName: 'Pinakamababa ay Mas Mababa sa' },
  { inputTypeValue: 'REPEATER_GROUP', value: 'MAX_GREATER_THAN', englishName: 'Maximum Is Greater Than', tagalogName: 'Pinakamataas ay Mas Malaki sa' },
  { inputTypeValue: 'REPEATER_GROUP', value: 'AVERAGE_GREATER_THAN', englishName: 'Average Is Greater Than', tagalogName: 'Karaniwan ay Mas Malaki sa' },
  { inputTypeValue: 'REPEATER_GROUP', value: 'ANY_MATCH', englishName: 'Any Item Matches', tagalogName: 'Alinmang Item ay Tumpak' },
  { inputTypeValue: 'REPEATER_GROUP', value: 'ALL_MATCH', englishName: 'All Items Match', tagalogName: 'Lahat ng Item ay Tumpak' },
];