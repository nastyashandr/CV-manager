import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import DropboxService from '../services/DropboxService.js';

const VALID_PRIORITIES = ['High', 'Average', 'Low'];

class SupportTicketController {
  create = asyncHandler(async (req, res) => {
    const { summary, priority, positionTitle, link } = req.body;

    if (!summary || !summary.trim()) throw ApiError.badRequest('Summary is required');
    if (!VALID_PRIORITIES.includes(priority)) throw ApiError.badRequest('Priority must be High, Average or Low');

    const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['email'] });
    const adminEmails = admins.map((a) => a.email).filter(Boolean);

    const ticket = {
      reportedBy: `${req.user.firstName} ${req.user.lastName} (${req.user.role}) <${req.user.email}>`,
      position: positionTitle || null,
      link: link || null,
      priority,
      summary: summary.trim(),
      adminEmails,
      createdAt: new Date().toISOString(),
    };

    const fileName = `ticket-${Date.now()}-${req.user.id.slice(0, 8)}.json`;

    try {
      await DropboxService.uploadJson(fileName, ticket);
    } catch (err) {
      throw new ApiError(502, `Failed to upload ticket: ${err.message}`);
    }

    res.status(201).json({ success: true, fileName });
  });
}

export default new SupportTicketController();