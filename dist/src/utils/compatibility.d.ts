export declare enum CompatibilityFeature {
    HEALTH_DIAGNOSTICS_ERRORS = 0
}
/**
 * Checks if the currently running version of Grafana supports the feature.
 *
 * Enables graceful degradation for earlier versions that don't support a given capability.
 *
 * @param feature The feature that requires backwards compatibility
 * @returns True if the Grafana version running can support the feature, otherwise false
 */
export declare const hasCompatibility: (feature: CompatibilityFeature) => boolean;
