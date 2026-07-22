import { CV, Position, PositionAttribute, Attribute, Project, User, CVAttribute } from '../models/index.js';
import ProfileService from './ProfileService.js';
import AccessRuleService from './AccessRuleService.js';

class CvBuilderService {
  static async createForCandidate(userId, positionId) {
    const position = await Position.findByPk(positionId, {
      include: [{ model: PositionAttribute, as: 'positionAttributes' }],
    });

    if (!position) {
      throw new Error('Position not found');
    }

    const attributeIds = position.positionAttributes.map((pa) => pa.attributeId);
    await ProfileService.ensureAttributeValues(userId, attributeIds);

    const candidate = await User.findByPk(userId, {
      include: [{ model: Project, as: 'projects' }]
    });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

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
      const sortedProjects = [...candidate.projects].sort((a, b) => {
        if (!a.periodStart && !b.periodStart) return 0;
        if (!a.periodStart) return 1;
        if (!b.periodStart) return -1;
        return new Date(b.periodStart) - new Date(a.periodStart);
      });

      if (maxProjects !== null && maxProjects !== undefined && maxProjects > 0) {
        selectedProjects = sortedProjects.slice(0, maxProjects).map(p => p.id);
      } else {
        selectedProjects = sortedProjects.map(p => p.id);
      }
    }

    return CV.create({
      userId,
      positionId,
      status: 'draft',
      selectedProjects: selectedProjects || [],
      about: ''
    });
  }

  static async loadRenderContext(cv) {
    if (!cv || !cv.positionId || !cv.userId) {
      throw new Error('Invalid CV data');
    }

    const [position, candidate, cvAttributes] = await Promise.all([
      Position.findByPk(cv.positionId, {
        include: [{
          model: PositionAttribute,
          as: 'positionAttributes',
          include: [{ model: Attribute, as: 'attribute' }],
        }],
      }),
      User.findByPk(cv.userId, {
        include: [{ model: Project, as: 'projects' }]
      }),
      CVAttribute.findAll({
        where: { cvId: cv.id },
        include: [{ model: Attribute, as: 'attribute' }]
      }),
    ]);

    return { position, candidate, cvAttributes: cvAttributes || [] };
  }

  static resolveAttributeValueSource(profileValue, profileVersion, cvAttr) {
    if (cvAttr && cvAttr.value !== undefined && cvAttr.value !== null) {
      return { value: cvAttr.value, version: cvAttr.version || 1 };
    }
    if (profileValue !== undefined && profileValue !== null) {
      return { value: profileValue, version: profileVersion || 1 };
    }
    return { value: null, version: 1 };
  }

  static async buildPositionAttributeSection(pa, candidate, accessRuleAttributeIds, cvAttrMap) {
    const { value: profileValue, version: profileVersion } = await ProfileService.resolveValueWithVersion(candidate, pa.attribute);
    const cvAttr = cvAttrMap.get(pa.attribute.id);
    const { value, version } = CvBuilderService.resolveAttributeValueSource(profileValue, profileVersion, cvAttr);

    return {
      attributeId: pa.attribute.id,
      name: pa.attribute.name,
      category: pa.attribute.category,
      type: pa.attribute.type,
      options: pa.attribute.options,
      required: pa.required || false,
      isBuiltin: pa.attribute.isBuiltin || false,
      isAccessRule: accessRuleAttributeIds.has(pa.attribute.id),
      isCandidateAdded: false,
      value: value !== undefined ? value : null,
      version,
    };
  }

  static buildCandidateAddedSection(ca) {
    return {
      attributeId: ca.attribute.id,
      name: ca.attribute.name,
      category: ca.attribute.category,
      type: ca.attribute.type,
      options: ca.attribute.options,
      required: false,
      isBuiltin: ca.attribute.isBuiltin || false,
      isAccessRule: false,
      isCandidateAdded: true,
      value: ca.value !== undefined && ca.value !== null ? ca.value : null,
      version: ca.version || 1,
    };
  }

  static async buildAttributeSections(position, candidate, cvAttributes) {
    if (!position || !position.positionAttributes) {
      return [];
    }

    const accessRuleAttributeIds = new Set((position.accessRules || []).map((r) => r.attributeId));
    const positionAttrIds = new Set(position.positionAttributes.map((pa) => pa.attributeId));
    const cvAttrMap = new Map(cvAttributes.map((ca) => [ca.attributeId, ca]));
    const sortedAttrs = [...position.positionAttributes].sort((a, b) => a.order - b.order);

    const sections = [];
    for (const pa of sortedAttrs) {
      sections.push(await CvBuilderService.buildPositionAttributeSection(pa, candidate, accessRuleAttributeIds, cvAttrMap));
    }
    for (const ca of cvAttributes || []) {
      if (!positionAttrIds.has(ca.attributeId)) {
        sections.push(CvBuilderService.buildCandidateAddedSection(ca));
      }
    }
    return sections;
  }

  static selectProjects(allProjects, selectedProjectIds, maxProjects, projectTags) {
    if (!allProjects || !allProjects.length || !selectedProjectIds || !selectedProjectIds.length) {
      return [];
    }

    let filtered = allProjects.filter((p) => selectedProjectIds.includes(p.id));

    if (projectTags && projectTags.length > 0) {
      filtered = filtered.filter((p) =>
        (p.tags || []).some((tag) => projectTags.includes(tag))
      );
    }

    filtered.sort((a, b) => {
      if (!a.periodStart && !b.periodStart) return 0;
      if (!a.periodStart) return 1;
      if (!b.periodStart) return -1;
      return new Date(b.periodStart) - new Date(a.periodStart);
    });

    if (maxProjects !== null && maxProjects !== undefined && maxProjects > 0) {
      return filtered.slice(0, maxProjects);
    }
    return filtered;
  }

  static async render(cv) {
    if (!cv) {
      throw new Error('CV is required');
    }

    const { position, candidate, cvAttributes } = await CvBuilderService.loadRenderContext(cv);

    if (!position) {
      throw new Error('Position not found for CV');
    }
    if (!candidate) {
      throw new Error('Candidate not found for CV');
    }

    const matchesRules = await AccessRuleService.candidateMatches(position, candidate.id);
    const attributes = await CvBuilderService.buildAttributeSections(position, candidate, cvAttributes || []);

    const allProjects = candidate.projects || [];
    const selectedProjectIds = cv.selectedProjects || [];
    const projectTags = position.projectTags || [];
    const projects = CvBuilderService.selectProjects(allProjects, selectedProjectIds, position.maxProjects, projectTags);

    return {
      id: cv.id,
      status: cv.status,
      matchesRules,
      position: {
        id: position.id,
        title: position.title,
        shortDescription: position.shortDescription,
        maxProjects: position.maxProjects,
        projectTags: position.projectTags || [],
      },
      candidate: {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        photoUrl: candidate.photoUrl,
        location: candidate.location,
        email: candidate.email,
      },
      attributes: attributes || [],
      projects: projects || [],
      allProjects: allProjects || [],
      selectedProjects: selectedProjectIds || [],
    };
  }

  static isComplete(rendered) {
    if (!rendered || !rendered.attributes) return false;

    const requiredAttrs = rendered.attributes.filter(a => a.required === true);
    if (requiredAttrs.length === 0) return true;

    return requiredAttrs.every((a) => {
      const val = a.value;
      if (val === null || val === undefined || val === '') return false;

      if (a.type === 'period') {
        return val.start && val.start !== '' && val.end && val.end !== '';
      }
      if (a.type === 'select') {
        return val !== '' && val !== null && val !== undefined;
      }
      if (a.type === 'boolean') {
        return val === true || val === false;
      }
      if (a.type === 'number') {
        return val !== '' && val !== null && val !== undefined;
      }
      return true;
    });
  }
}

export default CvBuilderService;