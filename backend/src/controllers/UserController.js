import { User, Project, ProfileAttributeValue, Attribute, CV, Position } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import ProfileService from '../services/ProfileService.js';
import AccessRuleService from '../services/AccessRuleService.js';

class UserController {
  static async assertOwnerOrAdmin(req, targetId) {
    if (req.user.id === targetId || req.user.isAdmin()) return;
    throw ApiError.forbidden('You may only manage your own profile');
  }

  static async revalidateUserCVs(userId) {
    const cvs = await CV.findAll({
      where: { userId, status: 'published' },
      include: [{ model: Position, as: 'position' }],
    });

    let deletedCount = 0;
    for (const cv of cvs) {
      if (!cv.position) continue;
      const matches = await AccessRuleService.candidateMatches(cv.position, userId);
      if (!matches) {
        await cv.destroy();
        deletedCount++;
      }
    }
    return deletedCount;
  }

  getProfile = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Project, as: 'projects' }],
    });
    if (!user) throw ApiError.notFound('User not found');

    const attributeValues = await ProfileService.getFullProfile(user.id);
    const isOwnerView = req.user && (req.user.id === user.id || req.user.isAdmin());
    res.json({
      user: user.toPublicJSON(),
      projects: user.projects,
      attributeValues,
      isOwnerView
    });
  });

  updateMe = asyncHandler(async (req, res) => {
    await UserController.assertOwnerOrAdmin(req, req.params.id);
    const user = await User.findByPk(req.params.id);
    if (!user) throw ApiError.notFound('User not found');

    const { firstName, lastName, location, photoUrl, locale, theme } = req.body;

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (location !== undefined) user.location = location;
    if (photoUrl !== undefined) user.photoUrl = photoUrl;
    if (locale !== undefined) user.locale = locale;
    if (theme !== undefined) user.theme = theme;

    user.version = user.version + 1;
    await user.save();

    await UserController.revalidateUserCVs(req.params.id);
    res.json(user.toPublicJSON());
  });

  addAttribute = asyncHandler(async (req, res) => {
    await UserController.assertOwnerOrAdmin(req, req.params.id);
    const { attributeId } = req.body;
    const attribute = await Attribute.findByPk(attributeId);
    if (!attribute) throw ApiError.notFound('Attribute not found');

    const [row] = await ProfileAttributeValue.findOrCreate({
      where: { userId: req.params.id, attributeId },
      defaults: { value: null, version: 1 },
    });
    await attribute.increment('usageCount');
    await UserController.revalidateUserCVs(req.params.id);

    res.status(201).json(row);
  });

  removeAttribute = asyncHandler(async (req, res) => {
    await UserController.assertOwnerOrAdmin(req, req.params.id);
    await ProfileAttributeValue.destroy({
      where: { userId: req.params.id, attributeId: req.params.attributeId },
    });
    await UserController.revalidateUserCVs(req.params.id);
    res.status(204).end();
  });

  setAttributeValue = asyncHandler(async (req, res) => {
    await UserController.assertOwnerOrAdmin(req, req.params.id);
    const row = await ProfileAttributeValue.findOne({
      where: { userId: req.params.id, attributeId: req.params.attributeId },
    });
    if (!row) throw ApiError.notFound('Attribute is not part of this profile');

    const { value } = req.body;
    row.value = value;
    row.version = row.version + 1;
    await row.save();

    await UserController.revalidateUserCVs(req.params.id);
    res.json(row);
  });

  listProjects = asyncHandler(async (req, res) => {
    res.json(await Project.findAll({ where: { userId: req.params.id }, order: [['periodStart', 'DESC']] }));
  });

  createProject = asyncHandler(async (req, res) => {
    await UserController.assertOwnerOrAdmin(req, req.params.id);
    const { name, periodStart, periodEnd, description, tags } = req.body;
    if (!name) throw ApiError.badRequest('Project name is required');

    const project = await Project.create({
      userId: req.params.id,
      name,
      periodStart: periodStart || null,
      periodEnd: periodEnd || null,
      description: description || '',
      tags: tags || [],
    });
    res.status(201).json(project);
  });

  updateProject = asyncHandler(async (req, res) => {
    await UserController.assertOwnerOrAdmin(req, req.params.id);
    const project = await Project.findOne({ where: { id: req.params.projectId, userId: req.params.id } });
    if (!project) throw ApiError.notFound('Project not found');

    const { name, periodStart, periodEnd, description, tags } = req.body;
    if (name !== undefined) project.name = name;
    if (periodStart !== undefined) project.periodStart = periodStart;
    if (periodEnd !== undefined) project.periodEnd = periodEnd;
    if (description !== undefined) project.description = description;
    if (tags !== undefined) project.tags = tags;
    project.version = project.version + 1;
    await project.save();

    res.json(project);
  });

  deleteProject = asyncHandler(async (req, res) => {
    await UserController.assertOwnerOrAdmin(req, req.params.id);
    await Project.destroy({ where: { id: req.params.projectId, userId: req.params.id } });
    res.status(204).end();
  });

  projectTags = asyncHandler(async (req, res) => {
    const [projects, positions] = await Promise.all([
      Project.findAll({ attributes: ['tags'] }),
      Position.findAll({ attributes: ['projectTags'] }),
    ]);
    const set = new Set(projects.flatMap((p) => p.tags || []));
    positions.forEach((p) => (p.projectTags || []).forEach((t) => set.add(t)));
    res.json([...set].sort());
  });

  listUsers = asyncHandler(async (req, res) => {
    res.json(await User.findAll({ order: [['createdAt', 'DESC']] }));
  });

  setRole = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) throw ApiError.notFound('User not found');
    user.role = req.body.role;
    await user.save();
    res.json(user.toPublicJSON());
  });

  setBlocked = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) throw ApiError.notFound('User not found');
    user.isBlocked = req.body.isBlocked;
    await user.save();
    res.json(user.toPublicJSON());
  });

  deleteUser = asyncHandler(async (req, res) => {
    await User.destroy({ where: { id: req.params.id } });
    res.status(204).end();
  });
}

export default new UserController();