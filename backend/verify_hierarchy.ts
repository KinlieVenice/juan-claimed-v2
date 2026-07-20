import { compare } from '/app/src/utils/condition.util.js';

console.log('EQUALS shallow target matches deep answer:', compare({
  inputType: 'HIERARCHY_SELECT', operator: 'EQUALS',
  targetValue: ['NAIC'],
  actualValue: ['REGION_4A', 'CAVITE', 'NAIC', 'BRGY_1'],
}));

console.log('EQUALS multi-target matches one branch:', compare({
  inputType: 'HIERARCHY_SELECT', operator: 'EQUALS',
  targetValue: ['LANTIC', 'NAIC', 'SAN_PABLO'],
  actualValue: ['REGION_4A', 'CAVITE', 'CARMONA', 'LANTIC'],
}));

console.log('EQUALS no match (expect false):', compare({
  inputType: 'HIERARCHY_SELECT', operator: 'EQUALS',
  targetValue: ['LANTIC', 'NAIC', 'SAN_PABLO'],
  actualValue: ['REGION_4A', 'LAGUNA', 'CALAMBA', 'BRGY_X'],
}));

console.log('NOT_EQUALS (expect true, no match case):', compare({
  inputType: 'HIERARCHY_SELECT', operator: 'NOT_EQUALS',
  targetValue: ['LANTIC'],
  actualValue: ['REGION_4A', 'LAGUNA', 'CALAMBA', 'BRGY_X'],
}));

console.log('IN exact leaf match:', compare({
  inputType: 'HIERARCHY_SELECT', operator: 'IN',
  targetValue: ['NAIC'],
  actualValue: ['REGION_4A', 'CAVITE', 'NAIC'],
}));
console.log('IN exact leaf non-match (deep answer under Naic, expect false):', compare({
  inputType: 'HIERARCHY_SELECT', operator: 'IN',
  targetValue: ['NAIC'],
  actualValue: ['REGION_4A', 'CAVITE', 'NAIC', 'BRGY_1'],
}));

console.log('IS_EMPTY null (expect true):', compare({ inputType: 'HIERARCHY_SELECT', operator: 'IS_EMPTY', targetValue: null, actualValue: null }));
console.log('IS_EMPTY populated (expect false):', compare({ inputType: 'HIERARCHY_SELECT', operator: 'IS_EMPTY', targetValue: null, actualValue: ['A','B'] }));

console.log('SINGLE_SELECT IN (expect true):', compare({ inputType: 'SINGLE_SELECT', operator: 'IN', targetValue: ['A','B'], actualValue: 'B' }));
