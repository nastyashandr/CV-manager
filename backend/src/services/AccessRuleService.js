import { ProfileAttributeValue } from '../models/index.js';

class AccessRuleService {
  static async buildAttributeValueMap(userId) {
    const values = await ProfileAttributeValue.findAll({
      where: { userId },
      include: [{ association: 'attribute' }],
    });
    return new Map(values.map((v) => [v.attributeId, v.value]));
  }

  static allRulesMatch(rules, byAttr) {
    return rules.every((rule) => {
      const userValue = byAttr.get(rule.attributeId);
      if (userValue === undefined || userValue === null) return false;
      return AccessRuleService.evaluateRule(userValue, rule);
    });
  }

  static async candidateMatches(position, userId) {
    const rules = position.accessRules || [];
    if (!rules.length) return true;

    const byAttr = await AccessRuleService.buildAttributeValueMap(userId);
    return AccessRuleService.allRulesMatch(rules, byAttr);
  }

  static evaluateRule(userValue, rule) {
    const { operator, value } = rule;

    switch (operator) {
      case '=':
        return String(userValue) === String(value);
      case '!=':
        return String(userValue) !== String(value);
      case '>':
        return Number(userValue) > Number(value);
      case '>=':
        return Number(userValue) >= Number(value);
      case '<':
        return Number(userValue) < Number(value);
      case '<=':
        return Number(userValue) <= Number(value);
      case 'contains':
        return String(userValue).toLowerCase().includes(String(value).toLowerCase());
      case 'checked':
        return userValue === true;
      default:
        return false;
    }
  }

  static async isAccessible(position, user) {
    if (!user) return position.isPublic;
    if (user.isRecruiter()) return true;
    if (position.isPublic) return true;
    return AccessRuleService.candidateMatches(position, user.id);
  }

  static async candidateMatchesWithCustomValue(position, userId, changedAttributeId, changedValue) {
    const rules = position.accessRules || [];
    if (!rules.length) return true;

    const byAttr = await AccessRuleService.buildAttributeValueMap(userId);
    byAttr.set(changedAttributeId, changedValue);
    return AccessRuleService.allRulesMatch(rules, byAttr);
  }
}

export default AccessRuleService;
