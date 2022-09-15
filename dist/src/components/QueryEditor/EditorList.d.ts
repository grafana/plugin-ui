import React from 'react';
interface EditorListProps<T> {
    items: Array<Partial<T>>;
    renderItem: (item: Partial<T>, onChangeItem: (item: Partial<T>) => void, onDeleteItem: () => void) => React.ReactElement;
    onChange: (items: Array<Partial<T>>) => void;
}
export declare function EditorList<T>({ items, renderItem, onChange }: EditorListProps<T>): JSX.Element;
export {};
