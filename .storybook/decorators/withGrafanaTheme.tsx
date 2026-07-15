import type { Decorator } from '@storybook/react-webpack5';
import { getThemeById, ThemeContext } from '@grafana/data';
import { GlobalStyles, PortalContainer } from '@grafana/ui';

declare global {
  interface Window {
    __grafana_public_path__: string;
  }
}

if (typeof window !== 'undefined') {
  // Icons load from Grafana's CDN so they render correctly in storybook
  window.__grafana_public_path__ = 'https://raw.githubusercontent.com/grafana/grafana/refs/heads/main/public/';

  // Load Inter font (Grafana's default typeface)
  if (!document.getElementById('grafana-font-inter')) {
    const link = document.createElement('link');
    link.id = 'grafana-font-inter';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }
}

// Patch fetch to fix icon URLs (GitHub raw URLs don't include /build/)
const originalFetch = window.fetch;
window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (typeof input === 'string' && input.includes('grafana/grafana') && input.includes('/public/build/img/icons/')) {
    input = input.replace('/public/build/img/icons/', '/public/img/icons/');
  }
  return originalFetch(input, init);
};

export const withGrafanaTheme = (): Decorator =>
  function WithGrafanaThemeDecorator(story, context) {
    const themeId = context.globals.theme ?? 'dark';
    return (
      <ThemeContext.Provider value={getThemeById(themeId)}>
        <GlobalStyles />
        {story()}
        <PortalContainer />
      </ThemeContext.Provider>
    );
  };
