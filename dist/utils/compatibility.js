"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasCompatibility = exports.CompatibilityFeature = void 0;
const runtime_1 = require("@grafana/runtime");
const semver_1 = require("semver");
var CompatibilityFeature;
(function (CompatibilityFeature) {
    CompatibilityFeature[CompatibilityFeature["HEALTH_DIAGNOSTICS_ERRORS"] = 0] = "HEALTH_DIAGNOSTICS_ERRORS";
})(CompatibilityFeature = exports.CompatibilityFeature || (exports.CompatibilityFeature = {}));
/**
 * Checks if the currently running version of Grafana supports the feature.
 *
 * Enables graceful degradation for earlier versions that don't support a given capability.
 *
 * @param feature The feature that requires backwards compatibility
 * @returns True if the Grafana version running can support the feature, otherwise false
 */
const hasCompatibility = (feature) => {
    const version = runtime_1.config.buildInfo.version;
    switch (feature) {
        case CompatibilityFeature.HEALTH_DIAGNOSTICS_ERRORS:
            return (0, semver_1.gte)(version, "8.0.0");
        default:
            return false;
    }
};
exports.hasCompatibility = hasCompatibility;
//# sourceMappingURL=compatibility.js.map