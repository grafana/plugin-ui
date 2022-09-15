"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthDiagnosticsErrorsCompat = void 0;
const compatibility_1 = require("./compatibility");
const testDatasource_1 = require("./testDatasource");
/**
 * Calls the override testDatasource function for backwards compatibility if needed.
 *
 * @param baseTestDatasource The original testDatasource function
 * @param toggle Accepts a feature toggle. Defaults to false so it is clear when we want this feature turned on.
 * @returns The result in the expected format for the Grafana version
 */
const healthDiagnosticsErrorsCompat = (baseTestDatasource, toggle) => {
    if (toggle && (0, compatibility_1.hasCompatibility)(compatibility_1.CompatibilityFeature.HEALTH_DIAGNOSTICS_ERRORS)) {
        return baseTestDatasource();
    }
    return (0, testDatasource_1.testDatasource)(baseTestDatasource);
};
exports.healthDiagnosticsErrorsCompat = healthDiagnosticsErrorsCompat;
//# sourceMappingURL=compatFeatures.js.map