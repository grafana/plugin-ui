import * as compat from "./compatibility"
import * as testDatasourceOverride from "./testDatasource"
import { healthDiagnosticsErrorsCompat } from "./compatFeatures"
import {mockHealthCheckResult, mockHealthCheckResultError} from "../test/mocks"

describe("healthDiagnosticsErrorsCompat", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe("is compatible", () => {
    beforeEach(() => {
      jest.spyOn(compat, "hasCompatibility").mockReturnValue(true)

    })

    it("returns baseTestDatasource response that is a health check result if toggle is true", async () => {
      const expectedResponse = mockHealthCheckResult()
      const baseDatasource = jest.fn().mockResolvedValue(expectedResponse)
  
      const response = await healthDiagnosticsErrorsCompat(baseDatasource, true)
  
      expect(response).toEqual(expectedResponse)
    })

    it("returns override testDatasource response that is a health check result if toggle is false", async () => {
      const expectedResponse = mockHealthCheckResult()
      jest.spyOn(testDatasourceOverride, "testDatasource").mockResolvedValue(expectedResponse)

      const response = await healthDiagnosticsErrorsCompat(jest.fn(), false)
  
      expect(response).toEqual(expectedResponse)
    })

    it("returns override testDatasource response that is a health check result if toggle is not passed in", async () => {
      const expectedResponse = mockHealthCheckResult()
      jest.spyOn(testDatasourceOverride, "testDatasource").mockResolvedValue(expectedResponse)

      const response = await healthDiagnosticsErrorsCompat(jest.fn())
  
      expect(response).toEqual(expectedResponse)
    })

    it("returns baseTestDatasource response that is a health check error if toggle is true", async () => {
      const expectedResponse = mockHealthCheckResultError()
      const baseDatasource = jest.fn().mockRejectedValue(expectedResponse)

      const call = healthDiagnosticsErrorsCompat(baseDatasource, true)

      await expect(call).rejects.toThrow(expectedResponse)
    })

    it("returns override testDatasource response that is a health check error if toggle is false", async () => {
      const expectedResponse = mockHealthCheckResultError()
      jest.spyOn(testDatasourceOverride, "testDatasource").mockRejectedValue(expectedResponse)

      const call = healthDiagnosticsErrorsCompat(jest.fn(), false)

      await expect(call).rejects.toThrow(expectedResponse)
    })

    it("returns override testDatasource response that is a health check error if toggle is not passed in", async () => {
      const expectedResponse = mockHealthCheckResultError()
      jest.spyOn(testDatasourceOverride, "testDatasource").mockRejectedValue(expectedResponse)

      const call = healthDiagnosticsErrorsCompat(jest.fn())

      await expect(call).rejects.toThrow(expectedResponse)
    })
  })

  describe("is not compatible", () => {
    beforeEach(() => {
      jest.spyOn(compat, "hasCompatibility").mockReturnValue(false)
    })

    it("returns override testDatasource response that is a health check result if toggle is true", async () => {
      const expectedResponse = mockHealthCheckResult()
      jest.spyOn(testDatasourceOverride, "testDatasource").mockResolvedValue(expectedResponse)

      const response = await healthDiagnosticsErrorsCompat(jest.fn(), true)
  
      expect(response).toEqual(expectedResponse)
    })

    it("returns base testDatasource response that is a health check result if toggle is false", async () => {
      const expectedResponse = mockHealthCheckResult()
      const baseDatasource = jest.fn().mockResolvedValue(expectedResponse)
  
      const response = await healthDiagnosticsErrorsCompat(baseDatasource, false)
  
      expect(response).toEqual(expectedResponse)
    })

    it("returns base testDatasource response that is a health check result if toggle is not passed in", async () => {
      const expectedResponse = mockHealthCheckResult()
      const baseDatasource = jest.fn().mockResolvedValue(expectedResponse)
  
      const response = await healthDiagnosticsErrorsCompat(baseDatasource)
  
      expect(response).toEqual(expectedResponse)
    })

    it("returns override testDatasource response that is a health check error if toggle is true", async () => {
      const expectedResponse = mockHealthCheckResultError()
      jest.spyOn(testDatasourceOverride, "testDatasource").mockRejectedValue(expectedResponse)

      const call = healthDiagnosticsErrorsCompat(jest.fn(), true)

      await expect(call).rejects.toThrow(expectedResponse)
    })

    it("returns base testDatasource response that is a health check error if toggle is false", async () => {
      const expectedResponse = mockHealthCheckResultError()
      jest.spyOn(testDatasourceOverride, "testDatasource").mockRejectedValue(expectedResponse)

      const call = healthDiagnosticsErrorsCompat(jest.fn(), false)

      await expect(call).rejects.toThrow(expectedResponse)
    })

    it("returns base testDatasource response that is a health check error if toggle is not passed in", async () => {
      const expectedResponse = mockHealthCheckResultError()
      jest.spyOn(testDatasourceOverride, "testDatasource").mockRejectedValue(expectedResponse)

      const call = healthDiagnosticsErrorsCompat(jest.fn())

      await expect(call).rejects.toThrow(expectedResponse)
    })
  })
})
