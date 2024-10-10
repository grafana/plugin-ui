import { hasCompatibility, CompatibilityFeature } from './compatibility';
import semver from 'semver';

describe('hasCompatibility', () => {
  it('returns false with a feature that is not supported', () => {
    const numberOfFeatures = Object.values(CompatibilityFeature).length;

    // use an out of range enum value
    expect(hasCompatibility(numberOfFeatures)).toBeFalsy();
  });

  it('returns true for HEALTH_DIAGNOSTICS_ERROR if the version is supported', () => {
    jest.spyOn(semver, 'gte').mockReturnValue(true);

    expect(hasCompatibility(CompatibilityFeature.HEALTH_DIAGNOSTICS_ERRORS)).toBeTruthy();
  });

  it('returns false for HEALTH_DIAGNOSTICS_ERROR if the version is not supported', () => {
    jest.spyOn(semver, 'gte').mockReturnValue(false);

    expect(hasCompatibility(CompatibilityFeature.HEALTH_DIAGNOSTICS_ERRORS)).toBeFalsy();
  });

  it('returns true for SECURE_SOCKS_PROXY if the version is supported', () => {
    jest.spyOn(semver, 'gte').mockReturnValue(true);

    expect(hasCompatibility(CompatibilityFeature.SECURE_SOCKS_PROXY)).toBeTruthy();
  });

  it('returns false for SECURE_SOCKS_PROXY if the version is not supported', () => {
    jest.spyOn(semver, 'gte').mockReturnValue(false);

    expect(hasCompatibility(CompatibilityFeature.SECURE_SOCKS_PROXY)).toBeFalsy();
  });
});
