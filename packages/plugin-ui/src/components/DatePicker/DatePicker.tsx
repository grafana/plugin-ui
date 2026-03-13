import React, { memo } from 'react';
import Calendar from 'react-calendar';
import { useTheme2, ClickOutsideWrapper, Icon } from '@grafana/ui';
import { getStyles, getBodyStyles } from './styles';

export interface DatePickerProps {
  isOpen?: boolean;
  onClose: () => void;
  onChange: (value: Date) => void;
  value?: Date;
}

export const DatePicker = memo<DatePickerProps>((props) => {
  const theme = useTheme2();
  const styles = getStyles(theme);
  const { isOpen, onClose } = props;

  if (!isOpen) {
    return null;
  }

  return (
    <ClickOutsideWrapper useCapture={true} includeButtonPress={false} onClick={onClose}>
      <div className={styles.modal} data-testid="date-picker">
        <Body {...props} />
      </div>
    </ClickOutsideWrapper>
  );
});

DatePicker.displayName = 'DatePicker';

const Body = memo<DatePickerProps>(({ value, onChange }) => {
  const theme = useTheme2();
  const styles = getBodyStyles(theme);

  return (
    <Calendar
      className={styles.body}
      tileClassName={styles.title}
      value={value || new Date()}
      nextLabel={<Icon name="angle-right" />}
      prevLabel={<Icon name="angle-left" />}
      onChange={(ev: any) => {
        if (!Array.isArray(ev)) {
          onChange(ev);
        }
      }}
      locale="en"
    />
  );
});

Body.displayName = 'Body';
