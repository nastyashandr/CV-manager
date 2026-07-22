import { CV, Position, User, Attribute, ProfileAttributeValue, Like, AccessRule, PositionAttribute, CVAttribute, Project } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import ProfileService from '../services/ProfileService.js';
import AccessRuleService from '../services/AccessRuleService.js';
import CvBuilderService from '../services/CvBuilderService.js';
import OptimisticLockService from '../services/OptimisticLockService.js';

async function fetchFullCv(id) {
  return CV.findByPk(id, {
    include: [
      { model: Position, as: 'position' },
      { model: CVAttribute, as: 'cvAttributes', include: [{ model: Attribute, as: 'attribute' }] }
    ]
  });
}

async function buildInitialCvAttributes(cv, user) {
  const positionAttributes = await PositionAttribute.findAll({
    where: { positionId: cv.positionId },
    include: [{ model: Attribute, as: 'attribute' }],
  });

  const rows = [];
  for (const pa of positionAttributes) {
    const { value } = await ProfileService.resolveValueWithVersion(user, pa.attribute);
    rows.push({ cvId: cv.id, attributeId: pa.attributeId, value: value ?? null, version: 1 });
  }
  if (rows.length) await CVAttribute.bulkCreate(rows);
}

async function resolveCurrentAttributeValue(cv, attribute, attributeId, fallbackVersion) {
  if (attribute.isBuiltin) {
    const user = await User.findByPk(cv.userId);
    const field = ProfileService.builtinFieldFor(attribute.name);
    return { value: user[field], version: user.version };
  }
  const profileAttr = await ProfileAttributeValue.findOne({ where: { userId: cv.userId, attributeId } });
  if (profileAttr) return { value: profileAttr.value, version: profileAttr.version };
  return { value: null, version: fallbackVersion };
}

async function assertLockedValueUnchanged(cv, attribute, attributeId, value, version) {
  const current = await resolveCurrentAttributeValue(cv, attribute, attributeId, version);
  if (JSON.stringify(current.value) !== JSON.stringify(value)) {
    throw ApiError.forbidden(`Cannot change "${attribute.name}" because it is used in access rules.`);
  }
  return current;
}

async function getOrCreateCvAttribute(cvId, attributeId) {
  const existing = await CVAttribute.findOne({ where: { cvId, attributeId } });
  return existing || CVAttribute.create({ cvId, attributeId, value: null, version: 1 });
}

async function syncProfileValue(cv, attribute, attributeId, value, version) {
  if (attribute.isBuiltin) {
    const user = await User.findByPk(cv.userId);
    const field = ProfileService.builtinFieldFor(attribute.name);
    await OptimisticLockService.applyUpdate(user, version || 1, { [field]: value });
    return;
  }

  const profileAttr = await ProfileAttributeValue.findOne({ where: { userId: cv.userId, attributeId } });
  if (!profileAttr) {
    await ProfileAttributeValue.create({ userId: cv.userId, attributeId, value, version: 1 });
    return;
  }
  profileAttr.value = value;
  profileAttr.version = profileAttr.version + 1;
  await profileAttr.save();
}

async function recalcLikeCount(cv) {
  const likeCount = await Like.count({ where: { cvId: cv.id } });
  await cv.update({ likesCount: likeCount });
  return likeCount;
}

class CvController {
  static assertCvOwner(req, cv, message) {
    if (req.user.id === cv.userId || req.user.isAdmin()) return;
    throw ApiError.forbidden(message);
  }

  static assertViewable(req, cv) {
    const isOwner = req.user && req.user.id === cv.userId;
    const isStaff = req.user && req.user.isRecruiter();
    if (isOwner || isStaff) return;
    throw ApiError.forbidden('You cannot view this CV');
  }

  myList = asyncHandler(async (req, res) => {
    const cvs = await CV.findAll({
      where: { userId: req.user.id },
      include: [{ model: Position, as: 'position' }],
      order: [['updatedAt', 'DESC']],
    });
    res.json(cvs);
  });

  create = asyncHandler(async (req, res) => {
    const { positionId } = req.body;

    const existing = await CV.findOne({ where: { userId: req.user.id, positionId } });
    if (existing) throw ApiError.badRequest('You already have a CV for this position');

    const position = await Position.findByPk(positionId, {
      include: [{ model: AccessRule, as: 'accessRules' }]
    });
    if (!position) throw ApiError.notFound('Position not found');

    const isAccessible = await AccessRuleService.isAccessible(position, req.user);
    if (!isAccessible) {
      throw ApiError.forbidden('You do not have access to this position');
    }

    if (req.user.role === 'candidate' && !position.isPublic) {
      const matches = await AccessRuleService.candidateMatches(position, req.user.id);
      if (!matches) {
        throw ApiError.forbidden('You do not meet the requirements for this position');
      }
    }

    const cv = await CV.create({
      userId: req.user.id,
      positionId,
      status: 'draft',
      selectedProjects: [],
    });

    await buildInitialCvAttributes(cv, req.user);

    const candidate = await User.findByPk(req.user.id, {
      include: [{ model: Project, as: 'projects' }]
    });

    const projectTags = position.projectTags || [];
    const maxProjects = position.maxProjects;
    let selectedProjects = [];

    if (maxProjects === 0) {
      selectedProjects = [];
    } else if (projectTags.length > 0) {
      const matchedProjects = candidate.projects.filter((p) =>
        (p.tags || []).some((tag) => projectTags.includes(tag))
      );

      matchedProjects.sort((a, b) => {
        if (!a.periodStart && !b.periodStart) return 0;
        if (!a.periodStart) return 1;
        if (!b.periodStart) return -1;
        return new Date(b.periodStart) - new Date(a.periodStart);
      });

      if (maxProjects !== null && maxProjects !== undefined && maxProjects > 0) {
        selectedProjects = matchedProjects.slice(0, maxProjects).map(p => p.id);
      } else {
        selectedProjects = matchedProjects.map(p => p.id);
      }
    } else {
      if (maxProjects !== null && maxProjects !== undefined && maxProjects > 0) {
        const sortedProjects = [...candidate.projects].sort((a, b) => {
          if (!a.periodStart && !b.periodStart) return 0;
          if (!a.periodStart) return 1;
          if (!b.periodStart) return -1;
          return new Date(b.periodStart) - new Date(a.periodStart);
        });
        selectedProjects = sortedProjects.slice(0, maxProjects).map(p => p.id);
      } else {
        selectedProjects = candidate.projects.map(p => p.id);
      }
    }

    cv.selectedProjects = selectedProjects;
    await cv.save();

    const rendered = await CvBuilderService.render(cv);
    res.status(201).json(rendered);
  });

  getOne = asyncHandler(async (req, res) => {
    const cv = await fetchFullCv(req.params.id);
    if (!cv) throw ApiError.notFound('CV not found');
    CvController.assertViewable(req, cv);

    const rendered = await CvBuilderService.render(cv);
    if (!rendered) {
      throw ApiError.notFound('Failed to render CV');
    }

    rendered.likeCount = await Like.count({ where: { cvId: cv.id } });
    rendered.likedByMe = req.user ? Boolean(await Like.findOne({ where: { cvId: cv.id, recruiterId: req.user.id } })) : false;
    rendered.canEdit = req.user && (req.user.id === cv.userId || req.user.isAdmin());

    const candidate = await User.findByPk(cv.userId, {
      include: [{ model: Project, as: 'projects' }]
    });
    rendered.allProjects = candidate?.projects || [];
    rendered.selectedProjects = cv.selectedProjects || [];

    res.json(rendered);
  });

  updateAttribute = asyncHandler(async (req, res) => {
    const { id, attributeId } = req.params;
    const { version, value } = req.body;

    const cv = await CV.findByPk(id);
    if (!cv) throw ApiError.notFound('CV not found');
    CvController.assertCvOwner(req, cv, 'Only the owner can edit this CV');

    const attribute = await Attribute.findByPk(attributeId);
    if (!attribute) throw ApiError.notFound('Attribute not found');

    const position = await Position.findByPk(cv.positionId, { include: [{ model: AccessRule, as: 'accessRules' }] });
    const isInAccessRule = (position.accessRules || []).some((r) => r.attributeId === attributeId);

    if (isInAccessRule) {
      const locked = await assertLockedValueUnchanged(cv, attribute, attributeId, value, version);
      return res.json(locked);
    }

    const cvAttr = await getOrCreateCvAttribute(id, attributeId);
    if (cvAttr.version && version && Number(version) !== cvAttr.version) {
      throw ApiError.conflict(
        `Attribute was modified by someone else (current version ${cvAttr.version})`,
        { currentVersion: cvAttr.version }
      );
    }

    cvAttr.value = value;
    cvAttr.version = cvAttr.version + 1;
    await cvAttr.save();

    await syncProfileValue(cv, attribute, attributeId, value, version);
    await cv.update({ version: cv.version + 1 });

    res.json({ value: cvAttr.value, version: cvAttr.version });
  });

  addAttribute = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { attributeId } = req.body;

    const cv = await CV.findByPk(id);
    if (!cv) throw ApiError.notFound('CV not found');
    CvController.assertCvOwner(req, cv, 'Only the owner can edit this CV');

    const attribute = await Attribute.findByPk(attributeId);
    if (!attribute) throw ApiError.notFound('Attribute not found');

    const existing = await CVAttribute.findOne({ where: { cvId: id, attributeId } });
    if (existing) throw ApiError.badRequest('Attribute already exists in this CV');

    await CVAttribute.create({ cvId: id, attributeId, value: null, version: 1 });

    const profileAttr = await ProfileAttributeValue.findOne({ where: { userId: cv.userId, attributeId } });
    if (!profileAttr) {
      await ProfileAttributeValue.create({ userId: cv.userId, attributeId, value: null, version: 1 });
    }

    await cv.update({ version: cv.version + 1 });

    const updatedCv = await fetchFullCv(id);
    const rendered = await CvBuilderService.render(updatedCv);
    res.status(201).json(rendered);
  });

  removeAttribute = asyncHandler(async (req, res) => {
    const { id, attributeId } = req.params;

    const cv = await CV.findByPk(id);
    if (!cv) throw ApiError.notFound('CV not found');
    CvController.assertCvOwner(req, cv, 'Only the owner can edit this CV');

    const cvAttr = await CVAttribute.findOne({ where: { cvId: id, attributeId } });
    if (!cvAttr) throw ApiError.notFound('Attribute not found in this CV');

    await cvAttr.destroy();
    await cv.update({ version: cv.version + 1 });

    const updatedCv = await fetchFullCv(id);
    const rendered = await CvBuilderService.render(updatedCv);
    res.status(200).json(rendered);
  });

  publish = asyncHandler(async (req, res) => {
    const cv = await CV.findByPk(req.params.id);
    if (!cv) throw ApiError.notFound('CV not found');
    CvController.assertCvOwner(req, cv, 'Only the owner can publish this CV');

    const position = await Position.findByPk(cv.positionId);
    const matches = await AccessRuleService.candidateMatches(position, cv.userId);
    if (!matches) {
      throw ApiError.badRequest('You do not meet the requirements for this position. Please update your profile attributes.');
    }

    const rendered = await CvBuilderService.render(cv);
    if (!CvBuilderService.isComplete(rendered)) {
      throw ApiError.badRequest('Fill in all required attributes before publishing');
    }

    cv.status = 'published';
    await cv.save();
    res.json(cv);
  });

  remove = asyncHandler(async (req, res) => {
    const cv = await CV.findByPk(req.params.id);
    if (!cv) throw ApiError.notFound('CV not found');
    CvController.assertCvOwner(req, cv, 'Only the owner can delete this CV');

    await cv.destroy();
    res.status(204).end();
  });

  like = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const recruiterId = req.user.id;

    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      throw ApiError.forbidden('Only recruiters can like CVs');
    }

    const cv = await CV.findByPk(id);
    if (!cv) throw ApiError.notFound('CV not found');

    const existing = await Like.findOne({ where: { cvId: id, recruiterId } });
    if (existing) {
      await Like.destroy({ where: { cvId: id, recruiterId } });
      return res.json({ likeCount: await recalcLikeCount(cv), liked: false });
    }

    await Like.create({ cvId: id, recruiterId });
    res.json({ likeCount: await recalcLikeCount(cv), liked: true });
  });

  unlike = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const cv = await CV.findByPk(id);
    if (!cv) throw ApiError.notFound('CV not found');

    await Like.destroy({ where: { cvId: id, recruiterId: req.user.id } });
    res.json({ likeCount: await recalcLikeCount(cv) });
  });

  updateProjects = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { projectIds } = req.body;

    const cv = await CV.findByPk(id);
    if (!cv) throw ApiError.notFound('CV not found');
    CvController.assertCvOwner(req, cv, 'Only the owner can edit this CV');

    const position = await Position.findByPk(cv.positionId);
    const maxProjects = position?.maxProjects;
    const projectTags = position?.projectTags || [];

    if (maxProjects === 0) {
      throw ApiError.badRequest('This position does not allow projects in CV');
    }

    const candidate = await User.findByPk(cv.userId, {
      include: [{ model: Project, as: 'projects' }]
    });

    if (projectTags.length === 0) {
      if (maxProjects !== null && maxProjects !== undefined && projectIds && projectIds.length > maxProjects) {
        throw ApiError.badRequest(`You can select up to ${maxProjects} projects`);
      }
      cv.selectedProjects = projectIds || [];
      await cv.save();
      return res.json({ selectedProjects: cv.selectedProjects });
    }

    const availableProjects = candidate.projects.filter((p) =>
      (p.tags || []).some((tag) => projectTags.includes(tag))
    );
    const availableProjectIds = availableProjects.map(p => p.id);

    const selectedIds = projectIds || [];
    const invalidProjects = selectedIds.filter(id => !availableProjectIds.includes(id));

    if (invalidProjects.length > 0) {
      const validSelected = selectedIds.filter(id => availableProjectIds.includes(id));
      cv.selectedProjects = validSelected;
      await cv.save();
      return res.json({
        selectedProjects: validSelected,
        warning: 'Some projects were removed because they do not match the required tags'
      });
    }

    if (maxProjects !== null && maxProjects !== undefined && selectedIds.length > maxProjects) {
      throw ApiError.badRequest(`You can select up to ${maxProjects} projects`);
    }

    cv.selectedProjects = selectedIds;
    await cv.save();

    res.json({ selectedProjects: cv.selectedProjects });
  });
}

export default new CvController();