import { Position, PositionAttribute, AccessRule, Attribute, CV } from '../models/index.js';
import { sequelize } from '../models/index.js';
import { QueryTypes } from 'sequelize';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import OptimisticLockService from '../services/OptimisticLockService.js';
import AccessRuleService from '../services/AccessRuleService.js';

const FULL_INCLUDE = [
  { model: PositionAttribute, as: 'positionAttributes', include: [{ model: Attribute, as: 'attribute' }] },
  { model: AccessRule, as: 'accessRules', include: [{ model: Attribute, as: 'attribute' }] },
];

const CVS_FOR_POSITION_QUERY = `SELECT
    c.id, c.status, c."userId", c."positionId", c."createdAt", c."updatedAt", c."likesCount",
    u."firstName" as "firstName", u."lastName" as "lastName", u."photoUrl" as "photoUrl", u.email,
    COALESCE((SELECT COUNT(*) FROM likes l WHERE l."cvId" = c.id), 0) as "likeCount"
    FROM cvs c
    JOIN users u ON u.id = c."userId"
    WHERE c."positionId" = :positionId
    ORDER BY c."updatedAt" DESC`;

async function replaceChildRecords(Model, positionId, records) {
  await Model.destroy({ where: { positionId } });
  if (records?.length) {
    await Model.bulkCreate(records.map((r) => ({ ...r, positionId })));
  }
}

async function computeAccessInfo(position, user) {
  const isAccessible = await AccessRuleService.isAccessible(position, user);
  let matchesSkills = true;

  if (user && user.role === 'candidate' && !position.isPublic) {
    matchesSkills = await AccessRuleService.candidateMatches(position, user.id);
  }

  return { isAccessible, matchesSkills, canApply: isAccessible && matchesSkills };
}

function formatCvRow(row) {
  return {
    id: row.id,
    status: row.status,
    userId: row.userId,
    positionId: row.positionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    likesCount: parseInt(row.likesCount) || 0,
    candidate: {
      id: row.userId,
      firstName: row.firstName || 'Unknown',
      lastName: row.lastName || '',
      photoUrl: row.photoUrl || '',
      email: row.email || '',
    },
    likeCount: parseInt(row.likeCount) || 0,
  };
}

class PositionController {
  list = asyncHandler(async (req, res) => {
    const positions = await Position.findAll({ include: FULL_INCLUDE, order: [['updatedAt', 'DESC']] });
    const result = [];
    for (const position of positions) {
      const accessInfo = await computeAccessInfo(position, req.user);
      result.push({ ...position.toJSON(), ...accessInfo });
    }
    res.json(result);
  });

  latest = asyncHandler(async (req, res) => {
    res.json(await Position.findAll({ order: [['updatedAt', 'DESC']], limit: 5 }));
  });

  popular = asyncHandler(async (req, res) => {
    const positions = await Position.findAll({
      include: [{ model: CV, as: 'cvs', attributes: [] }],
      attributes: { include: [[Position.sequelize.fn('COUNT', Position.sequelize.col('cvs.id')), 'cvCount']] },
      group: ['Position.id'],
      order: [[Position.sequelize.literal('"cvCount"'), 'DESC']],
      subQuery: false,
      limit: 5,
    });
    res.json(positions);
  });

  getOne = asyncHandler(async (req, res) => {
    const position = await Position.findByPk(req.params.id, {
      include: [
        { model: PositionAttribute, as: 'positionAttributes', include: [{ model: Attribute, as: 'attribute' }] },
        { model: AccessRule, as: 'accessRules' }
      ]
    });
    if (!position) throw ApiError.notFound('Position not found');

    if (!req.user && !position.isPublic) {
      throw ApiError.forbidden('You do not have access to this position');
    }

    const isAccessible = await AccessRuleService.isAccessible(position, req.user);
    let matchesSkills = true;
    let canApply = true;

    if (req.user && req.user.role === 'candidate' && !position.isPublic) {
      matchesSkills = await AccessRuleService.candidateMatches(position, req.user.id);
      canApply = isAccessible && matchesSkills;
    }

    res.json({
      ...position.toJSON(),
      isAccessible,
      matchesSkills,
      canApply
    });
  });

  create = asyncHandler(async (req, res) => {
    const position = await PositionController.buildPosition(req.body, req.user.id);
    res.status(201).json(await Position.findByPk(position.id, { include: FULL_INCLUDE }));
  });

  duplicate = asyncHandler(async (req, res) => {
    const source = await Position.findByPk(req.params.id, { include: FULL_INCLUDE });
    if (!source) throw ApiError.notFound('Position not found');

    const clone = await PositionController.buildPosition({
      title: `${source.title} (copy)`,
      shortDescription: source.shortDescription,
      isPublic: source.isPublic,
      projectTags: source.projectTags,
      maxProjects: source.maxProjects,
      attributes: source.positionAttributes.map((pa) => ({
        attributeId: pa.attributeId,
        required: pa.required,
        order: pa.order,
      })),
      accessRules: source.accessRules.map((r) => ({
        attributeId: r.attributeId,
        operator: r.operator,
        value: r.value,
      })),
    }, req.user.id);

    res.status(201).json(await Position.findByPk(clone.id, { include: FULL_INCLUDE }));
  });

  static async buildPosition(body, createdById) {
    const {
      title,
      shortDescription,
      isPublic,
      projectTags,
      maxProjects,
      attributes = [],
      accessRules = []
    } = body;

    if (!title) {
      throw ApiError.badRequest('Title is required');
    }

    const position = await Position.create({
      title,
      shortDescription: shortDescription || '',
      isPublic,
      projectTags: projectTags || [],
      maxProjects: maxProjects === undefined || maxProjects === '' ? null : maxProjects,
      createdById,
    });

    if (attributes.length) {
      await PositionAttribute.bulkCreate(
        attributes.map((a) => ({
          ...a,
          positionId: position.id
        }))
      );
    }

    if (accessRules.length) {
      await AccessRule.bulkCreate(
        accessRules.map((r) => ({
          ...r,
          positionId: position.id
        }))
      );
    }

    return position;
  }

  update = asyncHandler(async (req, res) => {
    const position = await Position.findByPk(req.params.id);
    if (!position) throw ApiError.notFound('Position not found');

    const { version, attributes, accessRules, ...patch } = req.body;
    await OptimisticLockService.applyUpdate(position, version, patch);

    if (attributes) {
      const currentAttrs = await PositionAttribute.findAll({
        where: { positionId: position.id },
        include: [{ model: Attribute, as: 'attribute' }]
      });

      const currentAttrIds = currentAttrs.map(a => a.attributeId);
      const newAttrIds = attributes.map(a => a.attributeId);

      const removedAttrIds = currentAttrIds.filter(id => !newAttrIds.includes(id));

      if (removedAttrIds.length > 0) {
        await AccessRule.destroy({
          where: {
            positionId: position.id,
            attributeId: removedAttrIds
          }
        });
      }

      await replaceChildRecords(PositionAttribute, position.id, attributes);
    }

    if (accessRules) {
      const validRules = [];
      for (const rule of accessRules) {
        const attrExists = await Attribute.findByPk(rule.attributeId);
        if (attrExists) {
          validRules.push(rule);
        }
      }
      await replaceChildRecords(AccessRule, position.id, validRules);
    }

    res.json(await Position.findByPk(position.id, { include: FULL_INCLUDE }));
  });

  remove = asyncHandler(async (req, res) => {
    const position = await Position.findByPk(req.params.id);
    if (!position) throw ApiError.notFound('Position not found');
    await position.destroy();
    res.status(204).end();
  });

  cvs = asyncHandler(async (req, res) => {
    const result = await sequelize.query(CVS_FOR_POSITION_QUERY, {
      replacements: { positionId: req.params.id },
      type: QueryTypes.SELECT,
    });
    res.json(result.map(formatCvRow));
  });
}

export default new PositionController();
