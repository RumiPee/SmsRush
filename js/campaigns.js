import { getCampaigns, setCampaigns, getHistory, setHistory } from './storage.js';
import { estimateSegments } from './sms-generator.js';

export function createCampaign(data) {
  const campaigns = getCampaigns();
  const campaign = {
    id: 'camp_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    name: data.name,
    goal: data.goal,
    audience: data.audience,
    message: data.message,
    schedule: data.schedule || null,
    status: data.status || 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    consentConfirmed: data.consentConfirmed || false,
    segments: estimateSegments(data.message),
    characterCount: data.message.length,
  };
  campaigns.unshift(campaign);
  setCampaigns(campaigns);
  return campaign;
}

export function updateCampaign(id, updates) {
  const campaigns = getCampaigns();
  const index = campaigns.findIndex(c => c.id === id);
  if (index === -1) return null;
  campaigns[index] = { ...campaigns[index], ...updates, updatedAt: new Date().toISOString() };
  setCampaigns(campaigns);
  return campaigns[index];
}

export function deleteCampaign(id) {
  let campaigns = getCampaigns();
  campaigns = campaigns.filter(c => c.id !== id);
  setCampaigns(campaigns);
}

export function getCampaign(id) {
  const campaigns = getCampaigns();
  return campaigns.find(c => c.id === id) || null;
}

export function getCampaignsByStatus(status) {
  const campaigns = getCampaigns();
  return campaigns.filter(c => c.status === status);
}

export function getStats() {
  const campaigns = getCampaigns();
  const total = campaigns.length;
  const drafts = campaigns.filter(c => c.status === 'draft').length;
  const scheduled = campaigns.filter(c => c.status === 'scheduled').length;
  const completed = campaigns.filter(c => c.status === 'completed').length;
  return { total, drafts, scheduled, completed };
}

export function addToHistory(campaign) {
  const history = getHistory();
  const entry = {
    id: 'hist_' + Date.now().toString(36),
    campaignId: campaign.id,
    name: campaign.name,
    status: campaign.status,
    audience: campaign.audience,
    message: campaign.message.substring(0, 100) + (campaign.message.length > 100 ? '…' : ''),
    createdAt: campaign.createdAt,
    scheduledDate: campaign.schedule,
  };
  history.unshift(entry);
  if (history.length > 50) history.pop();
  setHistory(history);
}

export function getHistoryItems() {
  return getHistory();
}

export function clearHistory() {
  setHistory([]);
}
