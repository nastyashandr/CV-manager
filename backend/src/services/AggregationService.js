import { Position, PositionAttribute, Attribute, CV, CVAttribute } from '../models/index.js';

function topValues(values, limit = 5) {
  const counts = new Map();
  for (const v of values) {
    const key = String(v);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function aggregateNumbers(values) {
  const nums = values.map(Number).filter((n) => !Number.isNaN(n));
  if (!nums.length) return { count: 0 };
  const sum = nums.reduce((a, b) => a + b, 0);
  return {
    count: nums.length,
    avg: Math.round((sum / nums.length) * 100) / 100,
    min: Math.min(...nums),
    max: Math.max(...nums),
  };
}

function aggregateBoolean(values) {
  const bools = values.filter((v) => typeof v === 'boolean');
  return {
    count: bools.length,
    trueCount: bools.filter(Boolean).length,
    falseCount: bools.filter((v) => !v).length,
  };
}

function aggregateDates(values) {
  const dates = values.filter(Boolean).sort();
  if (!dates.length) return { count: 0 };
  return { count: dates.length, min: dates[0], max: dates[dates.length - 1] };
}

function aggregatePeriods(values) {
  const starts = values.map((v) => v?.start).filter(Boolean).sort();
  const ends = values.map((v) => v?.end).filter(Boolean).sort();
  const count = values.filter((v) => v?.start || v?.end).length;
  if (!count) return { count: 0 };
  return {
    count,
    min: starts[0] || null,
    max: ends[ends.length - 1] || null,
  };
}

function aggregateText(values) {
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (!nonEmpty.length) return { count: 0, topValues: [] };
  return { count: nonEmpty.length, topValues: topValues(nonEmpty) };
}

function aggregateByType(type, values) {
  switch (type) {
    case 'number':
      return aggregateNumbers(values);
    case 'boolean':
      return aggregateBoolean(values);
    case 'date':
      return aggregateDates(values);
    case 'period':
      return aggregatePeriods(values);
    case 'string':
    case 'text':
    case 'select':
      return aggregateText(values);
    case 'image':
      return { count: values.filter(Boolean).length };
    default:
      return { count: values.filter(Boolean).length };
  }
}

class AggregationService {
  static async findPositionByToken(token) {
    if (!token) return null;
    return Position.findOne({ where: { apiToken: token } });
  }

  static async buildPositionAggregate(position) {
    const positionAttributes = await PositionAttribute.findAll({
      where: { positionId: position.id },
      include: [{ model: Attribute, as: 'attribute' }],
      order: [['order', 'ASC']],
    });

    const publishedCvs = await CV.findAll({
      where: { positionId: position.id, status: 'published' },
      include: [{ model: CVAttribute, as: 'cvAttributes' }],
    });

    const attributes = positionAttributes.map((pa) => {
      const values = publishedCvs
        .map((cv) => cv.cvAttributes.find((ca) => ca.attributeId === pa.attributeId)?.value)
        .filter((v) => v !== null && v !== undefined);

      return {
        name: pa.attribute.name,
        type: pa.attribute.type,
        required: pa.required,
        aggregate: aggregateByType(pa.attribute.type, values),
      };
    });

    return {
      position: {
        id: position.id,
        title: position.title,
        shortDescription: position.shortDescription,
      },
      cvCount: publishedCvs.length,
      attributes,
      generatedAt: new Date().toISOString(),
    };
  }
}

export default AggregationService;