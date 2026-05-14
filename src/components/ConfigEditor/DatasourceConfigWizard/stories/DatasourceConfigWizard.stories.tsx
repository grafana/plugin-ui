import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import { StoryModeWrapper } from './StoryModeWrapper';

export default {
  title: 'Editors/Config',
  component: StoryModeWrapper,
  decorators: [
    (Story: React.ComponentType) => {
      setBackendSrv({
        get: () => Promise.resolve({ jsonData: {}, secureJsonFields: {} }),
        put: () => Promise.resolve({}),
      } as unknown as BackendSrv);
      return <Story />;
    },
  ],
};
