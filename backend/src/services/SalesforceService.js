const API_VERSION = 'v59.0';

class SalesforceService {
  static tokenCache = null;

  static isConfigured() {
    return Boolean(
      process.env.SF_LOGIN_URL &&
      process.env.SF_CLIENT_ID &&
      process.env.SF_CLIENT_SECRET
    );
  }

  static async authenticate() {
    if (SalesforceService.tokenCache && SalesforceService.tokenCache.expiresAt > Date.now()) {
      return SalesforceService.tokenCache;
    }

    if (!SalesforceService.isConfigured()) {
      throw new Error('Salesforce integration is not configured (missing SF_* environment variables)');
    }

    const loginUrl = process.env.SF_LOGIN_URL;
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SF_CLIENT_ID,
      client_secret: process.env.SF_CLIENT_SECRET,
    });

    const response = await fetch(`${loginUrl}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(`Salesforce authentication failed: ${data.error_description || data.error || response.statusText}`);
    }

    SalesforceService.tokenCache = {
      accessToken: data.access_token,
      instanceUrl: data.instance_url,
      expiresAt: Date.now() + 25 * 60 * 1000,
    };

    return SalesforceService.tokenCache;
  }

  static async request(method, path, body) {
    const { accessToken, instanceUrl } = await SalesforceService.authenticate();

    const response = await fetch(`${instanceUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) return null;

    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : null;

    if (!response.ok) {
      const message = Array.isArray(data)
        ? data.map((e) => e.message).join('; ')
        : response.statusText;
      throw new Error(`Salesforce API error (${response.status}): ${message}`);
    }

    return data;
  }

  static async createAccount(name) {
    const result = await SalesforceService.request(
      'POST',
      `/services/data/${API_VERSION}/sobjects/Account/`,
      { Name: name }
    );
    return result.id;
  }

  static async updateAccount(accountId, name) {
    await SalesforceService.request(
      'PATCH',
      `/services/data/${API_VERSION}/sobjects/Account/${accountId}`,
      { Name: name }
    );
    return accountId;
  }

  static buildContactPayload({ accountId, firstName, lastName, email, phone, title, country, description }) {
    return {
      AccountId: accountId,
      FirstName: firstName || undefined,
      LastName: lastName || 'N/A',
      Email: email || undefined,
      Phone: phone || undefined,
      Title: title || undefined,
      MailingCity: country || undefined,
      Description: description || undefined,
    };
  }

  static async createContact(fields) {
    const result = await SalesforceService.request(
      'POST',
      `/services/data/${API_VERSION}/sobjects/Contact/`,
      SalesforceService.buildContactPayload(fields)
    );
    return result.id;
  }

  static async updateContact(contactId, fields) {
    await SalesforceService.request(
      'PATCH',
      `/services/data/${API_VERSION}/sobjects/Contact/${contactId}`,
      SalesforceService.buildContactPayload(fields)
    );
    return contactId;
  }

  static async syncUserProfile(user, formData = {}) {
    const companyName =
      formData.companyName?.trim() ||
      `${user.firstName} ${user.lastName}`.trim() ||
      user.email;

    const contactFields = {
      firstName: user.firstName,
      lastName: user.lastName || user.email.split('@')[0],
      email: user.email,
      phone: formData.phone,
      title: formData.jobTitle,
      country: formData.country,
      description: formData.notes,
    };

    let accountId;
    let contactId;

    if (user.salesforceAccountId) {
      accountId = await SalesforceService.updateAccount(user.salesforceAccountId, companyName);
    } else {
      accountId = await SalesforceService.createAccount(companyName);
    }

    if (user.salesforceContactId) {
      contactId = await SalesforceService.updateContact(user.salesforceContactId, { ...contactFields, accountId });
    } else {
      contactId = await SalesforceService.createContact({ ...contactFields, accountId });
    }

    return { accountId, contactId };
  }
}

export default SalesforceService;