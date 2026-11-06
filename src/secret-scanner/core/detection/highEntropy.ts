import { shannonEntropy } from './entropy';
import type { DetectionResult } from './types';

// The prefix-shaped detectors live as data in ../../rules/*.toml. This heuristic
// is algorithmic — an entropy threshold, not a fixed pattern — so it can't be
// expressed as a rule regex and stays here.

export function detectHighEntropy(value: string): DetectionResult | null {
  if (!/^[A-Za-z0-9+/=]{24,}$/.test(value)) {
    return null;
  }
  const hasDigit = /\d/.test(value);
  const hasLetter = /[A-Za-z]/.test(value);
  if (!hasDigit || !hasLetter) {
    return null;
  }
  if (shannonEntropy(value) < 3.6) {
    return null;
  }
  return {
    type: 'high-entropy',
    label: 'HIGH ENTROPY STRING',
    confidence: 'low',
    secret: value,
  };
}
