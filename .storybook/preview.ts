import type { Preview } from '@storybook/react-webpack5';

import { themes } from 'storybook/theming';
import { withGrafanaTheme } from './decorators/withGrafanaTheme';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    docs: {
      theme: themes.dark,
    },
  },
  decorators: [withGrafanaTheme()],
  globalTypes: {
    theme: {
      description: 'Grafana theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'dark',
  },
  tags: ['autodocs'],
};

export default preview;
