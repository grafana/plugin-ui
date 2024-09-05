import { mockHealthCheckDetails, mockHealthCheckResult, mockHealthCheckResultError } from "../test/mocks"
import { testDatasource } from "./testDatasource"

describe("testDatasource", () => {
  it("returns baseTestDatasource response if it is a health check result", async () => {
    const expectedResponse = mockHealthCheckResult()
  
    const baseDatasource = jest.fn().mockResolvedValue(expectedResponse)

    expect(await testDatasource(baseDatasource)).toEqual(expectedResponse)
  })

  it("returns transformed error with error details verbose message if baseTestDatasource throws an error that has a details verbose message", async () => {
    const mockError = mockHealthCheckResultError()
  
    const expectedError = {
      ...mockError,
      message: mockError.details?.verboseMessage
    }

    const baseDatasource = jest.fn().mockRejectedValue(mockError)

    const call = testDatasource(baseDatasource)

    await expect(call).rejects.toThrow(expectedError)
  })

  it("returns transformed error with error details message if baseTestDatasource throws an error that does not have a details verbose message", async () => {
    const mockDetails = mockHealthCheckDetails()
    delete mockDetails?.verboseMessage
    const mockError = mockHealthCheckResultError(mockDetails)
  
    const expectedError = {
      ...mockError,
      message: mockDetails?.message
    }

    const baseDatasource = jest.fn().mockRejectedValue(mockError)

    const call = testDatasource(baseDatasource)

    await expect(call).rejects.toThrow(expectedError)
  })

  it("returns transformed error with error message if baseTestDatasource throws an error that does not have a details verbose message or details message", async () => {  
    const mockError = mockHealthCheckResultError({})
  
    const baseDatasource = jest.fn().mockRejectedValue(mockError)

    const call = testDatasource(baseDatasource)

    await expect(call).rejects.toThrow(mockError)
  })
})