import type { Preview } from '@storybook/react-webpack5';

import { themes } from 'storybook/theming';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    docs: {
      theme: themes.dark,
    },
  },
  tags: ['autodocs'],
};

export default preview;
