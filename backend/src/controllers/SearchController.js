import asyncHandler from '../utils/asyncHandler.js';
import SearchService from '../services/SearchService.js';

class SearchController {
  search = asyncHandler(async (req, res) => {
    try {
      const term = (req.query.q || '').trim();
      if (!term) return res.json({ positions: [], candidates: [] });

      const userRole = req.user?.role || 'candidate';
      const result = await SearchService.searchAll(term, userRole);

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Search failed', error: error.message });
    }
  });
}

export default new SearchController();
