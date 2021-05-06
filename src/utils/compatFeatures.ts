import { hasCompatibility, CompatibilityFeature } from "./compatibility";
import { BaseTestDatasource, testDatasource, TestDatasourceReturn } from "./testDatasource";

/**
 * Calls the override testDatasource function for backwards compatibility if needed.
 *
 * @param baseTestDatasource The original testDatasource function
 * @returns The result in the expected format for the Grafana version
 */
export const healthDiagnosticsErrorsCompat = (baseTestDatasource: BaseTestDatasource, toggle?: boolean): Promise<TestDatasourceReturn> => {
  if (toggle && hasCompatibility(CompatibilityFeature.HEALTH_DIAGNOSTICS_ERRORS)) {
    return baseTestDatasource()
  }

  return testDatasource(baseTestDatasource);
};
