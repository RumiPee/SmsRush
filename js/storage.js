const STORAGE_PREFIX = 'sms_rush_';

export function getItem(key) {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('Failed to store item', e);
  }
}

export function removeItem(key) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch (e) {
    console.warn('Failed to remove item', e);
  }
}

export function getAllKeys() {
  try {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .map(key => key.slice(STORAGE_PREFIX.length));
  } catch {
    return [];
  }
}

export function clearAll() {
  try {
    const keys = getAllKeys();
    keys.forEach(key => removeItem(key));
  } catch (e) {
    console.warn('Failed to clear storage', e);
  }
}

// Campaigns
export function getCampaigns() {
  return getItem('campaigns') || [];
}
export function setCampaigns(campaigns) {
  setItem('campaigns', campaigns);
}

// Contacts
export function getContacts() {
  return getItem('contacts') || [];
}
export function setContacts(contacts) {
  setItem('contacts', contacts);
}

// Templates
export function getTemplates() {
  return getItem('templates') || [];
}
export function setTemplates(templates) {
  setItem('templates', templates);
}

// History
export function getHistory() {
  return getItem('history') || [];
}
export function setHistory(history) {
  setItem('history', history);
}
