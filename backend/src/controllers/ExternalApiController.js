import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import AggregationService from '../services/AggregationService.js';

class ExternalApiController {
  positionAggregate = asyncHandler(async (req, res) => {
    const token = req.query.token || req.headers['x-api-token'];
    if (!token) throw ApiError.badRequest('API token is required (?token=... or X-Api-Token header)');

    const position = await AggregationService.findPositionByToken(token);
    if (!position) throw ApiError.unauthorized('Invalid API token');

    const data = await AggregationService.buildPositionAggregate(position);
    res.json(data);
  });
}

export default new ExternalApiController();