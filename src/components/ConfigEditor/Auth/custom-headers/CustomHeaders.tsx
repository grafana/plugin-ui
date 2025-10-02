import { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { Button, useTheme2 } from '@grafana/ui';
import { CustomHeader } from './CustomHeader';
import { ConfigSubSection } from '../../ConfigSection';
import type { Header, HeaderWithValue, LocalHeader } from '../types';

export type Props = {
  headers: Header[];
  onChange: (headers: HeaderWithValue[]) => void;
  readOnly: boolean;
};

export const CustomHeaders = ({ headers: headersFromProps, onChange, readOnly }: Props) => {
  const { spacing } = useTheme2();

  const [headers, setHeaders] = useState<LocalHeader[]>(
    headersFromProps.map((header) => ({
      ...header,
      id: uniqueId(),
      value: '',
    }))
  );

  useEffect(() => {
    setHeaders((headers) => {
      let changed = false;
      const newHeaders = headers.map<LocalHeader>((header) => {
        const configured = headersFromProps.find((h) => h.name === header.name)?.configured;
        if (typeof configured !== 'undefined' && header.configured !== configured) {
          changed = true;
          return { ...header, configured };
        }
        return header;
      });

      if (changed) {
        return newHeaders;
      }

      return headers;
    });
  }, [headersFromProps]);

  const onHeaderAdd = () => {
    setHeaders([...headers, { id: uniqueId(), name: '', value: '', configured: false }]);
  };

  const onHeaderChange = (id: string, header: LocalHeader) => {
    setHeaders(headers.map((h) => (h.id === id ? { ...header } : h)));
  };

  const onHeaderDelete = (id: string) => {
    const index = headers.findIndex((h) => h.id === id);
    if (index === -1) {
      return;
    }
    const newHeaders = [...headers];
    newHeaders.splice(index, 1);
    setHeaders(newHeaders);
    onChange(
      newHeaders.map(({ name, value, configured }) => ({
        name,
        value,
        configured,
      }))
    );
  };

  const onBlur = () => {
    onChange(
      headers.map(({ name, value, configured }) => ({
        name,
        value,
        configured,
      }))
    );
  };

  const styles = {
    container: css({
      marginTop: spacing(3),
    }),
    addHeaderButton: css({
      marginTop: spacing(1.5),
    }),
  };

  return (
    <div className={styles.container}>
      <ConfigSubSection
        title="HTTP headers"
        description="Pass along additional context and metadata about the request/response"
        isCollapsible
        isInitiallyOpen={headers.length > 0}
      >
        <div>
          {headers.map((header) => (
            <CustomHeader
              key={header.id}
              header={header}
              onChange={(header) => onHeaderChange(header.id, header)}
              onDelete={() => onHeaderDelete(header.id)}
              onBlur={onBlur}
              readOnly={readOnly}
            />
          ))}
        </div>
        <div className={styles.addHeaderButton}>
          <Button icon="plus" variant="secondary" fill="outline" onClick={onHeaderAdd} disabled={readOnly}>
            {headers.length === 0 ? 'Add header' : 'Add another header'}
          </Button>
        </div>
      </ConfigSubSection>
    </div>
  );
};

function uniqueId(): string {
  return Math.random().toString(16).slice(2);
}
