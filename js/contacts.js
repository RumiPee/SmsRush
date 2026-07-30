import { getContacts, setContacts } from './storage.js';

export function addContact(data) {
  const contacts = getContacts();
  const contact = {
    id: 'cont_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    name: data.name,
    phone: data.phone,
    group: data.group || 'General',
    consentStatus: data.consentStatus || 'Pending',
    consentDate: data.consentStatus === 'Confirmed Opt-In' ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  contacts.unshift(contact);
  setContacts(contacts);
  return contact;
}

export function updateContact(id, updates) {
  const contacts = getContacts();
  const index = contacts.findIndex(c => c.id === id);
  if (index === -1) return null;
  if (updates.consentStatus === 'Confirmed Opt-In' && contacts[index].consentStatus !== 'Confirmed Opt-In') {
    updates.consentDate = new Date().toISOString();
  }
  contacts[index] = { ...contacts[index], ...updates, updatedAt: new Date().toISOString() };
  setContacts(contacts);
  return contacts[index];
}

export function deleteContact(id) {
  let contacts = getContacts();
  contacts = contacts.filter(c => c.id !== id);
  setContacts(contacts);
}

export function getContact(id) {
  const contacts = getContacts();
  return contacts.find(c => c.id === id) || null;
}

export function getContactsByConsent(status) {
  const contacts = getContacts();
  return contacts.filter(c => c.consentStatus === status);
}

export function getOptedInContacts() {
  return getContactsByConsent('Confirmed Opt-In');
}

export function getContactsByGroup(group) {
  const contacts = getContacts();
  return contacts.filter(c => c.group === group);
}

export function searchContacts(query) {
  const contacts = getContacts();
  const q = query.toLowerCase().trim();
  if (!q) return contacts;
  return contacts.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.phone.includes(q) ||
    c.group.toLowerCase().includes(q)
  );
}

export function getContactStats() {
  const contacts = getContacts();
  const total = contacts.length;
  const confirmed = contacts.filter(c => c.consentStatus === 'Confirmed Opt-In').length;
  const pending = contacts.filter(c => c.consentStatus === 'Pending').length;
  const optedOut = contacts.filter(c => c.consentStatus === 'Opted Out').length;
  return { total, confirmed, pending, optedOut };
}

export function exportContactsCSV() {
  const contacts = getContacts();
  if (contacts.length === 0) return null;
  const headers = ['Name', 'Phone', 'Group', 'Consent Status', 'Consent Date', 'Created At'];
  const rows = contacts.map(c => [
    c.name,
    c.phone,
    c.group,
    c.consentStatus,
    c.consentDate || '',
    c.createdAt,
  ]);
  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  return csv;
}
