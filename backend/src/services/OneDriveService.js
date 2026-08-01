const TOKEN_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const SCOPE = 'offline_access Files.ReadWrite';

class OneDriveService {
  static tokenCache = null;

  static isConfigured() {
    return Boolean(
      process.env.ONEDRIVE_CLIENT_ID &&
      process.env.ONEDRIVE_CLIENT_SECRET &&
      process.env.ONEDRIVE_REFRESH_TOKEN
    );
  }

  static async authenticate() {
    if (OneDriveService.tokenCache && OneDriveService.tokenCache.expiresAt > Date.now()) {
      return OneDriveService.tokenCache.accessToken;
    }

    if (!OneDriveService.isConfigured()) {
      throw new Error('OneDrive integration is not configured (missing ONEDRIVE_* environment variables)');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.ONEDRIVE_REFRESH_TOKEN,
      client_id: process.env.ONEDRIVE_CLIENT_ID,
      client_secret: process.env.ONEDRIVE_CLIENT_SECRET,
      scope: SCOPE,
    });

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(`OneDrive authentication failed: ${data.error_description || data.error || response.statusText}`);
    }

    if (data.refresh_token) {
      OneDriveService.tokenCache = OneDriveService.tokenCache || {};
      OneDriveService.latestRefreshToken = data.refresh_token;
    }

    OneDriveService.tokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + ((data.expires_in || 3600) - 120) * 1000,
    };

    return OneDriveService.tokenCache.accessToken;
  }

  static async uploadJson(fileName, data) {
    const accessToken = await OneDriveService.authenticate();
    const folder = (process.env.ONEDRIVE_FOLDER || 'support-tickets').replace(/^\/|\/$/g, '');
    const path = `${folder}/${fileName}`;

    const response = await fetch(
      `${GRAPH_BASE}/me/drive/root:/${path}:/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data, null, 2),
      }
    );

    const raw = await response.text();
    const result = raw ? JSON.parse(raw) : null;

    if (!response.ok) {
      const message = result?.error?.message || response.statusText;
      throw new Error(`OneDrive upload failed (${response.status}): ${message}`);
    }

    return result;
  }
}

export default OneDriveService;