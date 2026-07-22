import { QueryTypes } from 'sequelize';
import { sequelize } from '../models/index.js';

const POSITIONS_QUERY = `SELECT id, title, "shortDescription", "projectTags"
  FROM positions
  WHERE LOWER(title) LIKE LOWER(:term)
     OR LOWER("shortDescription") LIKE LOWER(:term)
  ORDER BY "createdAt" DESC LIMIT 20`;

const CVS_BY_TERM_QUERY = `SELECT DISTINCT
    c.id, c."userId", c."positionId", c.status, c."createdAt", c."likesCount",
    u."firstName", u."lastName", u."photoUrl", u.email,
    p.title as "positionTitle"
   FROM cvs c
   JOIN users u ON u.id = c."userId"
   JOIN positions p ON p.id = c."positionId"
   WHERE c.status = 'published'
     AND (LOWER(p.title) LIKE LOWER(:term)
      OR LOWER(p."shortDescription") LIKE LOWER(:term))
   LIMIT 20`;

const CVS_BY_TAG_QUERY = `SELECT DISTINCT
    c.id, c."userId", c."positionId", c.status, c."createdAt", c."likesCount",
    u."firstName", u."lastName", u."photoUrl", u.email,
    p.title as "positionTitle"
   FROM cvs c
   JOIN users u ON u.id = c."userId"
   JOIN positions p ON p.id = c."positionId"
   WHERE c.status = 'published'
     AND LOWER(:tag) = ANY(LOWER(p."projectTags"))
   LIMIT 20`;

const POSITIONS_BY_TAG_QUERY = `SELECT id, title, "shortDescription", "projectTags"
  FROM positions
  WHERE LOWER(:tag) = ANY(LOWER("projectTags"))
  ORDER BY "createdAt" DESC LIMIT 20`;

function groupCvRowsByUser(rows) {
  const grouped = new Map();
  for (const row of rows || []) {
    if (!grouped.has(row.userId)) {
      grouped.set(row.userId, {
        id: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
        photoUrl: row.photoUrl,
        email: row.email,
        cvs: [],
      });
    }
    grouped.get(row.userId).cvs.push({
      id: row.id,
      positionId: row.positionId,
      positionTitle: row.positionTitle,
      status: row.status,
      likeCount: parseInt(row.likesCount) || 0,
    });
  }
  return Array.from(grouped.values());
}

class SearchService {
  static async searchPositions(term) {
    try {
      const result = await sequelize.query(POSITIONS_QUERY, {
        replacements: { term: `%${term}%` },
        type: QueryTypes.SELECT,
      });
      return result || [];
    } catch {
      return [];
    }
  }

  static async searchCvsByPositionTitle(term) {
    try {
      const cvs = await sequelize.query(CVS_BY_TERM_QUERY, {
        replacements: { term: `%${term}%` },
        type: QueryTypes.SELECT,
      });
      return groupCvRowsByUser(cvs);
    } catch {
      return [];
    }
  }

  static async searchByTag(tag) {
    try {
      const [cvs, positions] = await Promise.all([
        sequelize.query(CVS_BY_TAG_QUERY, { replacements: { tag }, type: QueryTypes.SELECT }),
        sequelize.query(POSITIONS_BY_TAG_QUERY, { replacements: { tag }, type: QueryTypes.SELECT }),
      ]);
      return { positions: positions || [], candidates: groupCvRowsByUser(cvs) };
    } catch {
      return { positions: [], candidates: [] };
    }
  }

  static async searchAll(term, userRole) {
    const isRecruiter = userRole === 'recruiter' || userRole === 'admin';
    if (isRecruiter) {
      return { positions: [], candidates: await SearchService.searchCvsByPositionTitle(term) };
    }
    return { positions: await SearchService.searchPositions(term), candidates: [] };
  }
}

export default SearchService;
