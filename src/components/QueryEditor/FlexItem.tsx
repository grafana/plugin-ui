import React from 'react';
interface FlexItemProps {
  grow?: number;
  shrink?: number;
}

export const FlexItem = ({ grow, shrink }: FlexItemProps) => {
  return <div style={{ display: 'block', flexGrow: grow, flexShrink: shrink }} />;
};
