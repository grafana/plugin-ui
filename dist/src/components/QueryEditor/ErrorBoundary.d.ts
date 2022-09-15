import React from 'react';
declare type Props = {
    fallBackComponent?: React.ReactNode;
};
export declare class ErrorBoundary extends React.Component<Props, {
    hasError: boolean;
}> {
    constructor(props: Props);
    static getDerivedStateFromError(): {
        hasError: boolean;
    };
    render(): React.ReactNode;
}
export {};
