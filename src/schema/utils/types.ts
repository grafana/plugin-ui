export type TroubleShootingContext = {
  label: string;
  key: string;
  target: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: unknown;
  options?: string[];
  section?: string;
  dependsOn?: string;
};
