import type { DatasourceConfigSchema } from './schema';

import alertmanagerSchema from './datasources/alertmanager.schema.json';
import cloudwatchSchema from './datasources/cloudwatch.schema.json';
import elasticsearchSchema from './datasources/elasticsearch.schema.json';
import grafanaAmazonprometheusDatasourceSchema from './datasources/grafana-amazonprometheus-datasource.schema.json';
import grafanaAppdynamicsDatasourceSchema from './datasources/grafana-appdynamics-datasource.schema.json';
import grafanaAstradbDatasourceSchema from './datasources/grafana-astradb-datasource.schema.json';
import grafanaAthenaDatasourceSchema from './datasources/grafana-athena-datasource.schema.json';
import grafanaAzureDataExplorerDatasourceSchema from './datasources/grafana-azure-data-explorer-datasource.schema.json';
import grafanaAzureMonitorDatasourceSchema from './datasources/grafana-azure-monitor-datasource.schema.json';
import grafanaAzuredevopsDatasourceSchema from './datasources/grafana-azuredevops-datasource.schema.json';
import grafanaAzureprometheusDatasourceSchema from './datasources/grafana-azureprometheus-datasource.schema.json';
import grafanaBigqueryDatasourceSchema from './datasources/grafana-bigquery-datasource.schema.json';
import grafanaClickhouseDatasourceSchema from './datasources/grafana-clickhouse-datasource.schema.json';
import grafanaCockroachdbDatasourceSchema from './datasources/grafana-cockroachdb-datasource.schema.json';
import grafanaDatabricksDatasourceSchema from './datasources/grafana-databricks-datasource.schema.json';
import grafanaDatadogDatasourceSchema from './datasources/grafana-datadog-datasource.schema.json';
import grafanaDynatraceDatasourceSchema from './datasources/grafana-dynatrace-datasource.schema.json';
import grafanaFalconlogscaleDatasourceSchema from './datasources/grafana-falconlogscale-datasource.schema.json';
import grafanaGithubDatasourceSchema from './datasources/grafana-github-datasource.schema.json';
import grafanaGitlabDatasourceSchema from './datasources/grafana-gitlab-datasource.schema.json';
import grafanaGooglesheetsDatasourceSchema from './datasources/grafana-googlesheets-datasource.schema.json';
import grafanaHoneycombDatasourceSchema from './datasources/grafana-honeycomb-datasource.schema.json';
import grafanaIotSitewiseDatasourceSchema from './datasources/grafana-iot-sitewise-datasource.schema.json';
import grafanaJiraDatasourceSchema from './datasources/grafana-jira-datasource.schema.json';
import grafanaLookerDatasourceSchema from './datasources/grafana-looker-datasource.schema.json';
import grafanaMongodbDatasourceSchema from './datasources/grafana-mongodb-datasource.schema.json';
import grafanaMqttDatasourceSchema from './datasources/grafana-mqtt-datasource.schema.json';
import grafanaNewrelicDatasourceSchema from './datasources/grafana-newrelic-datasource.schema.json';
import grafanaOdbcDatasourceSchema from './datasources/grafana-odbc-datasource.schema.json';
import grafanaOpensearchDatasourceSchema from './datasources/grafana-opensearch-datasource.schema.json';
import grafanaOracleDatasourceSchema from './datasources/grafana-oracle-datasource.schema.json';
import grafanaPagerdutyDatasourceSchema from './datasources/grafana-pagerduty-datasource.schema.json';
import grafanaPostgresqlDatasourceSchema from './datasources/grafana-postgresql-datasource.schema.json';
import grafanaPyroscopeDatasourceSchema from './datasources/grafana-pyroscope-datasource.schema.json';
import grafanaRedshiftDatasourceSchema from './datasources/grafana-redshift-datasource.schema.json';
import grafanaSalesforceDatasourceSchema from './datasources/grafana-salesforce-datasource.schema.json';
import grafanaSaphanaDatasourceSchema from './datasources/grafana-saphana-datasource.schema.json';
import grafanaSentryDatasourceSchema from './datasources/grafana-sentry-datasource.schema.json';
import grafanaServicenowDatasourceSchema from './datasources/grafana-servicenow-datasource.schema.json';
import grafanaSnowflakeDatasourceSchema from './datasources/grafana-snowflake-datasource.schema.json';
import grafanaSplunkDatasourceSchema from './datasources/grafana-splunk-datasource.schema.json';
import grafanaSplunkobservabilityDatasourceSchema from './datasources/grafana-splunkobservability-datasource.schema.json';
import grafanaStravaDatasourceSchema from './datasources/grafana-strava-datasource.schema.json';
import grafanaSumologicDatasourceSchema from './datasources/grafana-sumologic-datasource.schema.json';
import grafanaSurrealdbDatasourceSchema from './datasources/grafana-surrealdb-datasource.schema.json';
import grafanaTimestreamDatasourceSchema from './datasources/grafana-timestream-datasource.schema.json';
import grafanaWavefrontDatasourceSchema from './datasources/grafana-wavefront-datasource.schema.json';
import grafanaXRayDatasourceSchema from './datasources/grafana-x-ray-datasource.schema.json';
import grafanaYugabyteDatasourceSchema from './datasources/grafana-yugabyte-datasource.schema.json';
import graphiteSchema from './datasources/graphite.schema.json';
import influxdbSchema from './datasources/influxdb.schema.json';
import jaegerSchema from './datasources/jaeger.schema.json';
import lokiSchema from './datasources/loki.schema.json';
import marcusolssonCsvDatasourceSchema from './datasources/marcusolsson-csv-datasource.schema.json';
import marcusolssonJsonDatasourceSchema from './datasources/marcusolsson-json-datasource.schema.json';
import mssqlSchema from './datasources/mssql.schema.json';
import mysqlSchema from './datasources/mysql.schema.json';
import opentsdbSchema from './datasources/opentsdb.schema.json';
import prometheusSchema from './datasources/prometheus.schema.json';
import stackdriverSchema from './datasources/stackdriver.schema.json';
import tempoSchema from './datasources/tempo.schema.json';
import yesoreyeramInfinityDatasourceSchema from './datasources/yesoreyeram-infinity-datasource.schema.json';
import zipkinSchema from './datasources/zipkin.schema.json';

const asSchema = (s: unknown) => {
  return s as DatasourceConfigSchema;
};

const schemaRegistry = new Map<string, DatasourceConfigSchema>([
  ['alertmanager', asSchema(alertmanagerSchema)],
  ['cloudwatch', asSchema(cloudwatchSchema)],
  ['elasticsearch', asSchema(elasticsearchSchema)],
  ['grafana-amazonprometheus-datasource', asSchema(grafanaAmazonprometheusDatasourceSchema)],
  ['grafana-appdynamics-datasource', asSchema(grafanaAppdynamicsDatasourceSchema)],
  ['grafana-astradb-datasource', asSchema(grafanaAstradbDatasourceSchema)],
  ['grafana-athena-datasource', asSchema(grafanaAthenaDatasourceSchema)],
  ['grafana-azure-data-explorer-datasource', asSchema(grafanaAzureDataExplorerDatasourceSchema)],
  ['grafana-azure-monitor-datasource', asSchema(grafanaAzureMonitorDatasourceSchema)],
  ['grafana-azuredevops-datasource', asSchema(grafanaAzuredevopsDatasourceSchema)],
  ['grafana-azureprometheus-datasource', asSchema(grafanaAzureprometheusDatasourceSchema)],
  ['grafana-bigquery-datasource', asSchema(grafanaBigqueryDatasourceSchema)],
  ['grafana-clickhouse-datasource', asSchema(grafanaClickhouseDatasourceSchema)],
  ['grafana-cockroachdb-datasource', asSchema(grafanaCockroachdbDatasourceSchema)],
  ['grafana-databricks-datasource', asSchema(grafanaDatabricksDatasourceSchema)],
  ['grafana-datadog-datasource', asSchema(grafanaDatadogDatasourceSchema)],
  ['grafana-dynatrace-datasource', asSchema(grafanaDynatraceDatasourceSchema)],
  ['grafana-falconlogscale-datasource', asSchema(grafanaFalconlogscaleDatasourceSchema)],
  ['grafana-github-datasource', asSchema(grafanaGithubDatasourceSchema)],
  ['grafana-gitlab-datasource', asSchema(grafanaGitlabDatasourceSchema)],
  ['grafana-googlesheets-datasource', asSchema(grafanaGooglesheetsDatasourceSchema)],
  ['grafana-honeycomb-datasource', asSchema(grafanaHoneycombDatasourceSchema)],
  ['grafana-iot-sitewise-datasource', asSchema(grafanaIotSitewiseDatasourceSchema)],
  ['grafana-jira-datasource', asSchema(grafanaJiraDatasourceSchema)],
  ['grafana-looker-datasource', asSchema(grafanaLookerDatasourceSchema)],
  ['grafana-mongodb-datasource', asSchema(grafanaMongodbDatasourceSchema)],
  ['grafana-mqtt-datasource', asSchema(grafanaMqttDatasourceSchema)],
  ['grafana-newrelic-datasource', asSchema(grafanaNewrelicDatasourceSchema)],
  ['grafana-odbc-datasource', asSchema(grafanaOdbcDatasourceSchema)],
  ['grafana-opensearch-datasource', asSchema(grafanaOpensearchDatasourceSchema)],
  ['grafana-oracle-datasource', asSchema(grafanaOracleDatasourceSchema)],
  ['grafana-pagerduty-datasource', asSchema(grafanaPagerdutyDatasourceSchema)],
  ['grafana-postgresql-datasource', asSchema(grafanaPostgresqlDatasourceSchema)],
  ['grafana-pyroscope-datasource', asSchema(grafanaPyroscopeDatasourceSchema)],
  ['grafana-redshift-datasource', asSchema(grafanaRedshiftDatasourceSchema)],
  ['grafana-salesforce-datasource', asSchema(grafanaSalesforceDatasourceSchema)],
  ['grafana-saphana-datasource', asSchema(grafanaSaphanaDatasourceSchema)],
  ['grafana-sentry-datasource', asSchema(grafanaSentryDatasourceSchema)],
  ['grafana-servicenow-datasource', asSchema(grafanaServicenowDatasourceSchema)],
  ['grafana-snowflake-datasource', asSchema(grafanaSnowflakeDatasourceSchema)],
  ['grafana-splunk-datasource', asSchema(grafanaSplunkDatasourceSchema)],
  ['grafana-splunkobservability-datasource', asSchema(grafanaSplunkobservabilityDatasourceSchema)],
  ['grafana-strava-datasource', asSchema(grafanaStravaDatasourceSchema)],
  ['grafana-sumologic-datasource', asSchema(grafanaSumologicDatasourceSchema)],
  ['grafana-surrealdb-datasource', asSchema(grafanaSurrealdbDatasourceSchema)],
  ['grafana-timestream-datasource', asSchema(grafanaTimestreamDatasourceSchema)],
  ['grafana-wavefront-datasource', asSchema(grafanaWavefrontDatasourceSchema)],
  ['grafana-x-ray-datasource', asSchema(grafanaXRayDatasourceSchema)],
  ['grafana-yugabyte-datasource', asSchema(grafanaYugabyteDatasourceSchema)],
  ['graphite', asSchema(graphiteSchema)],
  ['influxdb', asSchema(influxdbSchema)],
  ['jaeger', asSchema(jaegerSchema)],
  ['loki', asSchema(lokiSchema)],
  ['marcusolsson-csv-datasource', asSchema(marcusolssonCsvDatasourceSchema)],
  ['marcusolsson-json-datasource', asSchema(marcusolssonJsonDatasourceSchema)],
  ['mssql', asSchema(mssqlSchema)],
  ['mysql', asSchema(mysqlSchema)],
  ['opentsdb', asSchema(opentsdbSchema)],
  ['prometheus', asSchema(prometheusSchema)],
  ['stackdriver', asSchema(stackdriverSchema)],
  ['tempo', asSchema(tempoSchema)],
  ['yesoreyeram-infinity-datasource', asSchema(yesoreyeramInfinityDatasourceSchema)],
  ['zipkin', asSchema(zipkinSchema)],
]);

export function getConfigSchema(pluginType: string): DatasourceConfigSchema | null {
  return schemaRegistry.get(pluginType) ?? null;
}
