import { initTelegram } from './telegram.js';
import { authenticate, setSessionToken, getSessionToken, clearSessionToken } from './auth.js';
import { getCampaigns, getContacts, getTemplates, getHistory, clearAll } from './storage.js';
import { generateSMSVariation, estimateSegments, initializeTemplates } from './sms-generator.js';
import {
  createCampaign, updateCampaign, deleteCampaign, getCampaign,
  getStats, addToHistory, getHistoryItems
} from './campaigns.js';
import {
  addContact, updateContact, deleteContact, getContact,
  getOptedInContacts, searchContacts, getContactStats, exportContactsCSV
} from './contacts.js';
import {
  getTemplatesList, getTemplate, addTemplate, updateTemplate, deleteTemplate, renderTemplate, initializeTemplates as initTemplates
} from './templates.js';

// DOM refs
const loadingScreen = document.getElementById('loading-screen');
const accessDenied = document.getElementById('access-denied');
const app = document.getElementById('app');

const sections = {
  dashboard: document.getElementById('section-dashboard'),
  campaigns: document.getElementById('section-campaigns'),
  generator: document.getElementById('section-generator'),
  templates: document.getElementById('section-templates'),
  contacts: document.getElementById('section-contacts'),
  history: document.getElementById('section-history'),
};

const navLinks = document.querySelectorAll('.nav-link');
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

const toast = document.getElementById('toast');

// State
let sessionToken = null;
let currentCampaignId = null;
let currentTemplateId = null;
let currentContactId = null;

// ===== INIT =====
(async function init() {
  try {
    const telegram = initTelegram();

    if (!telegram.available || !telegram.initData) {
      loadingScreen.style.display = 'none';
      accessDenied.style.display = 'flex';
      return;
    }

    // Authenticate
    try {
      sessionToken = await authenticate();
      setSessionToken(sessionToken);
      loadingScreen.style.display = 'none';
      app.style.display = 'block';

      // Initialize data
      initTemplates();
      renderDashboard();
      renderCampaigns();
      renderTemplates();
      renderContacts();
      renderHistory();
      setupEventListeners();
      showToast('Welcome to SMS Rush!', 'success');
    } catch (authError) {
      console.error('Auth failed:', authError);
      loadingScreen.style.display = 'none';
      accessDenied.style.display = 'flex';
    }
  } catch (err) {
    console.error('Init error:', err);
    loadingScreen.style.display = 'none';
    accessDenied.style.display = 'flex';
  }
})();

// ===== NAVIGATION =====
function navigateTo(sectionId) {
  Object.entries(sections).forEach(([key, el]) => {
    el.classList.toggle('active', key === sectionId);
  });
  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.section === sectionId);
  });
  // Close mobile nav
  navMenu.classList.remove('open');
}

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.dataset.section;
    if (section) navigateTo(section);
  });
});

navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('open');
});

// ===== DASHBOARD =====
function renderDashboard() {
  const stats = getStats();
  const contactStats = getContactStats();

  document.getElementById('stat-total').textContent = stats.total;
  document.getElementById('stat-drafts').textContent = stats.drafts;
  document.getElementById('stat-scheduled').textContent = stats.scheduled;
  document.getElementById('stat-completed').textContent = stats.completed;
  document.getElementById('stat-contacts').textContent = contactStats.confirmed;

  // Recent activity
  const history = getHistoryItems();
  const list = document.getElementById('recent-activity-list');
  list.innerHTML = '';
  if (history.length === 0) {
    list.innerHTML = '<li class="empty-state">No recent campaign activity.</li>';
  } else {
    history.slice(0, 5).forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name} — ${item.status} (${new Date(item.createdAt).toLocaleDateString()})`;
      list.appendChild(li);
    });
  }
}

// ===== CAMPAIGNS =====
function renderCampaigns() {
  const campaigns = getCampaigns();
  const list = document.getElementById('campaign-list');
  list.innerHTML = '';
  if (campaigns.length === 0) {
    list.innerHTML = '<div class="empty-state">No campaigns created yet.</div>';
    return;
  }
  campaigns.forEach(c => {
    const div = document.createElement('div');
    div.className = 'campaign-item';
    div.innerHTML = `
      <div class="info">
        <div class="name">${escapeHtml(c.name)}</div>
        <div class="meta">Goal: ${escapeHtml(c.goal)} | Audience: ${escapeHtml(c.audience)}</div>
        <div class="meta">${c.characterCount || 0} chars · ${c.segments || 1} segment(s)</div>
      </div>
      <span class="status status-${c.status}">${escapeHtml(c.status)}</span>
      <div class="actions">
        <button data-action="view" data-id="${c.id}" title="View">👁️</button>
        <button data-action="delete" data-id="${c.id}" title="Delete">🗑️</button>
      </div>
    `;
    list.appendChild(div);

    // Action handlers
    div.querySelector('[data-action="view"]').addEventListener('click', () => viewCampaign(c.id));
    div.querySelector('[data-action="delete"]').addEventListener('click', () => deleteCampaignHandler(c.id));
  });
}

function viewCampaign(id) {
  const c = getCampaign(id);
  if (!c) return;
  alert(`Campaign: ${c.name}\nGoal: ${c.goal}\nAudience: ${c.audience}\nStatus: ${c.status}\n\nMessage:\n${c.message}`);
}

function deleteCampaignHandler(id) {
  if (confirm('Delete this campaign?')) {
    deleteCampaign(id);
    renderCampaigns();
    renderDashboard();
    showToast('Campaign deleted.', 'warning');
  }
}

// ===== CAMPAIGN MODAL =====
const campaignModal = document.getElementById('campaign-modal');
const campaignForm = document.getElementById('campaign-form');
const campaignName = document.getElementById('campaign-name');
const campaignGoal = document.getElementById('campaign-goal');
const campaignAudience = document.getElementById('campaign-audience');
const campaignMessage = document.getElementById('campaign-message');
const campaignConsent = document.getElementById('campaign-consent');
const campaignSchedule = document.getElementById('campaign-schedule');
const campaignCharCount = document.getElementById('campaign-char-count');
const campaignSegments = document.getElementById('campaign-segments');
const campaignPreview = document.getElementById('campaign-preview');
const campaignPreviewText = document.getElementById('campaign-preview-text');

document.getElementById('new-campaign-btn').addEventListener('click', () => {
  currentCampaignId = null;
  document.getElementById('campaign-modal-title').textContent = 'New Campaign';
  campaignForm.reset();
  campaignConsent.checked = false;
  campaignSchedule.value = '';
  campaignPreview.style.display = 'none';
  campaignModal.style.display = 'flex';
});

document.getElementById('campaign-cancel-btn').addEventListener('click', () => {
  campaignModal.style.display = 'none';
});

campaignMessage.addEventListener('input', () => {
  const text = campaignMessage.value;
  const count = text.length;
  campaignCharCount.textContent = count;
  const segments = estimateSegments(text);
  campaignSegments.textContent = segments;
  if (text.length > 0) {
    campaignPreview.style.display = 'block';
    campaignPreviewText.textContent = text;
  } else {
    campaignPreview.style.display = 'none';
  }
});

campaignForm.addEventListener('submit', (e) => {
  e.preventDefault();
  saveCampaign('scheduled');
});

document.getElementById('campaign-draft-btn').addEventListener('click', () => {
  saveCampaign('draft');
});

function saveCampaign(status) {
  const name = campaignName.value.trim();
  const message = campaignMessage.value.trim();

  if (!name) { showToast('Please enter a campaign name.', 'error'); return; }
  if (!message) { showToast('Please enter a message.', 'error'); return; }
  if (!campaignConsent.checked) {
    showToast('You must confirm consent before saving.', 'error');
    return;
  }

  const data = {
    name,
    goal: campaignGoal.value,
    audience: campaignAudience.value,
    message,
    schedule: campaignSchedule.value || null,
    status,
    consentConfirmed: true,
  };

  let campaign;
  if (currentCampaignId) {
    campaign = updateCampaign(currentCampaignId, data);
  } else {
    campaign = createCampaign(data);
  }

  if (campaign) {
    addToHistory(campaign);
    campaignModal.style.display = 'none';
    renderCampaigns();
    renderDashboard();
    renderHistory();
    showToast(`Campaign saved as ${status}.`, 'success');
  }
}

// ===== TEST MESSAGE =====
const testModal = document.getElementById('test-modal');
document.getElementById('campaign-test-btn').addEventListener('click', () => {
  if (!campaignConsent.checked) {
    showToast('Please confirm consent before testing.', 'error');
    return;
  }
  testModal.style.display = 'flex';
});

document.getElementById('test-cancel-btn').addEventListener('click', () => {
  testModal.style.display = 'none';
});

document.getElementById('test-send-btn').addEventListener('click', () => {
  const number = document.getElementById('test-number').value.trim();
  const consent = document.getElementById('test-consent').checked;
  if (!number) { showToast('Please enter a test number.', 'error'); return; }
  if (!consent) { showToast('Please confirm consent for test.', 'error'); return; }
  // Simulate test
  showToast('Test message simulation completed. No SMS was sent because no provider is configured.', 'warning');
  testModal.style.display = 'none';
});

// ===== GENERATOR =====
const genForm = document.getElementById('generator-form');
const genBusiness = document.getElementById('gen-business');
const genProduct = document.getElementById('gen-product');
const genOffer = document.getElementById('gen-offer');
const genGoal = document.getElementById('gen-goal');
const genTone = document.getElementById('gen-tone');
const genCta = document.getElementById('gen-cta');
const genLink = document.getElementById('gen-link');
const genResult = document.getElementById('generator-result');
const genOutput = document.getElementById('gen-output');
const genCharCount = document.getElementById('gen-char-count');

let lastGenerated = '';

function generateSMSFromForm() {
  const options = {
    business: genBusiness.value.trim() || 'our business',
    product: genProduct.value.trim() || 'our product',
    offer: genOffer.value.trim() || 'special offer',
    goal: genGoal.value,
    tone: genTone.value,
    cta: genCta.value,
    link: genLink.value.trim(),
  };
  const message = generateSMSVariation(options);
  lastGenerated = message;
  genOutput.textContent = message;
  genCharCount.textContent = message.length + ' characters';
  genResult.style.display = 'block';
  return message;
}

genForm.addEventListener('submit', (e) => {
  e.preventDefault();
  generateSMSFromForm();
  showToast('SMS generated!', 'success');
});

document.getElementById('gen-another').addEventListener('click', () => {
  generateSMSFromForm();
});

document.getElementById('gen-copy').addEventListener('click', async () => {
  if (!lastGenerated) return;
  try {
    await navigator.clipboard.writeText(lastGenerated);
    showToast('Message copied!', 'success');
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = lastGenerated;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast('Message copied!', 'success');
  }
});

document.getElementById('gen-use').addEventListener('click', () => {
  if (!lastGenerated) return;
  // Open campaign modal and fill message
  document.getElementById('new-campaign-btn').click();
  campaignMessage.value = lastGenerated;
  campaignMessage.dispatchEvent(new Event('input'));
  showToast('Message added to campaign.', 'success');
});

document.getElementById('gen-clear').addEventListener('click', () => {
  genForm.reset();
  genResult.style.display = 'none';
  lastGenerated = '';
  showToast('Cleared.', 'info');
});

// ===== TEMPLATES =====
function renderTemplates() {
  const templates = getTemplatesList();
  const list = document.getElementById('template-list');
  list.innerHTML = '';
  if (templates.length === 0) {
    list.innerHTML = '<div class="empty-state">No templates available.</div>';
    return;
  }
  templates.forEach(t => {
    const div = document.createElement('div');
    div.className = 'template-item';
    div.innerHTML = `
      <div class="name">${escapeHtml(t.name)}</div>
      <div class="body">${escapeHtml(t.body.substring(0, 100))}${t.body.length > 100 ? '…' : ''}</div>
      <div class="actions">
        <button data-action="preview" data-id="${t.id}">Preview</button>
        <button data-action="copy" data-id="${t.id}">Copy</button>
        <button data-action="edit" data-id="${t.id}">Edit</button>
        <button data-action="delete" data-id="${t.id}" class="delete-btn">Delete</button>
      </div>
    `;
    list.appendChild(div);

    div.querySelector('[data-action="preview"]').addEventListener('click', () => previewTemplate(t.id));
    div.querySelector('[data-action="copy"]').addEventListener('click', () => copyTemplate(t.id));
    div.querySelector('[data-action="edit"]').addEventListener('click', () => editTemplate(t.id));
    div.querySelector('[data-action="delete"]').addEventListener('click', () => deleteTemplateHandler(t.id));
  });
}

function previewTemplate(id) {
  const t = getTemplate(id);
  if (!t) return;
  alert(`Template: ${t.name}\n\n${t.body}`);
}

async function copyTemplate(id) {
  const t = getTemplate(id);
  if (!t) return;
  try {
    await navigator.clipboard.writeText(t.body);
    showToast('Template copied!', 'success');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = t.body;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast('Template copied!', 'success');
  }
}

function editTemplate(id) {
  const t = getTemplate(id);
  if (!t) return;
  currentTemplateId = id;
  document.getElementById('template-modal-title').textContent = 'Edit Template';
  document.getElementById('template-name').value = t.name;
  document.getElementById('template-body').value = t.body;
  document.getElementById('template-modal').style.display = 'flex';
}

function deleteTemplateHandler(id) {
  if (confirm('Delete this template?')) {
    deleteTemplate(id);
    renderTemplates();
    showToast('Template deleted.', 'warning');
  }
}

// Template modal
const templateModal = document.getElementById('template-modal');
document.getElementById('new-template-btn').addEventListener('click', () => {
  currentTemplateId = null;
  document.getElementById('template-modal-title').textContent = 'New Template';
  document.getElementById('template-name').value = '';
  document.getElementById('template-body').value = '';
  templateModal.style.display = 'flex';
});

document.getElementById('template-cancel-btn').addEventListener('click', () => {
  templateModal.style.display = 'none';
});

document.getElementById('template-save-btn').addEventListener('click', () => {
  const name = document.getElementById('template-name').value.trim();
  const body = document.getElementById('template-body').value.trim();
  if (!name) { showToast('Please enter a template name.', 'error'); return; }
  if (!body) { showToast('Please enter template content.', 'error'); return; }

  if (currentTemplateId) {
    updateTemplate(currentTemplateId, { name, body });
  } else {
    addTemplate({ name, body });
  }
  templateModal.style.display = 'none';
  renderTemplates();
  showToast('Template saved!', 'success');
});

// ===== CONTACTS =====
function renderContacts() {
  const search = document.getElementById('contact-search').value;
  const groupFilter = document.getElementById('contact-filter-group').value;
  const consentFilter = document.getElementById('contact-filter-consent').value;

  let contacts = searchContacts(search);
  if (groupFilter !== 'all') {
    contacts = contacts.filter(c => c.group === groupFilter);
  }
  if (consentFilter !== 'all') {
    contacts = contacts.filter(c => c.consentStatus === consentFilter);
  }

  const list = document.getElementById('contact-list');
  list.innerHTML = '';
  if (contacts.length === 0) {
    list.innerHTML = '<div class="empty-state">No contacts found.</div>';
    return;
  }
  contacts.forEach(c => {
    const div = document.createElement('div');
    div.className = 'contact-item';
    const consentClass = c.consentStatus === 'Confirmed Opt-In' ? 'consent-confirmed' :
                         c.consentStatus === 'Pending' ? 'consent-pending' : 'consent-optedout';
    div.innerHTML = `
      <div class="info">
        <div class="name">${escapeHtml(c.name)}</div>
        <div class="phone">${escapeHtml(c.phone)}</div>
        <span class="group">${escapeHtml(c.group)}</span>
        <span class="consent ${consentClass}">${escapeHtml(c.consentStatus)}</span>
        ${c.consentDate ? `<span class="meta">Consented: ${new Date(c.consentDate).toLocaleDateString()}</span>` : ''}
      </div>
      <div class="actions">
        <button data-action="edit" data-id="${c.id}">✏️</button>
        <button data-action="delete" data-id="${c.id}">🗑️</button>
      </div>
    `;
    list.appendChild(div);

    div.querySelector('[data-action="edit"]').addEventListener('click', () => editContact(c.id));
    div.querySelector('[data-action="delete"]').addEventListener('click', () => deleteContactHandler(c.id));
  });
}

document.getElementById('contact-search').addEventListener('input', renderContacts);
document.getElementById('contact-filter-group').addEventListener('change', renderContacts);
document.getElementById('contact-filter-consent').addEventListener('change', renderContacts);

function editContact(id) {
  const c = getContact(id);
  if (!c) return;
  currentContactId = id;
  document.getElementById('contact-modal-title').textContent = 'Edit Contact';
  document.getElementById('contact-name').value = c.name;
  document.getElementById('contact-phone').value = c.phone;
  document.getElementById('contact-group').value = c.group;
  document.getElementById('contact-consent').value = c.consentStatus;
  document.getElementById('contact-modal').style.display = 'flex';
}

function deleteContactHandler(id) {
  if (confirm('Delete this contact?')) {
    deleteContact(id);
    renderContacts();
    renderDashboard();
    showToast('Contact deleted.', 'warning');
  }
}

// Contact modal
const contactModal = document.getElementById('contact-modal');
document.getElementById('new-contact-btn').addEventListener('click', () => {
  currentContactId = null;
  document.getElementById('contact-modal-title').textContent = 'Add Contact';
  document.getElementById('contact-name').value = '';
  document.getElementById('contact-phone').value = '';
  document.getElementById('contact-group').value = 'General';
  document.getElementById('contact-consent').value = 'Pending';
  contactModal.style.display = 'flex';
});

document.getElementById('contact-cancel-btn').addEventListener('click', () => {
  contactModal.style.display = 'none';
});

document.getElementById('contact-save-btn').addEventListener('click', () => {
  const name = document.getElementById('contact-name').value.trim();
  const phone = document.getElementById('contact-phone').value.trim();
  const group = document.getElementById('contact-group').value;
  const consentStatus = document.getElementById('contact-consent').value;

  if (!name) { showToast('Please enter a contact name.', 'error'); return; }
  if (!phone) { showToast('Please enter a phone number.', 'error'); return; }

  if (currentContactId) {
    updateContact(currentContactId, { name, phone, group, consentStatus });
  } else {
    addContact({ name, phone, group, consentStatus });
  }
  contactModal.style.display = 'none';
  renderContacts();
  renderDashboard();
  showToast('Contact saved!', 'success');
});

// ===== HISTORY =====
function renderHistory() {
  const history = getHistoryItems();
  const list = document.getElementById('history-list');
  list.innerHTML = '';
  if (history.length === 0) {
    list.innerHTML = '<div class="empty-state">No campaign history yet.</div>';
    return;
  }
  history.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="info">
        <div class="name">${escapeHtml(item.name)}</div>
        <div class="meta">${new Date(item.createdAt).toLocaleDateString()} · ${escapeHtml(item.status)}</div>
        <div class="preview">${escapeHtml(item.message || '')}</div>
      </div>
      <span class="status status-${item.status}">${escapeHtml(item.status)}</span>
    `;
    list.appendChild(div);
  });
}

document.getElementById('export-history-btn').addEventListener('click', () => {
  const history = getHistoryItems();
  if (history.length === 0) {
    showToast('No history to export.', 'warning');
    return;
  }
  const json = JSON.stringify(history, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sms-rush-history-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('History exported!', 'success');
});

// ===== CLEAR DATA =====
document.getElementById('clear-data-btn').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
    clearAll();
    renderDashboard();
    renderCampaigns();
    renderTemplates();
    renderContacts();
    renderHistory();
    showToast('All local data cleared.', 'warning');
  }
});

// ===== TOAST =====
let toastTimeout;

function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = 'toast show ' + type;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// Export showToast for use in other modules
window.showToast = showToast;

// ===== UTILITY =====
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Click outside modals to close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });

  // Close modals with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    }
  });
}

// Initial render of templates on load
document.addEventListener('DOMContentLoaded', () => {
  // Templates are initialized in init()
});
