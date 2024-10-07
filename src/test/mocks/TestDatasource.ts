import { HealthCheckResult, HealthStatus } from '@grafana/runtime';
import { Chance } from 'chance';
import { HealthCheckError, HealthCheckResultDetails, TestDatasourceReturn } from '../../utils/testDatasource';

export const mockTestDatasourceReturn = (): TestDatasourceReturn => {
  return Chance().pickone([mockHealthCheckResult(), mockHealthCheckResultError()]);
};

export const mockHealthCheckResult = (): HealthCheckResult => ({
  status: Chance().pickone(Object.values(HealthStatus)),
  message: Chance().sentence(),
  details: mockHealthCheckDetails(),
});

export const mockHealthCheckDetails = (): HealthCheckResultDetails => ({
  message: Chance().sentence(),
  verboseMessage: Chance().sentence(),
});

export const mockHealthCheckResultError = (details?: HealthCheckResultDetails): HealthCheckError =>
  new HealthCheckError(Chance().sentence(), details || mockHealthCheckDetails());
