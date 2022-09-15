"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDatasource = exports.HealthCheckError = void 0;
class HealthCheckError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'HealthCheckError';
    }
}
exports.HealthCheckError = HealthCheckError;
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
const testDatasource = (baseTestDatasource) => baseTestDatasource()
    // the backwards compatibility only affects the health check error messages
    // so only transform the error we give to Grafana
    .catch(ex => {
    var _a, _b, _c, _d;
    throw new Error((_d = (_b = (_a = ex.details) === null || _a === void 0 ? void 0 : _a.verboseMessage) !== null && _b !== void 0 ? _b : (_c = ex.details) === null || _c === void 0 ? void 0 : _c.message) !== null && _d !== void 0 ? _d : ex.message);
});
exports.testDatasource = testDatasource;
//# sourceMappingURL=testDatasource.js.map