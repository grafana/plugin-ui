import { config } from "@grafana/runtime";
import { gte } from "semver";
import { testDatasource, BaseTestDatasource } from "./testDatasource";

enum CompatibilityFeature {
  HEALTH_DIAGNOSTICS_ERRORS
}

/**
 * Checks if the currently running version of Grafana supports the feature.
 * 
 * Enables graceful degradation for earlier versions that don't support a given capability.
 *
 * @param feature The feature that requires backwards compatibility
 * @returns True if the Grafana version running can support the feature, otherwise false
 */
 const hasCapability = (feature: CompatibilityFeature): boolean => {
  const version = config.buildInfo.version;

  switch (feature) {
    case CompatibilityFeature.HEALTH_DIAGNOSTICS_ERRORS:
      return gte(version, "8.0.0");
    default:
      return false;
  }
};

/**
 * Calls the override testDatasource function for backwards compatibility if needed.
 *
 * @param baseTestDatasource The original testDatasource function
* @returns The result in the expected format for the Grafana version
 */
 export const healthDiagnosticsErrorsCompat = (baseTestDatasource: BaseTestDatasource) => {
  if (hasCapability(CompatibilityFeature.HEALTH_DIAGNOSTICS_ERRORS)) {
    return baseTestDatasource()
  }

  return testDatasource(baseTestDatasource);
};