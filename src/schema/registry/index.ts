import type { DatasourceConfigSchema } from '../schema';

import alertmanagerSchema from './alertmanager.schema.json';
import cloudwatchSchema from './cloudwatch.schema.json';
import elasticsearchSchema from './elasticsearch.schema.json';
import grafanaAmazonprometheusDatasourceSchema from './grafana-amazonprometheus-datasource.schema.json';
import grafanaAppdynamicsDatasourceSchema from './grafana-appdynamics-datasource.schema.json';
import grafanaAstradbDatasourceSchema from './grafana-astradb-datasource.schema.json';
import grafanaAthenaDatasourceSchema from './grafana-athena-datasource.schema.json';
import grafanaAzureDataExplorerDatasourceSchema from './grafana-azure-data-explorer-datasource.schema.json';
import grafanaAzureMonitorDatasourceSchema from './grafana-azure-monitor-datasource.schema.json';
import grafanaAzuredevopsDatasourceSchema from './grafana-azuredevops-datasource.schema.json';
import grafanaAzureprometheusDatasourceSchema from './grafana-azureprometheus-datasource.schema.json';
import grafanaBigqueryDatasourceSchema from './grafana-bigquery-datasource.schema.json';
import grafanaClickhouseDatasourceSchema from './grafana-clickhouse-datasource.schema.json';
import grafanaCockroachdbDatasourceSchema from './grafana-cockroachdb-datasource.schema.json';
import grafanaDatabricksDatasourceSchema from './grafana-databricks-datasource.schema.json';
import grafanaDatadogDatasourceSchema from './grafana-datadog-datasource.schema.json';
import grafanaDynatraceDatasourceSchema from './grafana-dynatrace-datasource.schema.json';
import grafanaFalconlogscaleDatasourceSchema from './grafana-falconlogscale-datasource.schema.json';
import grafanaGithubDatasourceSchema from './grafana-github-datasource.schema.json';
import grafanaGitlabDatasourceSchema from './grafana-gitlab-datasource.schema.json';
import grafanaGooglesheetsDatasourceSchema from './grafana-googlesheets-datasource.schema.json';
import grafanaHoneycombDatasourceSchema from './grafana-honeycomb-datasource.schema.json';
import grafanaIotSitewiseDatasourceSchema from './grafana-iot-sitewise-datasource.schema.json';
import grafanaJiraDatasourceSchema from './grafana-jira-datasource.schema.json';
import grafanaLookerDatasourceSchema from './grafana-looker-datasource.schema.json';
import grafanaMongodbDatasourceSchema from './grafana-mongodb-datasource.schema.json';
import grafanaMqttDatasourceSchema from './grafana-mqtt-datasource.schema.json';
import grafanaNewrelicDatasourceSchema from './grafana-newrelic-datasource.schema.json';
import grafanaOdbcDatasourceSchema from './grafana-odbc-datasource.schema.json';
import grafanaOpensearchDatasourceSchema from './grafana-opensearch-datasource.schema.json';
import grafanaOracleDatasourceSchema from './grafana-oracle-datasource.schema.json';
import grafanaPagerdutyDatasourceSchema from './grafana-pagerduty-datasource.schema.json';
import grafanaPostgresqlDatasourceSchema from './grafana-postgresql-datasource.schema.json';
import grafanaPyroscopeDatasourceSchema from './grafana-pyroscope-datasource.schema.json';
import grafanaRedshiftDatasourceSchema from './grafana-redshift-datasource.schema.json';
import grafanaSalesforceDatasourceSchema from './grafana-salesforce-datasource.schema.json';
import grafanaSaphanaDatasourceSchema from './grafana-saphana-datasource.schema.json';
import grafanaSentryDatasourceSchema from './grafana-sentry-datasource.schema.json';
import grafanaServicenowDatasourceSchema from './grafana-servicenow-datasource.schema.json';
import grafanaSnowflakeDatasourceSchema from './grafana-snowflake-datasource.schema.json';
import grafanaSplunkDatasourceSchema from './grafana-splunk-datasource.schema.json';
import grafanaSplunkobservabilityDatasourceSchema from './grafana-splunkobservability-datasource.schema.json';
import grafanaStravaDatasourceSchema from './grafana-strava-datasource.schema.json';
import grafanaSumologicDatasourceSchema from './grafana-sumologic-datasource.schema.json';
import grafanaSurrealdbDatasourceSchema from './grafana-surrealdb-datasource.schema.json';
import grafanaTimestreamDatasourceSchema from './grafana-timestream-datasource.schema.json';
import grafanaWavefrontDatasourceSchema from './grafana-wavefront-datasource.schema.json';
import grafanaXRayDatasourceSchema from './grafana-x-ray-datasource.schema.json';
import grafanaYugabyteDatasourceSchema from './grafana-yugabyte-datasource.schema.json';
import graphiteSchema from './graphite.schema.json';
import influxdbSchema from './influxdb.schema.json';
import jaegerSchema from './jaeger.schema.json';
import lokiSchema from './loki.schema.json';
import marcusolssonCsvDatasourceSchema from './marcusolsson-csv-datasource.schema.json';
import marcusolssonJsonDatasourceSchema from './marcusolsson-json-datasource.schema.json';
import mssqlSchema from './mssql.schema.json';
import mysqlSchema from './mysql.schema.json';
import opentsdbSchema from './opentsdb.schema.json';
import prometheusSchema from './prometheus.schema.json';
import stackdriverSchema from './stackdriver.schema.json';
import tempoSchema from './tempo.schema.json';
import yesoreyeramInfinityDatasourceSchema from './yesoreyeram-infinity-datasource.schema.json';
import zipkinSchema from './zipkin.schema.json';

const asSchema = (s: unknown) => s as DatasourceConfigSchema;

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
