import { HealthCheckResult } from '@grafana/runtime';

export type BaseTestDatasource = () => Promise<Partial<HealthCheckResult> | Error>

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
export const testDatasource = async (baseTestDatasource: BaseTestDatasource) => {
  // the backwards compatibility only affects the health check error messages
  // so only transform the error we give to Grafana
  try {
    const response = await baseTestDatasource()
    return response
  }
  catch (ex) {
    // the priority order of the error message we want returned in the older format
    throw new Error(ex.details?.verboseMessage ?? ex.details?.message ?? ex.message)
  }
}