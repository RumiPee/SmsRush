/**
 * Telegram Mini App integration
 */
export function initTelegram() {
  if (typeof window.Telegram === 'undefined' || !window.Telegram.WebApp) {
    return { available: false };
  }

  const webApp = window.Telegram.WebApp;
  webApp.ready();
  webApp.expand();

  applyTelegramTheme(webApp);

  const initData = webApp.initData || '';

  return {
    available: true,
    initData,
    webApp,
    colorScheme: webApp.colorScheme || 'light',
    themeParams: webApp.themeParams || {},
    platform: webApp.platform || 'unknown',
  };
}

function applyTelegramTheme(webApp) {
  const params = webApp.themeParams;
  if (!params) return;

  const root = document.documentElement;
  const map = {
    bg_color: '--bg-primary',
    secondary_bg_color: '--bg-secondary',
    text_color: '--text-primary',
    hint_color: '--text-secondary',
    button_color: '--accent',
    button_text_color: '--button-text',
  };

  for (const [key, cssVar] of Object.entries(map)) {
    if (params[key]) {
      root.style.setProperty(cssVar, params[key]);
    }
  }

  if (webApp.colorScheme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

export function getWebApp() {
  if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}
