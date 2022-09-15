import React from 'react';
export interface DatePickerProps {
    isOpen?: boolean;
    onClose: () => void;
    onChange: (value: Date) => void;
    value?: Date;
}
export declare const DatePicker: React.NamedExoticComponent<DatePickerProps>;
