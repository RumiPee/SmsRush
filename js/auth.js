import { getWebApp } from './telegram.js';

export async function authenticate() {
  const webApp = getWebApp();
  if (!webApp) {
    throw new Error('Telegram WebApp not available');
  }

  const initData = webApp.initData;
  if (!initData) {
    throw new Error('No initData available');
  }

  const response = await fetch('/.netlify/functions/verify-telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Authentication failed');
  }

  const data = await response.json();
  return data.sessionToken;
}

export function getSessionToken() {
  try {
    return sessionStorage.getItem('sms_rush_session');
  } catch {
    return null;
  }
}

export function setSessionToken(token) {
  try {
    sessionStorage.setItem('sms_rush_session', token);
  } catch (e) {
    console.warn('Failed to store session token', e);
  }
}

export function clearSessionToken() {
  try {
    sessionStorage.removeItem('sms_rush_session');
  } catch (e) {
    console.warn('Failed to clear session token', e);
  }
}

export function getAuthHeader() {
  const token = getSessionToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}
