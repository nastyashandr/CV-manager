import { Op } from 'sequelize';
import { Attribute, AccessRule, PositionAttribute, ProfileAttributeValue, CVAttribute } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import OptimisticLockService from '../services/OptimisticLockService.js';

async function deleteAttributeReferences(attributeId) {
  await Promise.all([
    AccessRule.destroy({ where: { attributeId } }),
    PositionAttribute.destroy({ where: { attributeId } }),
    ProfileAttributeValue.destroy({ where: { attributeId } }),
    CVAttribute.destroy({ where: { attributeId } }),
  ]);
}

class AttributeController {
  list = asyncHandler(async (req, res) => {
    const { prefix, category, recent } = req.query;
    const where = {};
    if (prefix) where.name = { [Op.iLike]: `${prefix}%` };
    if (category) where.category = category;
    const order = recent === 'true' ? [['usageCount', 'DESC'], ['updatedAt', 'DESC']] : [['category', 'ASC'], ['name', 'ASC']];
    res.json(await Attribute.findAll({ where, order, limit: 100 }));
  });

  categories = asyncHandler(async (req, res) => {
    const rows = await Attribute.findAll({ attributes: ['category'], group: ['category'] });
    res.json(rows.map((r) => r.category));
  });

  create = asyncHandler(async (req, res) => {
    const { name, category, type, options } = req.body;
    if (!name || !category || !type) throw ApiError.badRequest('name, category and type are required');
    const attribute = await Attribute.create({
      name,
      category,
      type,
      options: options || [],
      createdBy: req.user.id,
    });
    res.status(201).json(attribute);
  });

  update = asyncHandler(async (req, res) => {
    const attribute = await Attribute.findByPk(req.params.id);
    if (!attribute) throw ApiError.notFound('Attribute not found');
    if (attribute.isBuiltin) throw ApiError.forbidden('Built-in attributes cannot be edited');

    const { version, name, category, type, options } = req.body;

    if (version !== undefined && Number(version) !== attribute.version) {
      throw ApiError.conflict(
        `Attribute was modified by someone else (current version ${attribute.version})`,
        { currentVersion: attribute.version }
      );
    }

    const typeChanged = type && type !== attribute.type;

    if (name !== undefined) attribute.name = name;
    if (category !== undefined) attribute.category = category;
    if (type !== undefined) attribute.type = type;
    if (options !== undefined) attribute.options = options;

    attribute.version = attribute.version + 1;
    await attribute.save();

    if (typeChanged) {
      const deletedCount = await AccessRule.destroy({
        where: { attributeId: attribute.id }
      });

      const positionAttrs = await PositionAttribute.findAll({
        where: { attributeId: attribute.id },
        attributes: ['positionId']
      });

      const positionIds = [...new Set(positionAttrs.map(pa => pa.positionId))];
      for (const positionId of positionIds) {
        await AccessRule.destroy({
          where: {
            positionId: positionId,
            attributeId: attribute.id
          }
        });
      }

      if (deletedCount > 0 || positionIds.length > 0) {
        console.log(`Deleted access rules for attribute ${attribute.name} due to type change`);
      }
    }

    res.json(attribute);
  });

  remove = asyncHandler(async (req, res) => {
    const attribute = await Attribute.findByPk(req.params.id);
    if (!attribute) throw ApiError.notFound('Attribute not found');
    if (attribute.isBuiltin) throw ApiError.forbidden('Built-in attributes cannot be deleted');

    await deleteAttributeReferences(req.params.id);
    await attribute.destroy();
    res.status(204).end();
  });

  getMyAttributes = asyncHandler(async (req, res) => {
    const attributes = await Attribute.findAll({
      where: { createdBy: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(attributes);
  });
}

export default new AttributeController();
