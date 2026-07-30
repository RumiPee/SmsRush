const jwt = require('jsonwebtoken');

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  console.error('SESSION_SECRET environment variable is not set');
  // Don't exit in production, but log error
}

function createSessionToken(userId) {
  if (!SESSION_SECRET) {
    throw new Error('SESSION_SECRET not configured');
  }
  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000) },
    SESSION_SECRET,
    { expiresIn: '1h' }
  );
}

function verifySessionToken(token) {
  if (!SESSION_SECRET) {
    return null;
  }
  try {
    const decoded = jwt.verify(token, SESSION_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
}

function authenticate(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return verifySessionToken(token);
}

module.exports = { createSessionToken, verifySessionToken, authenticate };
