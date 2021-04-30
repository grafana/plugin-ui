import { config } from "@grafana/runtime";
import { gte } from "semver";

export enum CompatibilityFeature {
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
 export const hasCompatibility = (feature: CompatibilityFeature): boolean => {
  const version = config.buildInfo.version;

  switch (feature) {
    case CompatibilityFeature.HEALTH_DIAGNOSTICS_ERRORS:
      return gte(version, "8.0.0");
    default:
      return false;
  }
};
