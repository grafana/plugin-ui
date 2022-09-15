import { HealthCheckResult } from '@grafana/runtime';
export declare type HealthCheckResultDetails = Record<string, any> | undefined;
export declare class HealthCheckError extends Error {
    details: HealthCheckResultDetails;
    constructor(message: string, details: HealthCheckResultDetails);
}
export declare type TestDatasourceReturn = Partial<HealthCheckResult> | Error;
export declare type BaseTestDatasource = () => Promise<TestDatasourceReturn>;
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
export declare const testDatasource: (baseTestDatasource: BaseTestDatasource) => Promise<TestDatasourceReturn>;
