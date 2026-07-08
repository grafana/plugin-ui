import React, { type ReactNode } from 'react';
import { Alert, Button, LinkButton } from '@grafana/ui';
import type { DatasourceConfigSchema } from '../../../schema/schema';
import { formKey, type ResolvedGroup } from './config';
import type { useDatasourceConfigForm } from './hooks/useDatasourceConfigForm';
import { SchemaField } from './SchemaField';
import { AuthorizationHeaderField } from './inputs/AuthorizationHeaderField';

type ConfigForm = ReturnType<typeof useDatasourceConfigForm>;

type RenderActions = (props: { dsUid: string; dsName: string; dsType: string; healthError?: string }) => ReactNode;

/**
 * Renders the visible fields of a single group plus the optional Authorization
 * header editor. Shared by both the tab and wizard layouts so the field-render
 * contract lives in exactly one place.
 *
 * `showAuthHeaders` is passed in (rather than derived here) because the two
 * layouts intentionally use different predicates for when to show it.
 */
export function GroupFields({
  group,
  form,
  dsUid,
  showAuthHeaders,
}: {
  group: ResolvedGroup;
  form: ConfigForm;
  dsUid: string;
  showAuthHeaders: boolean;
}) {
  const {
    control,
    errors,
    watchedValues,
    fieldById,
    celContext,
    setValue,
    isFieldVisible,
    isFieldDisabled,
    httpHeadersField,
    submitting,
    readOnly,
  } = form;
  const allDisabled = submitting || readOnly;

  return (
    <>
      {group.fields.filter(isFieldVisible).map((field) => (
        <SchemaField
          key={formKey(field)}
          field={field}
          control={control}
          errors={errors}
          disabled={allDisabled || isFieldDisabled(field)}
          dsUid={dsUid}
          watchedValues={watchedValues}
          fieldById={fieldById}
          celContext={celContext}
          setValue={setValue}
        />
      ))}

      {showAuthHeaders && httpHeadersField && (
        <AuthorizationHeaderField
          headersFieldKey={formKey(httpHeadersField)}
          control={control}
          disabled={allDisabled}
        />
      )}
    </>
  );
}

/**
 * Submit-error alert plus the Save/Test action row. `saveDisabled` and
 * `className` differ per layout (the wizard also gates on step validity and
 * uses its own button container).
 */
export function FormFooter({
  form,
  schema,
  dsUid,
  dsName,
  onRetest,
  healthError,
  renderActions,
  saveDisabled,
  className,
}: {
  form: ConfigForm;
  schema: DatasourceConfigSchema;
  dsUid: string;
  dsName: string;
  onRetest?: () => void;
  healthError?: string;
  renderActions?: RenderActions;
  saveDisabled: boolean;
  className: string;
}) {
  const { readOnly, submitting, submitError } = form;

  return (
    <>
      {submitError && (
        <Alert severity="error" title="Error">
          {submitError}
        </Alert>
      )}

      <div className={className}>
        {readOnly ? (
          <Button variant="primary" size="sm" icon="sync" onClick={onRetest} type="button">
            Test
          </Button>
        ) : (
          <Button variant="primary" size="sm" disabled={saveDisabled} type="submit">
            {submitting ? 'Saving…' : 'Save & Test'}
          </Button>
        )}
        {healthError && renderActions?.({ dsUid, dsName, dsType: schema.pluginType, healthError })}
      </div>
    </>
  );
}

/**
 * "Failed to load configuration" state with a link to the native datasource
 * settings page. The outer container class differs per layout, so callers wrap
 * this; `buttonClassName` styles the link row.
 */
export function FetchErrorState({
  error,
  dsUid,
  buttonClassName,
}: {
  error: string;
  dsUid: string;
  buttonClassName: string;
}) {
  return (
    <>
      <Alert severity="error" title="Failed to load configuration">
        {error}
      </Alert>
      <div className={buttonClassName}>
        <LinkButton
          variant="secondary"
          size="sm"
          icon="external-link-alt"
          href={`/connections/datasources/edit/${dsUid}`}
        >
          Open datasource settings
        </LinkButton>
      </div>
    </>
  );
}
