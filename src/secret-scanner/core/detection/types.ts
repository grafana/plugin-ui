export type SecretConfidence = 'high' | 'medium' | 'low';

export type SecretRewrite = 'literal' | 'template-interpolation' | 'none';

export interface SecretRange {
  start: number;
  end: number;
}

export interface SecretFinding {
  id: string;
  type: string;
  label: string;
  confidence: SecretConfidence;
  secret: string;
  range: SecretRange;
  line: number;
  column: number;
  literal?: SecretRange;
  rewrite?: SecretRewrite;
}

export interface DetectionResult {
  type: string;
  label: string;
  confidence: SecretConfidence;
  secret: string;
}
