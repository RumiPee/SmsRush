import { getTemplates, setTemplates } from './storage.js';
import { generateDefaultTemplates } from './sms-generator.js';

// Ensure default templates are loaded if none exist
export function initializeTemplates() {
  const templates = getTemplates();
  if (templates.length === 0) {
    const defaults = generateDefaultTemplates();
    setTemplates(defaults);
    return defaults;
  }
  return templates;
}

export function getTemplatesList() {
  return getTemplates();
}

export function getTemplate(id) {
  const templates = getTemplates();
  return templates.find(t => t.id === id) || null;
}

export function addTemplate(data) {
  const templates = getTemplates();
  const template = {
    id: 'tpl_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    name: data.name,
    body: data.body,
    isCustom: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  templates.unshift(template);
  setTemplates(templates);
  return template;
}

export function updateTemplate(id, updates) {
  const templates = getTemplates();
  const index = templates.findIndex(t => t.id === id);
  if (index === -1) return null;
  templates[index] = { ...templates[index], ...updates, updatedAt: new Date().toISOString() };
  setTemplates(templates);
  return templates[index];
}

export function deleteTemplate(id) {
  let templates = getTemplates();
  // Don't delete default templates (they have predefined IDs)
  const defaultIds = ['tpl_welcome', 'tpl_promo', 'tpl_offer', 'tpl_reminder', 'tpl_event', 'tpl_followup', 'tpl_order', 'tpl_thanks', 'tpl_feedback', 'tpl_website'];
  if (defaultIds.includes(id)) {
    // Reset default template to original
    const defaults = generateDefaultTemplates();
    const defaultTemplate = defaults.find(t => t.id === id);
    if (defaultTemplate) {
      const index = templates.findIndex(t => t.id === id);
      if (index !== -1) {
        templates[index] = { ...defaultTemplate, isCustom: false, updatedAt: new Date().toISOString() };
        setTemplates(templates);
        return templates[index];
      }
    }
    return null;
  }
  templates = templates.filter(t => t.id !== id);
  setTemplates(templates);
}

export function renderTemplate(template, variables) {
  let body = template.body;
  for (const [key, value] of Object.entries(variables)) {
    body = body.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
  }
  return body;
}
