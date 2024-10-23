import React from 'react';

import { Stack } from '@grafana/ui';
import { ThemeSpacingTokens } from '@grafana/data';

export type Direction = 'row' | 'row-reverse' | 'column' | 'column-reverse';
export type AlignItems =
  | 'stretch'
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'baseline'
  | 'start'
  | 'end'
  | 'self-start'
  | 'self-end';

interface StackProps {
  children?: React.ReactNode;
  direction?: Direction;
  alignItems?: AlignItems;
  wrap?: boolean;
  gap?: ThemeSpacingTokens;
}

export const EditorStack = ({ children, wrap: wrapItems, ...props }: StackProps) => {
  return (
    <Stack
      wrap={(wrapItems ?? 'true') ? 'wrap' : undefined}
      direction={props.direction ?? 'row'}
      gap={props.gap ?? 2}
      {...props}
    >
      {children}
    </Stack>
  );
};
