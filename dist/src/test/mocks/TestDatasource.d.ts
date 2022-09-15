import { HealthCheckResult } from "@grafana/runtime";
import { HealthCheckError, HealthCheckResultDetails, TestDatasourceReturn } from "../../utils/testDatasource";
export declare const mockTestDatasourceReturn: () => TestDatasourceReturn;
export declare const mockHealthCheckResult: () => HealthCheckResult;
export declare const mockHealthCheckDetails: () => HealthCheckResultDetails;
export declare const mockHealthCheckResultError: (details?: HealthCheckResultDetails) => HealthCheckError;
