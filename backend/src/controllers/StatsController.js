import { Op } from 'sequelize';
import { Position, User, CV, Project } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';

function countTags(records, field) {
  const counts = new Map();
  records.forEach((record) => (record[field] || []).forEach((tag) => {
    counts.set(tag, (counts.get(tag) || 0) + 1);
  }));
  return counts;
}

function mergeCounts(target, source) {
  for (const [tag, count] of source) {
    target.set(tag, (target.get(tag) || 0) + count);
  }
  return target;
}

class StatsController {
  summary = asyncHandler(async (req, res) => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [positions, candidates, recruiters, cvs, cvsLast24h] = await Promise.all([
      Position.count(),
      User.count({ where: { role: 'candidate' } }),
      User.count({ where: { role: 'recruiter' } }),
      CV.count(),
      CV.count({ where: { createdAt: { [Op.gte]: since } } }),
    ]);
    res.json({ positions, candidates, recruiters, cvs, cvsLast24h });
  });

  tagCloud = asyncHandler(async (req, res) => {
    const [projects, positions] = await Promise.all([
      Project.findAll({ attributes: ['tags'] }),
      Position.findAll({ attributes: ['projectTags'] }),
    ]);

    const allTags = mergeCounts(
      countTags(projects, 'tags'),
      countTags(positions, 'projectTags')
    );

    const cloud = [...allTags.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    res.json(cloud.slice(0, 40));
  });
}

export default new StatsController();
