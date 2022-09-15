/// <reference types="react" />
declare type ConfirmModalProps = {
    isOpen: boolean;
    onCancel?: () => void;
    onDiscard?: () => void;
    onCopy?: () => void;
};
export declare function ConfirmModal({ isOpen, onCancel, onDiscard, onCopy }: ConfirmModalProps): JSX.Element;
export {};
