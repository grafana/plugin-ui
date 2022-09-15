import React, { CSSProperties } from 'react';
interface StackProps {
    direction?: CSSProperties['flexDirection'];
    alignItems?: CSSProperties['alignItems'];
    wrap?: boolean;
    gap?: number;
}
export declare const Stack: React.FC<StackProps>;
export {};
