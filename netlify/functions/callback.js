const DROPBOX_APP_KEY    = 'hsh02lulfgjcug6';
const DROPBOX_APP_SECRET = 'smpgjd7y3bxoupc';
const REDIRECT_URI       = 'https://demobox-jp.netlify.app/callback';

exports.handler = async (event) => {
  const code = event.queryStringParameters && event.queryStringParameters.code;

  if (!code) {
    return { statusCode: 400, body: 'Missing code parameter' };
  }

  try {
    const credentials = Buffer.from(`${DROPBOX_APP_KEY}:${DROPBOX_APP_SECRET}`).toString('base64');

    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || 'Token exchange failed');
    }

    // Send tokens back to the app via postMessage-friendly redirect
    const html = `<!DOCTYPE html>
<html>
<head><title>DEMOBOX — Connecting...</title>
<style>
  body { background: #f2ece0; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
  .msg { text-align: center; color: #1a1612; }
  .msg h2 { font-size: 1.4rem; margin-bottom: 0.5rem; }
  .msg p  { font-size: 0.75rem; color: #9a9088; }
</style>
</head>
<body>
<div class="msg">
  <h2>✓ Connected to Dropbox</h2>
  <p>You can close this tab and return to DEMOBOX.</p>
</div>
<script>
  const tokens = ${JSON.stringify({
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    expires_in:    data.expires_in,
    token_type:    data.token_type,
  })};
  if (window.opener) {
    window.opener.postMessage({ type: 'DROPBOX_AUTH', tokens }, '*');
    setTimeout(() => window.close(), 1500);
  }
</script>
</body>
</html>`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: html,
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: `Auth error: ${err.message}`,
    };
  }
};
