import { ProfileAttributeValue, Attribute } from '../models/index.js';

const BUILTIN_FIELD_MAP = {
  'First Name': 'firstName',
  'Last Name': 'lastName',
  'Location': 'location',
  'Personal Photo': 'photoUrl',
};

class ProfileService {
  static builtinFieldFor(attributeName) {
    return BUILTIN_FIELD_MAP[attributeName] || null;
  }

  static async findMissingAttributeIds(userId, attributeIds) {
    const existing = await ProfileAttributeValue.findAll({
      where: { userId, attributeId: attributeIds },
    });
    const have = new Set(existing.map((v) => v.attributeId));
    return attributeIds.filter((id) => !have.has(id));
  }

  static async ensureAttributeValues(userId, attributeIds) {
    if (!attributeIds || attributeIds.length === 0) return;

    const missing = await ProfileService.findMissingAttributeIds(userId, attributeIds);
    if (!missing.length) return;

    await ProfileAttributeValue.bulkCreate(
      missing.map((attributeId) => ({ userId, attributeId, value: null, version: 1 }))
    );
  }

  static async resolveValue(user, attribute) {
    const { value } = await ProfileService.resolveValueWithVersion(user, attribute);
    return value;
  }

  static normalizePeriodValue(attribute, value) {
    if (attribute.type !== 'period' || !value || typeof value !== 'object') return value;
    return { start: value.start || '', end: value.end || '' };
  }

  static async resolveValueWithVersion(user, attribute) {
    const builtinField = ProfileService.builtinFieldFor(attribute.name);
    if (builtinField) {
      return { value: user[builtinField] ?? null, version: user.version };
    }

    const row = await ProfileAttributeValue.findOne({
      where: { userId: user.id, attributeId: attribute.id },
    });

    const rawValue = row ? row.value : null;
    const normalized = ProfileService.normalizePeriodValue(attribute, rawValue);

    return {
      value: normalized !== undefined && normalized !== null ? normalized : null,
      version: row ? row.version : 1,
    };
  }

  static async getFullProfile(userId) {
    const values = await ProfileAttributeValue.findAll({
      where: { userId },
      include: [{ model: Attribute, as: 'attribute' }],
    });
    return values.filter((v) => !v.attribute.isBuiltin);
  }
}

export default ProfileService;