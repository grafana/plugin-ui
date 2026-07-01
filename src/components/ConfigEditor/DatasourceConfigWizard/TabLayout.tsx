import React, { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { useStyles2, Button, Icon, Alert, Spinner, LinkButton, Collapse } from '@grafana/ui';
import type { DatasourceConfigSchema } from '../../../schema/schema';
import { formKey } from './config';
import type { useDatasourceConfigForm } from './hooks/useDatasourceConfigForm';
import { SchemaField } from './SchemaField';
import { AuthorizationHeaderField } from './inputs/AuthorizationHeaderField';
import { SidebarNav, type SectionState } from './SidebarNav';
import { getTabStyles } from './styles';

type TabLayoutProps = {
  form: ReturnType<typeof useDatasourceConfigForm>;
  schema: DatasourceConfigSchema;
  dsUid: string;
  dsName: string;
  onRetest?: () => void;
  healthError?: string;
  renderActions?: (props: { dsUid: string; dsName: string; dsType: string; healthError?: string }) => ReactNode;
};

export function TabLayout({ form, schema, dsUid, dsName, onRetest, healthError, renderActions }: TabLayoutProps) {
  const styles = useStyles2(getTabStyles);
  const sectionRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const {
    resolvedGroups,
    fieldById,
    httpHeadersField,
    control,
    handleSubmit,
    errors,
    watchedValues,
    celContext,
    initializing,
    fetchError,
    submitting,
    submitError,
    readOnly,
    isFieldVisible,
    isFieldDisabled,
    isGroupValid,
    groupHasData,
    onSubmit,
    setValue,
  } = form;

  // Filter out _required synthetic group — in tab mode we show all groups from schema directly
  const displayGroups = useMemo(() => resolvedGroups.filter((g) => g.group.id !== '_required'), [resolvedGroups]);

  // Expand/collapse state: required or groups with data start expanded, optional start collapsed
  const [expandedSections, setExpandedSections] = useState<Set<number>>(() => {
    const expanded = new Set<number>();
    for (let i = 0; i < displayGroups.length; i++) {
      if (!displayGroups[i].group.optional) {
        expanded.add(i);
      }
    }
    return expanded;
  });

  // Re-evaluate on data load: expand sections that have saved data
  const hasExpandedForData = useRef(false);
  useMemo(() => {
    if (initializing || hasExpandedForData.current) {
      return;
    }
    hasExpandedForData.current = true;
    setExpandedSections((prev) => {
      const next = new Set(prev);
      for (let i = 0; i < displayGroups.length; i++) {
        if (groupHasData(displayGroups[i])) {
          next.add(i);
        }
      }
      return next;
    });
  }, [initializing, displayGroups, groupHasData]);

  const [activeSection, setActiveSection] = useState(0);

  const toggleSection = useCallback((index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const scrollToSection = useCallback(
    (index: number) => {
      setActiveSection(index);
      if (!expandedSections.has(index)) {
        setExpandedSections((prev) => new Set(prev).add(index));
      }
      const el = sectionRefs.current.get(index);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [expandedSections]
  );

  // Compute sidebar states
  const sectionStates: SectionState[] = useMemo(() => {
    return displayGroups.map((g, i) => {
      if (i === activeSection) {
        return 'active';
      }
      if (!isGroupValid(g)) {
        return 'error';
      }
      if (groupHasData(g)) {
        return 'validated';
      }
      return 'draft';
    });
  }, [displayGroups, activeSection, isGroupValid, groupHasData]);

  if (initializing) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="sm" inline /> Loading configuration…
      </div>
    );
  }

  if (fetchError) {
    return (
      <div>
        <Alert severity="error" title="Failed to load configuration">
          {fetchError}
        </Alert>
        <div className={styles.formButtons}>
          <LinkButton
            variant="secondary"
            size="sm"
            icon="external-link-alt"
            href={`/connections/datasources/edit/${dsUid}`}
          >
            Open datasource settings
          </LinkButton>
        </div>
      </div>
    );
  }

  const allDisabled = submitting || readOnly;

  return (
    <div className={styles.root}>
      {submitting && (
        <div className={styles.overlay}>
          <Spinner size="sm" />
          <span>Saving & testing…</span>
        </div>
      )}

      <SidebarNav
        groups={displayGroups}
        activeIndex={activeSection}
        sectionStates={sectionStates}
        onSelect={scrollToSection}
      />

      <div className={styles.main}>
        {readOnly && (
          <div className={styles.readOnlyBanner}>
            <Icon name="lock" size="xs" />
            <span>Read-only — managed externally</span>
          </div>
        )}

        <div className={styles.requiredNotice}>Fields marked with * are required</div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {displayGroups.map((g, i) => {
            const visibleFields = g.fields.filter(isFieldVisible);
            if (visibleFields.length === 0 && !httpHeadersField) {
              return null;
            }

            const showHeaders =
              httpHeadersField &&
              (g.group.id === 'auth' ||
                g.group.id === 'url-and-auth' ||
                g.group.id === '_required' ||
                g.group.fieldRefs.includes('httpHeaders'));

            const sectionLabel = (
              <span className={styles.sectionLabel}>
                <span className={styles.sectionLabelText}>{g.group.title}</span>
                {g.group.optional && <span className={styles.sectionBadge}>Optional</span>}
              </span>
            );

            return (
              <div
                key={g.group.id}
                ref={(el) => {
                  if (el) {
                    sectionRefs.current.set(i, el);
                  }
                }}
                className={styles.section}
              >
                <Collapse
                  label={sectionLabel}
                  isOpen={expandedSections.has(i)}
                  collapsible
                  onToggle={() => {
                    toggleSection(i);
                    setActiveSection(i);
                  }}
                  className={styles.collapseHeader}
                >
                  <div className={styles.sectionBody}>
                    {g.group.description && <div className={styles.sectionDescription}>{g.group.description}</div>}
                    {visibleFields.map((field) => (
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

                    {showHeaders && (
                      <AuthorizationHeaderField
                        headersFieldKey={formKey(httpHeadersField!)}
                        control={control}
                        disabled={allDisabled}
                        watchedValues={watchedValues}
                      />
                    )}
                  </div>
                </Collapse>
              </div>
            );
          })}

          {submitError && (
            <Alert severity="error" title="Error">
              {submitError}
            </Alert>
          )}

          <div className={styles.formButtons}>
            {readOnly ? (
              <Button variant="primary" size="sm" icon="sync" onClick={onRetest} type="button">
                Test
              </Button>
            ) : (
              <Button variant="primary" size="sm" disabled={submitting} type="submit">
                {submitting ? 'Saving…' : 'Save & Test'}
              </Button>
            )}
            {healthError && renderActions?.({ dsUid, dsName, dsType: schema.pluginType, healthError })}
          </div>
        </form>
      </div>
    </div>
  );
}
