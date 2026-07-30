const crypto = require('crypto');
const { createSessionToken } = require('./session');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN environment variable is not set');
}

function verifyTelegramInitData(initData) {
  if (!BOT_TOKEN) return false;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return false;

  params.delete('hash');

  const keys = Array.from(params.keys()).sort();
  const dataCheckString = keys.map(key => `${key}=${params.get(key)}`).join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
}

function isAuthDateValid(initData) {
  const params = new URLSearchParams(initData);
  const authDate = parseInt(params.get('auth_date'), 10);
  if (!authDate) return false;
  const now = Math.floor(Date.now() / 1000);
  return (now - authDate) < 86400; // 24 hours
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { initData } = JSON.parse(event.body);
    if (!initData) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request' }) };
    }

    if (!verifyTelegramInitData(initData)) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Authentication failed' }) };
    }

    if (!isAuthDateValid(initData)) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Authentication failed' }) };
    }

    // Extract user ID
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    let userId = null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userId = user.id || null;
      } catch (e) { /* ignore */ }
    }

    const sessionToken = createSessionToken(userId || 'anonymous');

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionToken }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (err) {
    console.error('Verification error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
