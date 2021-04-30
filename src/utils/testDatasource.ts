import { HealthCheckResult } from '@grafana/runtime';

// These are from core Grafana - they are not exported
export type HealthCheckResultDetails = Record<string, any> | undefined
export class HealthCheckError extends Error {
  details: HealthCheckResultDetails;

  constructor(message: string, details: HealthCheckResultDetails) {
    super(message);
    this.details = details;
    this.name = 'HealthCheckError';
  }
}

export type TestDatasourceReturn = Partial<HealthCheckResult> | Error
export type BaseTestDatasource = () => Promise<TestDatasourceReturn>

/**
 * Override function for testDatasource in Grafana for the health check
 * 
 * There is a new error format that is introduced in Grafana 8 which is not backwards compatible by default
 * 
 * This transforms the health check result into the old format if Grafana <8 is being used
 *
 * @param baseTestDatasource The original testDatasource function
 * @returns Either the health check result if the health check was successful or an error that is handled later by Grafana
 */
export const testDatasource = (baseTestDatasource: BaseTestDatasource): Promise<TestDatasourceReturn> => 
  baseTestDatasource()
    // the backwards compatibility only affects the health check error messages
    // so only transform the error we give to Grafana
    .catch(ex => {
      throw new Error(ex.details?.verboseMessage ?? ex.details?.message ?? ex.message)
    })