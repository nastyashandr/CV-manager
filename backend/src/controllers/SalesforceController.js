import SalesforceService from '../services/SalesforceService.js';
import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

class SalesforceController {
  getStatus = asyncHandler(async (req, res) => {
    const status = await SalesforceService.getSyncStatus(req.user.id);
    res.json(status);
  });

  sync = asyncHandler(async (req, res) => {
    const { company, phone, title, interests } = req.body;

    if (!company || !company.trim()) {
      throw ApiError.badRequest('Company name is required');
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const additionalData = {
      company: company.trim(),
      phone: phone || '',
      title: title || '',
      interests: interests || ''
    };

    const result = await SalesforceService.syncUser(user, additionalData);

    res.status(200).json({
      success: true,
      message: result.action === 'created'
        ? 'User successfully exported to Salesforce'
        : 'User data updated in Salesforce',
      ...result
    });
  });

  deactivate = asyncHandler(async (req, res) => {
    const result = await SalesforceService.deactivateSync(req.user.id);

    if (!result.success) {
      throw ApiError.notFound('Sync not found');
    }

    res.json({
      success: true,
      message: 'Salesforce sync deactivated'
    });
  });
}

export default new SalesforceController();