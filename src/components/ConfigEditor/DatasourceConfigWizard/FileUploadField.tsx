import React, { useState, useCallback } from 'react';
import { FileDropzone, TextArea, Button, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import type { ConfigField } from '../../../datasource/schema/schema';
import type { FormFieldRef } from './SecureFieldInput';

type EntryMode = 'upload' | 'paste' | 'manual';

interface Props {
  field: ConfigField;
  formField: FormFieldRef;
  disabled?: boolean;
  setValue: (name: string, value: unknown) => void;
}

export function FileUploadField({ field, formField, disabled, setValue }: Props) {
  const [mode, setModeLocal] = useState<EntryMode>('upload');
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme2();
  const mapping = field.ui?.fileMapping ?? {};
  const accept = field.ui?.accept ?? ['.json'];

  // Write mode into this field's own Controller value so dependsOn can observe it.
  // e.g. other fields use dependsOn: "virtual.jwtUpload == 'manual'" to show/hide.
  const setMode = useCallback(
    (next: EntryMode) => {
      setModeLocal(next);
      formField.onChange(next);
    },
    [formField]
  );

  const processJson = useCallback(
    (text: string) => {
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed !== 'object' || parsed === null) {
          setError('Invalid JSON object');
          return;
        }
        const requiredKeys = Object.keys(mapping);
        const missingKeys = requiredKeys.filter((k) => parsed[k] === undefined);
        if (missingKeys.length > 0) {
          setError(`Missing keys: ${missingKeys.join(', ')}`);
          return;
        }
        for (const [jsonKey, targetFieldId] of Object.entries(mapping)) {
          if (parsed[jsonKey] !== undefined) {
            const parts = targetFieldId.split('.');
            const fk = parts.length === 2 ? parts[1] : targetFieldId;
            setValue(fk, parsed[jsonKey]);
          }
        }
        setError(null);
        setModeLocal('manual');
        formField.onChange('manual');
      } catch {
        setError('Invalid JSON');
      }
    },
    [mapping, setValue, formField]
  );

  const styles = getStyles(theme);

  // Manual mode: just show toggle buttons, fields below are rendered by schema
  if (mode === 'manual') {
    return (
      <div className={styles.buttonRow}>
        <Button type="button" fill="outline" size="sm" onClick={() => setMode('paste')} disabled={disabled}>
          Paste JWT Token
        </Button>
        <span className={styles.separator}>or</span>
        <Button type="button" fill="outline" size="sm" onClick={() => setMode('upload')} disabled={disabled}>
          Upload JWT Token
        </Button>
      </div>
    );
  }

  // Paste mode: textarea + toggle buttons
  if (mode === 'paste') {
    return (
      <div>
        <TextArea
          placeholder={field.ui?.placeholder ?? 'Paste Google JWT token here'}
          rows={field.ui?.rows ?? 10}
          onBlur={(e) => {
            const val = e.currentTarget.value;
            if (val.trim()) {
              processJson(val);
            }
          }}
          disabled={disabled}
        />
        <div className={styles.buttonRow}>
          <Button type="button" fill="outline" size="sm" onClick={() => setMode('upload')} disabled={disabled}>
            Upload JWT Token
          </Button>
          <span className={styles.separator}>or</span>
          <Button type="button" fill="outline" size="sm" onClick={() => setMode('manual')} disabled={disabled}>
            Fill In JWT Token manually
          </Button>
        </div>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    );
  }

  // Upload mode (default): FileDropzone + toggle buttons
  return (
    <div>
      <FileDropzone
        options={{ multiple: false, accept: accept.join(',') }}
        readAs="readAsText"
        onLoad={(result) => {
          if (typeof result === 'string') {
            processJson(result);
          }
        }}
      />
      <div className={styles.buttonRow}>
        <Button type="button" fill="outline" size="sm" onClick={() => setMode('paste')} disabled={disabled}>
          Paste JWT Token
        </Button>
        <span className={styles.separator}>or</span>
        <Button type="button" fill="outline" size="sm" onClick={() => setMode('manual')} disabled={disabled}>
          Fill In JWT Token manually
        </Button>
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

function getStyles(theme: ReturnType<typeof useTheme2>) {
  return {
    buttonRow: css({
      marginTop: theme.spacing(1),
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.5),
    }),
    separator: css({
      padding: `0 ${theme.spacing(0.5)}`,
      color: theme.colors.text.secondary,
    }),
    error: css({
      color: theme.colors.error.text,
      fontSize: theme.typography.bodySmall.fontSize,
      marginTop: theme.spacing(0.5),
      display: 'block',
    }),
  };
}
