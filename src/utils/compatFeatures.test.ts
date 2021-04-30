import * as compat from "./compatibility"
import { mockHealthCheckResult, mockHealthCheckResultError } from "../test/mocks/TestDatasource"
import * as testDatasourceOverride from "./testDatasource"
import { healthDiagnosticsErrorsCompat } from "./compatFeatures"

describe("healthDiagnosticsErrorsCompat", () => {
  describe("is compatible", () => {
    beforeEach(() => {
      jest.spyOn(compat, "hasCapability").mockReturnValue(true)
    })

    it("returns baseTestDatasource response that is a health check result", async () => {
      const expectedResponse = mockHealthCheckResult() 
      const mockBaseTestDatasource = jest.fn().mockResolvedValue(expectedResponse)

      const response = await healthDiagnosticsErrorsCompat(mockBaseTestDatasource)

      expect(response).toEqual(expectedResponse)
    })

    it("returns baseTestDatasource response that is a health check error", async () => {
      const expectedResponse = mockHealthCheckResultError()
      const mockBaseTestDatasource = jest.fn().mockRejectedValue(expectedResponse)

      const response = healthDiagnosticsErrorsCompat(mockBaseTestDatasource)

      await expect(response).rejects.toThrow(expectedResponse)
    })
  })

  describe("is not compatible", () => {
    beforeEach(() => {
      jest.spyOn(compat, "hasCapability").mockReturnValue(false)
    })

    it("returns override testDatasource response that is a health check result", async () => {
      const expectedResponse = mockHealthCheckResult() 
      jest.spyOn(testDatasourceOverride, "testDatasource").mockResolvedValue(expectedResponse)

      const call = await healthDiagnosticsErrorsCompat(jest.fn())

      expect(call).toEqual(expectedResponse)
    })

    it("returns override testDatasource response that is a health check error", async () => {
      const expectedResponse = mockHealthCheckResultError()
      jest.spyOn(testDatasourceOverride, "testDatasource").mockRejectedValue(expectedResponse)

      const call = healthDiagnosticsErrorsCompat(jest.fn())

      await expect(call).rejects.toThrow(expectedResponse)
    })
  })
})