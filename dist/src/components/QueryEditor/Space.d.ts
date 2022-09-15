/// <reference types="react" />
export interface SpaceProps {
    v?: number;
    h?: number;
    layout?: 'block' | 'inline';
}
export declare const Space: {
    (props: SpaceProps): JSX.Element;
    defaultProps: {
        v: number;
        h: number;
        layout: string;
    };
};
