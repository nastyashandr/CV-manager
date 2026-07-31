const TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token';
const UPLOAD_URL = 'https://content.dropboxapi.com/2/files/upload';

class DropboxService {
  static tokenCache = null;

  static isConfigured() {
    return Boolean(
      process.env.DROPBOX_APP_KEY &&
      process.env.DROPBOX_APP_SECRET &&
      process.env.DROPBOX_REFRESH_TOKEN
    );
  }

  static async authenticate() {
    if (DropboxService.tokenCache && DropboxService.tokenCache.expiresAt > Date.now()) {
      return DropboxService.tokenCache.accessToken;
    }

    if (!DropboxService.isConfigured()) {
      throw new Error('Dropbox integration is not configured (missing DROPBOX_* environment variables)');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.DROPBOX_REFRESH_TOKEN,
      client_id: process.env.DROPBOX_APP_KEY,
      client_secret: process.env.DROPBOX_APP_SECRET,
    });

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(`Dropbox authentication failed: ${data.error_description || data.error || response.statusText}`);
    }

    DropboxService.tokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + ((data.expires_in || 14400) - 120) * 1000,
    };

    return DropboxService.tokenCache.accessToken;
  }

  static async uploadJson(fileName, data) {
    const accessToken = await DropboxService.authenticate();
    const folder = (process.env.DROPBOX_FOLDER || '/support-tickets').replace(/\/$/, '');
    const path = `${folder}/${fileName}`;

    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({ path, mode: 'add', autorename: true, mute: false }),
      },
      body: JSON.stringify(data, null, 2),
    });

    const raw = await response.text();
    const result = raw ? JSON.parse(raw) : null;

    if (!response.ok) {
      const message = result?.error_summary || response.statusText;
      throw new Error(`Dropbox upload failed (${response.status}): ${message}`);
    }

    return result;
  }
}

export default DropboxService;