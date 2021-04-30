import { hasCapability, CompatibilityFeature } from "./compatibility"
import semver from "semver";

describe("hasCapability", () => {
  it("returns false with a feature that is not supported", () => {
    const numberOfFeatures = Object.values(CompatibilityFeature).length

    // use an out of range enum value
    expect(hasCapability(numberOfFeatures)).toBeFalsy()
  })

  it("returns true for HEALTH_DIAGNOSTICS_ERROR if the version is supported", () => {
    jest.spyOn(semver, "gte").mockReturnValue(true)

    expect(hasCapability(CompatibilityFeature.HEALTH_DIAGNOSTICS_ERRORS)).toBeTruthy()
  })

  it("returns false for HEALTH_DIAGNOSTICS_ERROR if the version is not supported", () => {
    jest.spyOn(semver, "gte").mockReturnValue(false)

    expect(hasCapability(CompatibilityFeature.HEALTH_DIAGNOSTICS_ERRORS)).toBeFalsy()
  })
})

