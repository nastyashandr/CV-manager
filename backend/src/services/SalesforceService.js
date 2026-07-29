import axios from 'axios';
import { SalesforceSync } from '../models/index.js';

class SalesforceService {
  constructor() {
    this.instanceUrl = process.env.SALESFORCE_INSTANCE_URL;
    this.clientId = process.env.SALESFORCE_CLIENT_ID;
    this.clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    this.username = process.env.SALESFORCE_USERNAME;
    this.password = process.env.SALESFORCE_PASSWORD;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        'https://login.salesforce.com/services/oauth2/token',
        new URLSearchParams({
          grant_type: 'password',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          username: this.username,
          password: this.password
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.instanceUrl = response.data.instance_url;
      this.tokenExpiry = Date.now() + 50 * 60 * 1000;

      console.log('Salesforce access token obtained');
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Salesforce access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Salesforce');
    }
  }

  async makeRequest(method, endpoint, data = null) {
    const token = await this.getAccessToken();

    try {
      const response = await axios({
        method,
        url: `${this.instanceUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data
      });
      return response.data;
    } catch (error) {
      console.error(`Salesforce API error (${method} ${endpoint}):`, error.response?.data || error.message);
      throw new Error(`Salesforce API error: ${error.response?.data?.[0]?.message || error.message}`);
    }
  }

  async createAccount(companyName, description = '') {
    const accountData = {
      Name: companyName,
      Description: description || 'Created from CV Management System',
      Type: 'Customer',
      Industry: 'Technology'
    };

    const result = await this.makeRequest('POST', '/services/data/v58.0/sobjects/Account', accountData);
    return {
      id: result.id,
      success: result.success
    };
  }

  async createContact(contactData, accountId) {
    const contact = {
      FirstName: contactData.firstName,
      LastName: contactData.lastName,
      Email: contactData.email,
      Phone: contactData.phone || '',
      Title: contactData.title || '',
      AccountId: accountId,
      Description: contactData.interests || '',
      LeadSource: 'CV Management System'
    };

    const result = await this.makeRequest('POST', '/services/data/v58.0/sobjects/Contact', contact);
    return {
      id: result.id,
      success: result.success
    };
  }
  
  async updateContact(contactId, data) {
    const contact = {
      FirstName: data.firstName,
      LastName: data.lastName,
      Email: data.email,
      Phone: data.phone || '',
      Title: data.title || '',
      Description: data.interests || ''
    };

    await this.makeRequest('PATCH', `/services/data/v58.0/sobjects/Contact/${contactId}`, contact);
    return { success: true };
  }

  async syncUser(user, additionalData) {
    try {
      let sync = await SalesforceSync.findOne({
        where: { userId: user.id, isActive: true }
      });

      const companyName = additionalData.company || `${user.firstName} ${user.lastName}'s Company`;
      const contactData = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: additionalData.phone || '',
        title: additionalData.title || user.role || 'Candidate',
        interests: additionalData.interests || ''
      };

      if (!sync) {
        console.log(`Creating new Salesforce records for user ${user.email}`);

        const account = await this.createAccount(companyName, `Account created for ${user.firstName} ${user.lastName}`);
        const contact = await this.createContact(contactData, account.id);

        sync = await SalesforceSync.create({
          userId: user.id,
          accountId: account.id,
          contactId: contact.id,
          syncedAt: new Date(),
          additionalData: {
            company: companyName,
            ...additionalData
          }
        });

        return {
          success: true,
          accountId: account.id,
          contactId: contact.id,
          action: 'created'
        };
      } else {
        console.log(`🔄 Updating Salesforce Contact ${sync.contactId} for user ${user.email}`);

        await this.updateContact(sync.contactId, contactData);

        sync.syncedAt = new Date();
        sync.additionalData = {
          ...sync.additionalData,
          ...additionalData
        };
        await sync.save();

        return {
          success: true,
          accountId: sync.accountId,
          contactId: sync.contactId,
          action: 'updated'
        };
      }
    } catch (error) {
      console.error('Salesforce sync failed:', error);
      throw error;
    }
  }

  async getSyncStatus(userId) {
    const sync = await SalesforceSync.findOne({
      where: { userId, isActive: true }
    });

    if (!sync) {
      return { synced: false };
    }

    return {
      synced: true,
      accountId: sync.accountId,
      contactId: sync.contactId,
      syncedAt: sync.syncedAt,
      additionalData: sync.additionalData
    };
  }

  async deactivateSync(userId) {
    const sync = await SalesforceSync.findOne({
      where: { userId, isActive: true }
    });

    if (sync) {
      sync.isActive = false;
      await sync.save();
      return { success: true };
    }

    return { success: false, message: 'Sync not found' };
  }
}

export default new SalesforceService();