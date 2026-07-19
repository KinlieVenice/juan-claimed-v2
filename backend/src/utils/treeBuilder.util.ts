export interface GenericRuleGroup {
  id: string;
  parentRuleGroupId: string | null;
  conditions: any[];
  [key: string]: any; // Allows other fields like logical_operator or benefit_id
}

export const buildRuleGroupTree = <T extends GenericRuleGroup>(
  allGroups: any[],
  allConditions: any[],
  groupConditionIdKey: string // 'benefitRuleGroupId' or 'dynamicRuleGroupId'
): T[] => {
  const groupMap = new Map<string, T>();

  // 1. Initialize map
  allGroups.forEach((group) => {
    groupMap.set(group.id, { ...group, conditions: [] } as T);
  });

  // 2. Map conditions
  allConditions.forEach((condition) => {
    const parentGroup = groupMap.get(condition[groupConditionIdKey]);
    if (parentGroup) {
      parentGroup.conditions.push(condition);
    }
  });

  // 3. Stitch tree
  const rootGroups: T[] = [];
  groupMap.forEach((group) => {
    if (group.parentRuleGroupId === null) {
      rootGroups.push(group);
    } else {
      const parentGroup = groupMap.get(group.parentRuleGroupId);
      if (parentGroup) {
        parentGroup.conditions.push(group);
      }
    }
  });

  return rootGroups;
};