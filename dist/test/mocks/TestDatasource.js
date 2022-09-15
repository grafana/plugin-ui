"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockHealthCheckResultError = exports.mockHealthCheckDetails = exports.mockHealthCheckResult = exports.mockTestDatasourceReturn = void 0;
const runtime_1 = require("@grafana/runtime");
const chance_1 = require("chance");
const testDatasource_1 = require("../../utils/testDatasource");
const mockTestDatasourceReturn = () => {
    return (0, chance_1.Chance)().pickone([(0, exports.mockHealthCheckResult)(), (0, exports.mockHealthCheckResultError)()]);
};
exports.mockTestDatasourceReturn = mockTestDatasourceReturn;
const mockHealthCheckResult = () => ({
    status: (0, chance_1.Chance)().pickone(Object.values(runtime_1.HealthStatus)),
    message: (0, chance_1.Chance)().sentence(),
    details: (0, exports.mockHealthCheckDetails)()
});
exports.mockHealthCheckResult = mockHealthCheckResult;
const mockHealthCheckDetails = () => ({
    message: (0, chance_1.Chance)().sentence(),
    verboseMessage: (0, chance_1.Chance)().sentence()
});
exports.mockHealthCheckDetails = mockHealthCheckDetails;
const mockHealthCheckResultError = (details) => new testDatasource_1.HealthCheckError((0, chance_1.Chance)().sentence(), details || (0, exports.mockHealthCheckDetails)());
exports.mockHealthCheckResultError = mockHealthCheckResultError;
//# sourceMappingURL=TestDatasource.js.map