import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Field, Select, Spinner } from '@grafana/ui';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import { useArgs } from 'storybook/preview-api';
import { DatasourceConfigWizard } from './DatasourceConfigWizard';
import { resolveBaseFields } from '../../../schema/utils/packs';
import type { DatasourceConfigSchema } from '../../../schema/schema';
import { type SelectableValue } from '@grafana/data';

// ------------------------------------------------------------------
// Mock backend
//
// The wizard loads the existing datasource on mount via
// getBackendSrv().get('/api/datasources/uid/:uid') and saves via .put().
// Storybook has no Grafana backend, so we install a stub that returns an
// empty datasource. Without this the wizard would render its
// "Failed to load configuration" error state.
// ------------------------------------------------------------------
setBackendSrv({
  get: async () => ({
    uid: 'story-datasource',
    name: 'Story datasource',
    id: 1,
    jsonData: {},
    secureJsonFields: {},
    readOnly: false,
  }),
  put: async (_url: string, data: unknown) => {
    console.log(data);
    return data;
  },
} as unknown as BackendSrv);

// ------------------------------------------------------------------
// Schema source
//
// Mock schemas live in the dsconfig registry. We fetch the raw JSON for the
// selected plugin type and resolve any base-field packs, mirroring the real
// getConfigSchema() flow.
// ------------------------------------------------------------------
const SCHEMA_BASE_URL = 'https://raw.githubusercontent.com/grafana/dsconfig/schema-discovery/registry';

const PLUGIN_TYPES = [
  'cloudwatch',
  'dlopes7-appdynamics-datasource',
  'elasticsearch',
  'grafana-adobeanalytics-datasource',
  'grafana-amazonprometheus-datasource',
  'grafana-astradb-datasource',
  'grafana-athena-datasource',
  'grafana-atlassianstatuspage-datasource',
  'grafana-aurora-datasource',
  'grafana-azure-data-explorer-datasource',
  'grafana-azure-monitor-datasource',
  'grafana-azurecosmosdb-datasource',
  'grafana-azuredevops-datasource',
  'grafana-azureprometheus-datasource',
  'grafana-bigquery-datasource',
  'grafana-catchpoint-datasource',
  'grafana-clickhouse-datasource',
  'grafana-cloudflare-datasource',
  'grafana-cockroachdb-datasource',
  'grafana-databricks-datasource',
  'grafana-datadog-datasource',
  'grafana-drone-datasource',
  'grafana-dynamodb-datasource',
  'grafana-dynatrace-datasource',
  'grafana-falconlogscale-datasource',
  'grafana-github-datasource',
  'grafana-gitlab-datasource',
  'grafana-googlesheets-datasource',
  'grafana-hello-datasource',
  'grafana-helloworld-datasource',
  'grafana-honeycomb-datasource',
  'grafana-iot-sitewise-datasource',
  'grafana-iot-twinmaker-datasource',
  'grafana-jenkins-datasource',
  'grafana-jira-datasource',
  'grafana-logicmonitor-datasource',
  'grafana-looker-datasource',
  'grafana-mock-datasource',
  'grafana-mongodb-datasource',
  'grafana-mqtt-datasource',
  'grafana-netlify-datasource',
  'grafana-newrelic-datasource',
  'grafana-odbc-datasource',
  'grafana-opensearch-datasource',
  'grafana-oracle-datasource',
  'grafana-pagerduty-datasource',
  'grafana-postgresql-datasource',
  'grafana-pyroscope-datasource',
  'grafana-redshift-datasource',
  'grafana-salesforce-datasource',
  'grafana-saphana-datasource',
  'grafana-sentry-datasource',
  'grafana-servicenow-datasource',
  'grafana-snowflake-datasource',
  'grafana-solarwinds-datasource',
  'grafana-splunk-datasource',
  'grafana-splunk-monitoring-datasource',
  'grafana-sumologic-datasource',
  'grafana-supabase-datasource',
  'grafana-timestream-datasource',
  'grafana-vercel-datasource',
  'grafana-wavefront-datasource',
  'grafana-x-ray-datasource',
  'grafana-yugabyte-datasource',
  'grafana-zendesk-datasource',
  'graphite',
  'influxdb',
  'jaeger',
  'loki',
  'marcusolsson-csv-datasource',
  'mssql',
  'mysql',
  'opentsdb',
  'parca',
  'prometheus',
  'stackdriver',
  'tempo',
  'yesoreyeram-infinity-datasource',
  'zipkin',
];

const PLUGIN_TYPE_OPTIONS: Array<SelectableValue<string>> = PLUGIN_TYPES.map((value) => ({ label: value, value }));

const DEFAULT_PLUGIN_TYPE = 'prometheus';

async function loadSchema(pluginType: string): Promise<DatasourceConfigSchema> {
  const res = await fetch(`${SCHEMA_BASE_URL}/${pluginType}/dsconfig.json`);
  if (!res.ok) {
    throw new Error(`No schema found for "${pluginType}" (HTTP ${res.status})`);
  }
  const schema = (await res.json()) as DatasourceConfigSchema;
  return resolveBaseFields(schema);
}

type WizardStoryProps = {
  mode: 'tab' | 'wizard';
  /** Selected plugin type — sourced from the story arg so it persists in the URL. */
  pluginType: string;
  /** Updates the `pluginType` story arg (Storybook syncs args to the URL query param). */
  onPluginTypeChange: (pluginType: string) => void;
};

function WizardStory({ mode, pluginType, onPluginTypeChange }: WizardStoryProps) {
  const [schema, setSchema] = useState<DatasourceConfigSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSchema(null);
    loadSchema(pluginType)
      .then((result) => {
        if (!cancelled) {
          setSchema(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pluginType]);

  const selectedOption = useMemo(() => PLUGIN_TYPE_OPTIONS.find((o) => o.value === pluginType), [pluginType]);

  return (
    <div style={{ maxWidth: 1100 }}>
      <Field label="Plugin type" description="Select a datasource plugin to load its configuration schema.">
        <Select
          options={PLUGIN_TYPE_OPTIONS}
          value={selectedOption}
          onChange={(v) => {
            if (v?.value) {
              onPluginTypeChange(v.value);
            }
          }}
          width={50}
        />
      </Field>

      {loading && (
        <div>
          <Spinner size="sm" inline /> Loading schema for {pluginType}…
        </div>
      )}

      {error && (
        <Alert severity="warning" title="Schema unavailable">
          {error}
        </Alert>
      )}

      {schema && (
        <DatasourceConfigWizard
          // Remount when the plugin type or layout changes so internal step /
          // expansion state resets cleanly.
          key={`${pluginType}-${mode}`}
          schema={schema}
          dsUid="story-datasource"
          dsName={schema.pluginName}
          onSuccess={(status, message) => console.log('onSuccess', status, message)}
          onSaving={(saving) => console.log('onSaving', saving)}
          onRetest={() => console.log('onRetest')}
        />
      )}
    </div>
  );
}

export default {
  title: 'ConfigEditor/DatasourceConfigWizard',
  component: DatasourceConfigWizard,
  args: {
    pluginType: DEFAULT_PLUGIN_TYPE,
  },
  argTypes: {
    pluginType: {
      name: 'Plugin type',
      description: 'Datasource plugin whose mock schema is loaded. Synced to the URL as a story arg.',
      control: { type: 'select' },
      options: PLUGIN_TYPES,
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Declarative datasource configuration form driven by a `DatasourceConfigSchema`. ' +
          'Use the dropdown to load a mock schema for different plugin types (defaults to Prometheus). ' +
          'The selected plugin type is stored as a Storybook arg, so it is persisted in the URL query ' +
          'param and survives reloads/sharing. The Grafana backend is stubbed in Storybook, so ' +
          'Save & Test does not persist anything.',
      },
    },
  },
};

// Reads/writes the `pluginType` story arg. Storybook serializes args into the
// URL query param, so changing the dropdown updates the URL (and vice versa).
function usePluginTypeArg() {
  const [args, updateArgs] = useArgs<{ pluginType: string }>();
  return {
    pluginType: args.pluginType ?? DEFAULT_PLUGIN_TYPE,
    setPluginType: (next: string) => updateArgs({ pluginType: next }),
  };
}

/** Step-by-step wizard layout. */
export const Wizard = () => {
  const { pluginType, setPluginType } = usePluginTypeArg();
  return <WizardStory mode="wizard" pluginType={pluginType} onPluginTypeChange={setPluginType} />;
};
