const DROPBOX_APP_KEY    = 'hsh02lulfgjcug6';
const DROPBOX_APP_SECRET = 'smpgjd7y3bxoupc';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: 'Invalid JSON' }; }

  const { refresh_token } = body;
  if (!refresh_token) return { statusCode: 400, body: 'Missing refresh_token' };

  try {
    const credentials = Buffer.from(`${DROPBOX_APP_KEY}:${DROPBOX_APP_SECRET}`).toString('base64');

    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token,
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error_description || 'Refresh failed');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: data.access_token,
        expires_in:   data.expires_in,
      }),
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
