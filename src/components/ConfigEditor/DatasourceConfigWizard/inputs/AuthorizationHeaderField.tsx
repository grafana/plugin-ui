import React, { useMemo } from 'react';
import { type useForm, Controller } from 'react-hook-form';
import { useStyles2, Icon, Tooltip } from '@grafana/ui';
import { IndexedPairEditor } from './IndexedPairEditor';
import { getWizardStyles } from '../styles';
import { type IndexedPairItem, type FormValues } from '../datasource';

type Props = {
  headersFieldKey: string;
  control: ReturnType<typeof useForm<FormValues>>['control'];
  disabled?: boolean;
  watchedValues: Record<string, unknown>;
};

export const AuthorizationHeaderField = (props: Props) => {
  const { headersFieldKey, control, disabled, watchedValues } = props;
  const styles = useStyles2(getWizardStyles);
  const items = useMemo(
    () => (Array.isArray(watchedValues[headersFieldKey]) ? watchedValues[headersFieldKey] : []) as IndexedPairItem[],
    [watchedValues, headersFieldKey]
  );

  const authEntries = useMemo(() => {
    const entries: Array<{ item: IndexedPairItem; originalIdx: number }> = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].name.toLowerCase() === 'authorization') {
        entries.push({ item: items[i], originalIdx: i });
      }
    }
    return entries;
  }, [items]);

  if (authEntries.length === 0) {
    return null;
  }

  const authItems = authEntries.map((e) => e.item);

  return (
    <Controller
      name={headersFieldKey}
      control={control}
      render={({ field: formField }) => {
        const handleChange = (updatedAuthItems: IndexedPairItem[]) => {
          const updated = [...items];
          for (let i = 0; i < authEntries.length; i++) {
            if (i < updatedAuthItems.length) {
              updated[authEntries[i].originalIdx] = updatedAuthItems[i];
            }
          }
          formField.onChange(updated);
        };

        return (
          <div className={styles.fieldRow}>
            <div className={styles.fieldLabelRow}>
              <span className={styles.fieldLabel}>Custom HTTP Headers</span>
              <Tooltip content="Authorization HTTP header(s) sent with every request.">
                <Icon name="info-circle" size="xs" className={styles.fieldInfoIcon} />
              </Tooltip>
            </div>
            <div className={styles.fieldInputCol}>
              <IndexedPairEditor value={authItems} onChange={handleChange} disabled={disabled} hideControls />
            </div>
          </div>
        );
      }}
    />
  );
};
