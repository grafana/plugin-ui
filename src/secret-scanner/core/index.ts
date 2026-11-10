export { scanCode, createCodeScanner, offsetToPosition, shannonEntropy } from './scanCode';
export { scanText, createTextScanner } from './scanText';
export { memoizeLatest } from './memoizeLatest';
export { DEFAULT_DEBOUNCE_MS } from './constants';
export type { SecretFinding, SecretConfidence, SecretRange, SecretRewrite, DetectionResult } from './detection/types';
export type { SecretRewriter, ApplyResult } from './rewrite';
export { applySecretReference, buildSecretReference, k6SecretRewriter } from './k6Rewriter';
export { maskSecret, suggestSecretName, getFindingSignature } from './secretScanner.utils';
